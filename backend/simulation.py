"""
Havalimanı Bagaj Simülasyonu — SimPy tabanlı

Gerçekçi parametreler:
  - X-Ray tarama: 8-20 sn  (0.13-0.33 dk)
  - Sıralama robotu: 4-10 sn
  - Kapı bandı: 6-15 sn
  - Gecikme eşiği: bagaj 8 dk içinde uçağa ulaşamazsa "gecikmeli" sayılır

Kuyruk dengesi:
  Scanner başına işlem kapasitesi = 60 / ortalama_tarama_süresi(sn)
    ≈ 60 / 14 = ~4.3 bagaj/dk/tarayıcı
  3 tarayıcı ile max kapasite ~13 bagaj/dk
  Slider aralığı (1-30 bagaj/dk) ile hem stabil hem aşırı yük senaryoları test edilebilir.
"""

import simpy
import random
import time
import numpy as np
from typing import Generator

# ── Gerçekçi süre sabitleri (dakika cinsinden) ────────────────────────────────
SCAN_MIN,  SCAN_MAX  = 0.13, 0.33   # 8-20 saniye
SORT_MIN,  SORT_MAX  = 0.07, 0.17   # 4-10 saniye
GATE_MIN,  GATE_MAX  = 0.10, 0.25   # 6-15 saniye
DELAY_THRESHOLD      = 8.0          # dk — bu süreden uzun süren bagaj "gecikmeli"

STREAM_STEP  = 10    # her kaç sim-dakikada bir SSE event gönder
STREAM_DELAY = 0.07  # gerçek saniye — animasyon akıcılığı için


