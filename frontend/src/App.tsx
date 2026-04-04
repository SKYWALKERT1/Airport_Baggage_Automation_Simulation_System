import { useState, useRef, useCallback } from "react";
import { runSimulationStream } from "./api/simulation";
import type { SimParams, SimResult, ProgressEvent, TimelinePoint } from "./api/simulation";
import ParameterPanel from "./components/ParameterPanel";
import StatsGrid from "./components/StatsGrid";
import TimelineChart from "./components/TimelineChart";
import LiveProgress from "./components/LiveProgress";

const DEFAULT_PARAMS: SimParams = {
  scanner_count: 3,
  flight_count: 5,
  arrival_rate: 10,
  sim_duration: 480,
};

type Phase = "idle" | "running" | "complete";

export default function App() {
  const [params, setParams] = useState<SimParams>(DEFAULT_PARAMS);
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<SimResult | null>(null);
  const [liveEvent, setLiveEvent] = useState<ProgressEvent | null>(null);
  const [liveTimeline, setLiveTimeline] = useState<TimelinePoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleRun = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();

    setPhase("running");
    setResult(null);
    setError(null);
    setLiveEvent(null);
    setLiveTimeline([]);

    abortRef.current = runSimulationStream(
      params,
      // onProgress
      (evt) => {
        setLiveEvent(evt);
        setLiveTimeline((prev) => [
          ...prev,
          { time: evt.sim_time, queue: evt.queue, processed: evt.processed },
        ]);
      },
      // onComplete
      (res) => {
        setResult(res);
        setPhase("complete");
      },
      // onError
      (msg) => {
        setError(msg);
        setPhase("idle");
      }
    );
  }, [params]);

  const handleReset = () => {
    if (abortRef.current) abortRef.current.abort();
    setPhase("idle");
    setResult(null);
    setLiveEvent(null);
    setLiveTimeline([]);
    setError(null);
  };

  return (
    <div style={{ background: "#04080f", minHeight: "100vh" }}>
      {/* Animated top bar */}
      <div className="top-accent" style={{ height: "3px", width: "100%" }} />

      {/* Header */}
      <header style={{
        background: "rgba(4,8,15,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, height: 64 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, flexShrink: 0,
              boxShadow: "0 0 20px rgba(56,189,248,0.3)",
            }}>✈️</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#f1f5f9", letterSpacing: "-0.3px" }}>
                Bagaj Otomasyon Simülasyonu
              </div>
              <div style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.3px" }}>
                HAVALİMANI BAGAJ TAŞIMA SİSTEMİ OTOMASYonu
              </div>
            </div>

            <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <div style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 8, padding: "4px 14px",
                fontSize: 12, color: "#94a3b8",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ color: "#38bdf8" }}>SimPy</span>
                <span style={{ color: "#334155" }}>×</span>
                <span style={{ color: "#818cf8" }}>FastAPI</span>
                <span style={{ color: "#334155" }}>×</span>
                <span style={{ color: "#94a3b8" }}>React</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ position: "relative", width: 8, height: 8 }}>
                <div className="pulse-dot" style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: phase === "running" ? "#f59e0b" : "#22c55e",
                  position: "relative", zIndex: 1,
                }} />
              </div>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>
                {phase === "running" ? "Simüle ediliyor..." : phase === "complete" ? "Tamamlandı" : "Hazır"}
              </span>
            </div>

            {/* Reset button */}
            {phase !== "idle" && (
              <button
                onClick={handleReset}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8, padding: "6px 14px",
                  fontSize: 12, color: "#64748b",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                ↺ Sıfırla
              </button>
            )}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>
        {/* Page title */}
        <div style={{ marginBottom: 32 }}>
          <h1 className="gradient-text" style={{
            fontSize: 28, fontWeight: 800, letterSpacing: "-0.6px", marginBottom: 8,
          }}>
            Bagaj Takip & Kapasite Analizi
          </h1>
          <p style={{ color: "#64748b", fontSize: 14 }}>
            Parametreleri ayarlayın → Simülasyonu çalıştırın → Canlı süreci izleyin → Darboğazları tespit edin
          </p>
        </div>

        {/* Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 24, alignItems: "start" }}>

          {/* LEFT — Parameter panel */}
          <div style={{ position: "sticky", top: 80 }}>
            <ParameterPanel
              params={params}
              onChange={setParams}
              onRun={handleRun}
              loading={phase === "running"}
            />
          </div>

          {/* RIGHT — Results */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24, minWidth: 0 }}>

            {/* Error */}
            {error && (
              <div style={{
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 12, padding: "14px 18px",
                color: "#fca5a5", fontSize: 14,
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{ fontSize: 18 }}>⚠️</span>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>Bağlantı Hatası</div>
                  <div style={{ opacity: 0.8, fontSize: 13 }}>{error}</div>
                </div>
              </div>
            )}

            {/* IDLE — empty state */}
            {phase === "idle" && !error && <EmptyState />}

            {/* RUNNING — live progress + growing chart */}
            {phase === "running" && liveEvent && (
              <>
                <LiveProgress event={liveEvent} />
                {liveTimeline.length > 1 && (
                  <TimelineChart data={liveTimeline} live />
                )}
              </>
            )}

            {/* COMPLETE — final results */}
            {phase === "complete" && result && (
              <>
                {/* Success banner */}
                <div style={{
                  background: "rgba(34,197,94,0.08)",
                  border: "1px solid rgba(34,197,94,0.2)",
                  borderRadius: 12, padding: "12px 18px",
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <span style={{ fontSize: 20 }}>🎉</span>
                  <div>
                    <div style={{ fontWeight: 600, color: "#86efac", fontSize: 14 }}>
                      Otomasyon Simülasyonu Tamamlandı
                    </div>
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 1 }}>
                      {result.total_bags.toLocaleString("tr-TR")} bagaj otomatik işlem hattından geçirildi — tarama, sıralama ve kapı yüklemesi simüle edildi
                    </div>
                  </div>
                </div>
                <StatsGrid result={result} />
                <TimelineChart data={result.timeline} />
              </>
            )}
          </div>
        </div>
      </main>

      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        marginTop: 48, padding: "20px 24px",
        textAlign: "center", color: "#334155", fontSize: 12, letterSpacing: "0.3px",
      }}>
        Havalimanı Bagaj Otomasyon Simülasyonu — SimPy · FastAPI · React
      </footer>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(14,26,46,0.8) 0%, rgba(10,17,32,0.9) 100%)",
      border: "1px dashed rgba(56,189,248,0.15)",
      borderRadius: 20, padding: "64px 32px", textAlign: "center",
    }}>
      <div style={{ position: "relative", display: "inline-block", marginBottom: 24 }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(56,189,248,0.15), rgba(99,102,241,0.15))",
          border: "1px solid rgba(56,189,248,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 36, margin: "0 auto",
        }}>🛫</div>
        <div style={{
          position: "absolute", inset: -8, borderRadius: "50%",
          border: "1px dashed rgba(56,189,248,0.2)",
          animation: "spin 8s linear infinite",
        }} />
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <div style={{ fontSize: 18, fontWeight: 600, color: "#94a3b8", marginBottom: 8 }}>
        Simülasyon Bekleniyor
      </div>
      <div style={{ fontSize: 14, color: "#475569", maxWidth: 400, margin: "0 auto", lineHeight: 1.6 }}>
        Sol panelden parametreleri ayarlayın ve
        <span style={{ color: "#38bdf8" }}> "Simülasyonu Çalıştır" </span>
        butonuna basın.
        <br />
        Simülasyon <strong style={{ color: "#64748b" }}>adım adım canlı</strong> olarak izlenebilecek.
      </div>

      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 8, marginTop: 32, flexWrap: "wrap",
      }}>
        {["🧳 Bagaj Girişi", "🔍 X-Ray", "🤖 Sıralama", "🛤️ Kapı Bandı", "✈️ Uçuş"].map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 8, padding: "6px 12px",
              fontSize: 12, color: "#64748b",
            }} className="flow-active">
              {s}
            </div>
            {i < 4 && <span style={{ color: "#1e3a5f", fontSize: 14 }}>→</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
