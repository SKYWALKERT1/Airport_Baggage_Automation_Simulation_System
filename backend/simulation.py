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
STREAM_DELAY = 0.2  # gerçek saniye — animasyon akıcılığı için (artırıldı ki görsel log izlenebilsin)

# ── Uçuş kodları ve şehirler (log'larda görünecek) ───────────────────────────
FLIGHT_CODES = [
    ("TK-2034", "İstanbul → Londra"),
    ("TK-1987", "İstanbul → Paris"),
    ("TK-3021", "İstanbul → Berlin"),
    ("TK-4455", "İstanbul → New York"),
    ("TK-1122", "İstanbul → Dubai"),
    ("TK-7788", "İstanbul → Tokyo"),
    ("TK-5566", "İstanbul → Roma"),
    ("TK-9900", "İstanbul → Amsterdam"),
    ("TK-3344", "İstanbul → Barselona"),
    ("TK-6677", "İstanbul → Moskova"),
    ("PC-1201", "İstanbul → Antalya"),
    ("PC-2302", "İstanbul → İzmir"),
    ("AJ-4410", "İstanbul → Baku"),
    ("LH-1830", "İstanbul → Frankfurt"),
    ("BA-8821", "İstanbul → Manchester"),
    ("EK-7703", "İstanbul → Abu Dhabi"),
    ("QR-3390", "İstanbul → Doha"),
    ("AF-1156", "İstanbul → Lyon"),
    ("SU-2041", "İstanbul → St.Petersburg"),
    ("KL-1680", "İstanbul → Eindhoven"),
]