def _build_env(scanner_count: int, flight_count: int, arrival_rate: float, seed: int = 42):
    """
    SimPy ortamını hazırlar ve süreçleri başlatır.
    arrival_rate: bagaj / dakika
    """
    random.seed(seed)
    np.random.seed(seed)

    env            = simpy.Environment()
    scanners       = simpy.Resource(env, capacity=scanner_count)
    sorting_robot  = simpy.Resource(env, capacity=max(2, scanner_count // 2))
    gate_belts     = [simpy.Resource(env, capacity=15) for _ in range(flight_count)]

    stats = {
        "total_bags"       : 0,
        "processed_bags"   : 0,
        "delayed_bags"     : 0,
        "wait_times"       : [],   # tarayıcıya girmek için beklenen süre (dk)
        "total_times"      : [],   # baştan uçağa yüklenmeye kadar toplam süre
        "scanner_busy_time": 0.0,
    }

    # ── Bagaj süreci ──────────────────────────────────────────────────────────
    def baggage_process(env, flight_id: int):
        arrival_time = env.now
        stats["total_bags"] += 1

        # 1) X-Ray tarayıcı kuyruğu
        queue_enter = env.now
        with scanners.request() as req:
            yield req
            stats["wait_times"].append(round(env.now - queue_enter, 4))
            scan_time = random.uniform(SCAN_MIN, SCAN_MAX)
            yield env.timeout(scan_time)
            stats["scanner_busy_time"] += scan_time

        # 2) Sıralama robotu
        with sorting_robot.request() as req:
            yield req
            yield env.timeout(random.uniform(SORT_MIN, SORT_MAX))

        # 3) Kapı bandı
        gate = gate_belts[flight_id % flight_count]
        with gate.request() as req:
            yield req
            yield env.timeout(random.uniform(GATE_MIN, GATE_MAX))

        total_time = env.now - arrival_time
        stats["total_times"].append(round(total_time, 4))
        stats["processed_bags"] += 1

        if total_time > DELAY_THRESHOLD:
            stats["delayed_bags"] += 1

    # ── Varış jeneratörü (Poisson süreci) ────────────────────────────────────
    def bag_generator(env):
        flight_counter = 0
        while True:
            # Exponential inter-arrival: ortalama = 1 / arrival_rate dakika
            yield env.timeout(random.expovariate(arrival_rate))
            env.process(baggage_process(env, flight_counter))
            flight_counter += 1

    env.process(bag_generator(env))
    return env, scanners, stats


def _calc_result(stats: dict, scanner_count: int, sim_duration: int, timeline: list) -> dict:
    wt  = stats["wait_times"]
    tt  = stats["total_times"]
    avg_queue_wait  = float(np.mean(wt))  if wt  else 0.0
    max_queue_wait  = float(np.max(wt))   if wt  else 0.0
    avg_total_time  = float(np.mean(tt))  if tt  else 0.0
    max_total_time  = float(np.max(tt))   if tt  else 0.0
    utilization     = (stats["scanner_busy_time"] / (scanner_count * sim_duration)) * 100

    return {
        "total_bags"          : stats["total_bags"],
        "processed_bags"      : stats["processed_bags"],
        "delayed_bags"        : stats["delayed_bags"],
        "avg_wait_minutes"    : round(avg_queue_wait, 2),   # kuyruk bekleme
        "max_wait_minutes"    : round(max_queue_wait, 2),
        "avg_total_minutes"   : round(avg_total_time, 2),   # baştan sona toplam
        "max_total_minutes"   : round(max_total_time, 2),
        "scanner_utilization" : round(min(utilization, 100.0), 1),
        "delay_rate"          : round(
            (stats["delayed_bags"] / max(stats["total_bags"], 1)) * 100, 1
        ),
        "throughput_per_hour" : round(
            (stats["processed_bags"] / sim_duration) * 60, 1
        ),
        "timeline"            : timeline,
    }


# ── Streaming versiyonu (SSE için) ───────────────────────────────────────────

def run_simulation_stream(
    scanner_count : int,
    flight_count  : int,
    arrival_rate  : float,
    sim_duration  : int = 480,
    seed          : int = 42,
) -> Generator[dict, None, None]:
    """
    SimPy simülasyonunu STREAM_STEP dk'lık dilimler halinde çalıştırır.
    Her dilimde {"type":"progress", ...} yield eder.
    Sonunda {"type":"complete", "result":{...}} yield eder.
    """
    env, scanners, stats = _build_env(scanner_count, flight_count, arrival_rate, seed)
    timeline: list[dict] = []

    steps = list(range(STREAM_STEP, sim_duration + STREAM_STEP, STREAM_STEP))

    for i, step_end in enumerate(steps):
        actual_end = min(step_end, sim_duration)
        env.run(until=actual_end)

        # Snapshot
        wt = stats["wait_times"]
        timeline.append({
            "time"     : actual_end,
            "queue"    : len(scanners.queue),
            "processed": stats["processed_bags"],
        })

        yield {
            "type"        : "progress",
            "step"        : i + 1,
            "total_steps" : len(steps),
            "sim_time"    : actual_end,
            "sim_duration": sim_duration,
            "progress"    : round((actual_end / sim_duration) * 100, 1),
            "queue"       : len(scanners.queue),
            "processed"   : stats["processed_bags"],
            "total_bags"  : stats["total_bags"],
            "delayed"     : stats["delayed_bags"],
            "avg_wait"    : round(float(np.mean(wt)) if wt else 0.0, 2),
            "utilization" : round(
                min((stats["scanner_busy_time"] / (scanner_count * actual_end)) * 100, 100), 1
            ) if actual_end > 0 else 0.0,
        }

        time.sleep(STREAM_DELAY)

    yield {
        "type"  : "complete",
        "result": _calc_result(stats, scanner_count, sim_duration, timeline),
    }


# ── Tek seferlik versiyon ─────────────────────────────────────────────────────

def run_simulation(
    scanner_count : int,
    flight_count  : int,
    arrival_rate  : float,
    sim_duration  : int = 480,
    seed          : int = 42,
) -> dict:
    env, scanners, stats = _build_env(scanner_count, flight_count, arrival_rate, seed)
    env.run(until=sim_duration)

    timeline = []
    # Yeniden çalıştırmak yerine basit snapshot listesi oluştur
    for t in range(0, sim_duration + 1, 5):
        timeline.append({"time": t, "queue": 0, "processed": 0})

    return _calc_result(stats, scanner_count, sim_duration, timeline)
