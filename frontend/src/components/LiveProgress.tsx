import type { ProgressEvent } from "../api/simulation";

interface Props {
  event: ProgressEvent;
}

function LiveStat({ label, value, color, icon }: { label: string; value: string | number; color: string; icon: string }) {
  return (
    <div style={{
      background: `${color}0d`,
      border: `1px solid ${color}25`,
      borderRadius: 12,
      padding: "14px 16px",
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{ fontSize: 11, color: "#475569", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
        <span>{icon}</span>
        {label}
      </div>
      <div style={{
        fontSize: 22,
        fontWeight: 800,
        color,
        fontVariantNumeric: "tabular-nums",
        letterSpacing: "-0.5px",
        transition: "all 0.3s ease",
      }}>
        {value}
      </div>
    </div>
  );
}

export default function LiveProgress({ event }: Props) {
  const { progress, sim_time, sim_duration, queue, processed, delayed, avg_wait, utilization } = event;

  const formatTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}s ${m}dk` : `${m}dk`;
  };

  return (
    <div style={{
      background: "linear-gradient(160deg, #0d1b2e 0%, #0a1220 100%)",
      border: "1px solid rgba(56,189,248,0.15)",
      borderRadius: 20,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "20px 24px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Spinning loader */}
          <div style={{ position: "relative", width: 32, height: 32 }}>
            <svg style={{ animation: "spin 1s linear infinite", width: 32, height: 32, position: "absolute" }} viewBox="0 0 32 32" fill="none">
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <circle cx="16" cy="16" r="13" stroke="rgba(56,189,248,0.15)" strokeWidth="3" />
              <path d="M16 3a13 13 0 0 1 13 13" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12,
            }}>✈️</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#e2e8f0" }}>
              Simülasyon Çalışıyor
            </div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 1 }}>
              Adım {event.step} / {event.total_steps}
            </div>
          </div>
        </div>
        {/* Time badge */}
        <div style={{
          background: "rgba(129,140,248,0.1)",
          border: "1px solid rgba(129,140,248,0.25)",
          borderRadius: 10,
          padding: "6px 14px",
          fontSize: 13,
          fontWeight: 700,
          color: "#a5b4fc",
          fontVariantNumeric: "tabular-nums",
        }}>
          {formatTime(sim_time)} / {formatTime(sim_duration)}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ padding: "16px 24px 8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: "#475569" }}>İlerleme</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#38bdf8" }}>{progress}%</span>
        </div>
        <div style={{ height: 8, background: "#0f1f35", borderRadius: 99, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${progress}%`,
            borderRadius: 99,
            background: "linear-gradient(90deg, #0ea5e9, #6366f1, #8b5cf6)",
            backgroundSize: "200% 100%",
            animation: "shimmer 2s linear infinite",
            transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)",
            boxShadow: "0 0 12px rgba(56,189,248,0.4)",
          }} />
        </div>
      </div>

      {/* Live stats */}
      <div style={{ padding: "12px 24px 20px", display: "flex", gap: 10 }}>
        <LiveStat label="Kuyrukta" value={queue} color="#f59e0b" icon="⏳" />
        <LiveStat label="İşlendi" value={processed.toLocaleString("tr-TR")} color="#22c55e" icon="✅" />
        <LiveStat label="Ort. Bekleme" value={`${avg_wait} dk`} color="#818cf8" icon="⏱️" />
        <LiveStat label="Tarayıcı %" value={`${utilization}%`} color={utilization > 90 ? "#ef4444" : utilization > 70 ? "#f59e0b" : "#38bdf8"} icon="📡" />
        <LiveStat label="Gecikmiş" value={delayed} color="#ef4444" icon="⚠️" />
      </div>

      {/* Sim time track */}
      <div style={{
        margin: "0 24px 20px",
        background: "#060e1e",
        borderRadius: 10,
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <span style={{ fontSize: 11, color: "#334155", whiteSpace: "nowrap" }}>Simülasyon Saati</span>
        <div style={{ flex: 1, display: "flex", gap: 3, alignItems: "center" }}>
          {Array.from({ length: 24 }, (_, i) => {
            const slotTime = (sim_duration / 24) * (i + 1);
            const active = slotTime <= sim_time;
            const current = Math.abs(slotTime - sim_time) < sim_duration / 24;
            return (
              <div key={i} style={{
                flex: 1, height: 6,
                borderRadius: 2,
                background: current
                  ? "#38bdf8"
                  : active
                  ? "rgba(56,189,248,0.4)"
                  : "rgba(255,255,255,0.04)",
                transition: "all 0.3s ease",
                boxShadow: current ? "0 0 6px rgba(56,189,248,0.6)" : "none",
              }} />
            );
          })}
        </div>
        <span style={{ fontSize: 11, color: "#334155", whiteSpace: "nowrap" }}>
          {Math.floor(sim_duration / 60)}s simülasyon
        </span>
      </div>
    </div>
  );
}