BAGGAGE_TYPES = ["🧳", "💼", "🎒", "👜", "🛄"]
PASSENGER_NAMES = [
    "Ahmet Y.", "Elif K.", "Mehmet T.", "Zeynep S.", "Ali D.",
    "Fatma Ö.", "Murat B.", "Ayşe C.", "Hasan R.", "Selin A.",
    "Emre G.", "Deniz K.", "Burak M.", "Canan E.", "Oğuz H.",
    "Derya P.", "Kaan V.", "Sibel L.", "Tolga F.", "Neslihan İ.",
    "Yusuf Ç.", "Merve U.", "Serkan N.", "Büşra Ş.", "Onur Z.",
    "Gizem T.", "Barış A.", "Pınar D.", "Cem K.", "Tuğçe Y.",
]


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

    # Log events — her adımda frontend'e gönderilecek
    log_buffer: list[dict] = []

    bag_counter = [0]  # mutable counter for closures

    # ── Bagaj süreci ──────────────────────────────────────────────────────────
    def baggage_process(env, flight_id: int):
        arrival_time = env.now
        stats["total_bags"] += 1
        bag_counter[0] += 1
        bag_id = f"BAG-{bag_counter[0]:05d}"

        flight_idx = flight_id % len(FLIGHT_CODES)
        flight_code, flight_route = FLIGHT_CODES[flight_idx]
        bag_icon = random.choice(BAGGAGE_TYPES)
        passenger = random.choice(PASSENGER_NAMES)

        # Log: Bagaj sisteme giriş
        log_buffer.append({
            "time": round(env.now, 2),
            "bag_id": bag_id,
            "flight": flight_code,
            "route": flight_route,
            "passenger": passenger,
            "icon": bag_icon,
            "stage": "arrival",
            "message": f"{passenger} — {bag_icon} {bag_id} sisteme giriş yaptı",
            "detail": f"Uçuş: {flight_code} ({flight_route})",
            "status": "info",
        })

        # 1) X-Ray tarayıcı kuyruğu
        queue_enter = env.now
        with scanners.request() as req:
            yield req
            wait_time = round(env.now - queue_enter, 4)
            stats["wait_times"].append(wait_time)

            # Log: X-Ray tarama başlıyor
            log_buffer.append({
                "time": round(env.now, 2),
                "bag_id": bag_id,
                "flight": flight_code,
                "route": flight_route,
                "passenger": passenger,
                "icon": "🔍",
                "stage": "scan",
                "message": f"{bag_id} X-Ray taramasına alındı",
                "detail": f"Kuyruk bekleme: {round(wait_time * 60, 1)} sn",
                "status": "processing",
            })

            scan_time = random.uniform(SCAN_MIN, SCAN_MAX)
            yield env.timeout(scan_time)
            stats["scanner_busy_time"] += scan_time

        # Log: Tarama tamamlandı
        scan_result = random.choices(
            ["Temiz — güvenlik onayı verildi", "Temiz — ek kontrol gerektirmez", "Temiz — standart bagaj"],
            weights=[50, 30, 20]
        )[0]
        log_buffer.append({
            "time": round(env.now, 2),
            "bag_id": bag_id,
            "flight": flight_code,
            "route": flight_route,
            "passenger": passenger,
            "icon": "✅",
            "stage": "scan_done",
            "message": f"{bag_id} tarama tamamlandı",
            "detail": scan_result,
            "status": "success",
        })

        # 2) Sıralama robotu
        with sorting_robot.request() as req:
            yield req
            log_buffer.append({
                "time": round(env.now, 2),
                "bag_id": bag_id,
                "flight": flight_code,
                "route": flight_route,
                "passenger": passenger,
                "icon": "🤖",
                "stage": "sorting",
                "message": f"{bag_id} sıralama bandına yönlendirildi",
                "detail": f"Hedef kapı: Gate {(flight_id % flight_count) + 1}",
                "status": "processing",
            })
            yield env.timeout(random.uniform(SORT_MIN, SORT_MAX))

        # 3) Kapı bandı
        gate = gate_belts[flight_id % flight_count]
        gate_num = (flight_id % flight_count) + 1
        with gate.request() as req:
            yield req
            log_buffer.append({
                "time": round(env.now, 2),
                "bag_id": bag_id,
                "flight": flight_code,
                "route": flight_route,
                "passenger": passenger,
                "icon": "🛤️",
                "stage": "gate",
                "message": f"{bag_id} Gate-{gate_num} bandına yükleniyor",
                "detail": f"{flight_code} uçuşu için hazırlanıyor",
                "status": "processing",
            })
            yield env.timeout(random.uniform(GATE_MIN, GATE_MAX))

        total_time = env.now - arrival_time
        stats["total_times"].append(round(total_time, 4))
        stats["processed_bags"] += 1

        is_delayed = total_time > DELAY_THRESHOLD
        if is_delayed:
            stats["delayed_bags"] += 1

        # Log: Bagaj uçağa yüklendi
        log_buffer.append({
            "time": round(env.now, 2),
            "bag_id": bag_id,
            "flight": flight_code,
            "route": flight_route,
            "passenger": passenger,
            "icon": "✈️" if not is_delayed else "⚠️",
            "stage": "loaded",
            "message": f"{bag_id} {'uçağa yüklendi ✓' if not is_delayed else 'GECİKMELİ — uçağa yüklendi'}",
            "detail": f"Toplam süre: {round(total_time, 2)} dk | {flight_code}",
            "status": "success" if not is_delayed else "warning",
        })

    # ── Varış jeneratörü (Poisson süreci) ────────────────────────────────────
    def bag_generator(env):
        flight_counter = 0
        while True:
            # Exponential inter-arrival: ortalama = 1 / arrival_rate dakika
            yield env.timeout(random.expovariate(arrival_rate))
            env.process(baggage_process(env, flight_counter))
            flight_counter += 1

    env.process(bag_generator(env))
    return env, scanners, stats, log_buffer


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
    env, scanners, stats, log_buffer = _build_env(scanner_count, flight_count, arrival_rate, seed)
    timeline: list[dict] = []

    steps = list(range(STREAM_STEP, sim_duration + STREAM_STEP, STREAM_STEP))

    for i, step_end in enumerate(steps):
        actual_end = min(step_end, sim_duration)
        log_buffer.clear()  # Clear before running so we only get this step's logs
        env.run(until=actual_end)

        # Snapshot
        wt = stats["wait_times"]
        timeline.append({
            "time"     : actual_end,
            "queue"    : len(scanners.queue),
            "processed": stats["processed_bags"],
        })

        # Grab latest logs (max 15 per step to keep payloads reasonable)
        step_logs = log_buffer[-15:] if len(log_buffer) > 15 else list(log_buffer)

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
            "logs"        : step_logs,
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
    env, scanners, stats, _log_buffer = _build_env(scanner_count, flight_count, arrival_rate, seed)
    env.run(until=sim_duration)

    timeline = []
    # Yeniden çalıştırmak yerine basit snapshot listesi oluştur
    for t in range(0, sim_duration + 1, 5):
        timeline.append({"time": t, "queue": 0, "processed": 0})

    return _calc_result(stats, scanner_count, sim_duration, timeline)

