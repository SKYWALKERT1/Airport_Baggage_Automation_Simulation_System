import type { SimParams } from "../api/simulation";

interface Props {
  params: SimParams;
  onChange: (p: SimParams) => void;
  onRun: () => void;
  loading: boolean;
}

interface SliderConfig {
  key: keyof SimParams;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  icon: string;
  color: string;
  description: string;
}

const sliders: SliderConfig[] = [
  {
    key: "scanner_count",
    label: "Tarayıcı Sayısı",
    min: 1,
    max: 10,
    step: 1,
    unit: "adet",
    icon: "🔍",
    color: "#38bdf8",
    description: "X-Ray bant kapasitesi",
  },
  {
    key: "flight_count",
    label: "Aktif Uçuş",
    min: 1,
    max: 20,
    step: 1,
    unit: "uçuş",
    icon: "✈️",
    color: "#818cf8",
    description: "Açık kapı / uçuş sayısı",
  },
  {
    key: "arrival_rate",
    label: "Bagaj Geliş Hızı",
    min: 1,
    max: 30,
    step: 1,
    unit: "bagaj/dk",
    icon: "🧳",
    color: "#34d399",
    description: "Dakikadaki ortalama bagaj girişi",
  },
  {
    key: "sim_duration",
    label: "Simülasyon Süresi",
    min: 60,
    max: 480,
    step: 30,
    unit: "dk",
    icon: "⏱️",
    color: "#f59e0b",
    description: "Toplam simülasyon aralığı",
  },
];

export default function ParameterPanel({
  params,
  onChange,
  onRun,
  loading,
}: Props) {
  return (
    <div
      style={{
        background: "linear-gradient(160deg, #0d1b2e 0%, #0a1220 100%)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 20,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "rgba(56,189,248,0.12)",
            border: "1px solid rgba(56,189,248,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
          }}
        >
          ⚙️
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#f1f5f9" }}>
            Parametreler
          </div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 1 }}>
            Simülasyonu özelleştir
          </div>
        </div>
      </div>

      {/* Hazır Senaryolar */}
      <div style={{ padding: "20px 24px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Hazır Senaryolar</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <button
            onClick={() => onChange({ arrival_rate: 10, scanner_count: 3, flight_count: 5, sim_duration: 480 })}
            style={{
              background: params.arrival_rate === 10 && params.scanner_count === 3 && params.flight_count === 5 ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${params.arrival_rate === 10 && params.scanner_count === 3 && params.flight_count === 5 ? "rgba(56,189,248,0.4)" : "rgba(255,255,255,0.05)"}`,
              borderRadius: 10, padding: "10px 4px", color: params.arrival_rate === 10 && params.scanner_count === 3 && params.flight_count === 5 ? "#38bdf8" : "#94a3b8",
              fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              boxShadow: params.arrival_rate === 10 && params.scanner_count === 3 && params.flight_count === 5 ? "0 0 10px rgba(56,189,248,0.2)" : "none"
            }}
          >
            <span style={{ fontSize: 18 }}>🌤️</span>
            Standart
          </button>
          <button
            onClick={() => onChange({ arrival_rate: 23, scanner_count: 5, flight_count: 15, sim_duration: 480 })}
            style={{
              background: params.arrival_rate === 23 && params.scanner_count === 5 && params.flight_count === 15 ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${params.arrival_rate === 23 && params.scanner_count === 5 && params.flight_count === 15 ? "rgba(245,158,11,0.4)" : "rgba(255,255,255,0.05)"}`,
              borderRadius: 10, padding: "10px 4px", color: params.arrival_rate === 23 && params.scanner_count === 5 && params.flight_count === 15 ? "#fcd34d" : "#94a3b8",
              fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              boxShadow: params.arrival_rate === 23 && params.scanner_count === 5 && params.flight_count === 15 ? "0 0 10px rgba(245,158,11,0.2)" : "none"
            }}
          >
            <span style={{ fontSize: 18 }}>☀️</span>
            Yaz Yoğunluğu
          </button>
          <button
            onClick={() => onChange({ arrival_rate: 5, scanner_count: 2, flight_count: 3, sim_duration: 480 })}
            style={{
              background: params.arrival_rate === 5 && params.scanner_count === 2 && params.flight_count === 3 ? "rgba(129,140,248,0.15)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${params.arrival_rate === 5 && params.scanner_count === 2 && params.flight_count === 3 ? "rgba(129,140,248,0.4)" : "rgba(255,255,255,0.05)"}`,
              borderRadius: 10, padding: "10px 4px", color: params.arrival_rate === 5 && params.scanner_count === 2 && params.flight_count === 3 ? "#a5b4fc" : "#94a3b8",
              fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              boxShadow: params.arrival_rate === 5 && params.scanner_count === 2 && params.flight_count === 3 ? "0 0 10px rgba(129,140,248,0.2)" : "none"
            }}
          >
            <span style={{ fontSize: 18 }}>❄️</span>
            Kış Sakinliği
          </button>
        </div>
      </div>

      {/* Sliders */}
      <div
        style={{
          padding: "20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {sliders.map((s) => {
          const val = params[s.key] as number;
          const pct = ((val - s.min) / (s.max - s.min)) * 100;
          return (
            <div key={s.key}>
              {/* Label row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: `${s.color}15`,
                      border: `1px solid ${s.color}30`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    {s.icon}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#e2e8f0",
                        lineHeight: 1.2,
                      }}
                    >
                      {s.label}
                    </div>
                    <div
                      style={{ fontSize: 11, color: "#475569", marginTop: 1 }}
                    >
                      {s.description}
                    </div>
                  </div>
                </div>
                {/* Value badge */}
                <div
                  style={{
                    background: `${s.color}18`,
                    border: `1px solid ${s.color}35`,
                    borderRadius: 8,
                    padding: "3px 10px",
                    fontSize: 13,
                    fontWeight: 700,
                    color: s.color,
                    fontVariantNumeric: "tabular-nums",
                    flexShrink: 0,
                    marginLeft: 8,
                  }}
                >
                  {val}{" "}
                  <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.7 }}>
                    {s.unit}
                  </span>
                </div>
              </div>

              {/* Slider + fill track */}
              <div style={{ position: "relative" }}>
                {/* Fill track */}
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: 0,
                    transform: "translateY(-50%)",
                    width: `${pct}%`,
                    height: 5,
                    borderRadius: 99,
                    background: `linear-gradient(90deg, ${s.color}99, ${s.color})`,
                    pointerEvents: "none",
                    zIndex: 1,
                  }}
                />
                <input
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={val}
                  onChange={(e) =>
                    onChange({ ...params, [s.key]: Number(e.target.value) })
                  }
                  style={{
                    position: "relative",
                    zIndex: 2,
                    background: "transparent",
                  }}
                />
              </div>

              {/* Min/max labels */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 4,
                }}
              >
                <span style={{ fontSize: 10, color: "#334155" }}>{s.min}</span>
                <span style={{ fontSize: 10, color: "#334155" }}>{s.max}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Run button */}
      <div style={{ padding: "0 24px 24px" }}>
        <button
          onClick={onRun}
          disabled={loading}
          className="btn-glow"
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 14,
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            background: loading
              ? "rgba(56,189,248,0.15)"
              : "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
            color: loading ? "#64748b" : "#ffffff",
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: "0.2px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <>
              <SpinnerIcon />
              Simüle ediliyor...
            </>
          ) : (
            <>
              <span style={{ fontSize: 16 }}>▶</span>
              Simülasyonu Çalıştır
            </>
          )}
        </button>
      </div>

      {/* Pipeline flow */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          padding: "16px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#334155",
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            marginBottom: 12,
          }}
        >
          Bagaj Akışı
        </div>
        {[
          { icon: "🧳", label: "Check-in Girişi", color: "#38bdf8" },
          { icon: "🔍", label: "X-Ray Tarama", color: "#818cf8" },
          { icon: "🤖", label: "Sıralama Robotu", color: "#34d399" },
          { icon: "🛤️", label: "Kapı Bandı", color: "#f59e0b" },
          { icon: "✈️", label: "Uçağa Yükleme", color: "#a78bfa" },
        ].map((step, i, arr) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: `${step.color}15`,
                  border: `1px solid ${step.color}25`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                {step.icon}
              </div>
              <span style={{ fontSize: 13, color: "#64748b" }}>
                {step.label}
              </span>
            </div>
            {i < arr.length - 1 && (
              <div
                style={{
                  marginLeft: 13,
                  width: 2,
                  height: 12,
                  background: "linear-gradient(#1e3a5f, transparent)",
                  borderRadius: 1,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SpinnerIcon() {
  return (
    <svg
      style={{ animation: "spin 0.8s linear infinite", width: 16, height: 16 }}
      viewBox="0 0 24 24"
      fill="none"
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeOpacity="0.25"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
