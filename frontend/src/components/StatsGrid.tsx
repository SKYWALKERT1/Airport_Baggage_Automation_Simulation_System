import type { SimResult } from "../api/simulation";

interface Props {
  result: SimResult;
}

interface CardConfig {
  label: string;
  value: string;
  sub: string;
  icon: string;
  accent: string;
  bg: string;
  progress?: number;
  status?: "good" | "warn" | "bad" | "neutral";
}

function getStatus(value: number, good: number, bad: number): "good" | "warn" | "bad" {
  if (value <= good) return "good";
  if (value >= bad) return "bad";
  return "warn";
}

const statusColors = {
  good: { accent: "#22c55e", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)", dot: "#22c55e" },
  warn: { accent: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", dot: "#f59e0b" },
  bad: { accent: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", dot: "#ef4444" },
  neutral: { accent: "#38bdf8", bg: "rgba(56,189,248,0.06)", border: "rgba(56,189,248,0.15)", dot: "#38bdf8" },
};

export default function StatsGrid({ result }: Props) {
  const delayStatus  = getStatus(result.delay_rate, 10, 25);
  const utilStatus   = getStatus(result.scanner_utilization, 70, 90);
  const waitStatus   = getStatus(result.avg_wait_minutes, 1, 5);

  const successPct = (result.processed_bags / Math.max(result.total_bags, 1)) * 100;

  const cards: CardConfig[] = [
    {
      label: "Toplam Bagaj",
      value: result.total_bags.toLocaleString("tr-TR"),
      sub: `${result.throughput_per_hour} bagaj/saat verim`,
      icon: "🧳",
      accent: "#38bdf8",
      bg: "rgba(56,189,248,0.06)",
      status: "neutral",
    },
    {
      label: "İşlenen Bagaj",
      value: result.processed_bags.toLocaleString("tr-TR"),
      sub: `%${successPct.toFixed(1)} tamamlandı`,
      icon: "✅",
      accent: "#22c55e",
      bg: "rgba(34,197,94,0.06)",
      progress: successPct,
      status: "good",
    },
    {
      label: "Gecikmiş Bagaj",
      value: result.delayed_bags.toLocaleString("tr-TR"),
      sub: "> 8 dk toplam süre",
      icon: "⚠️",
      accent: statusColors[delayStatus].accent,
      bg: statusColors[delayStatus].bg,
      status: delayStatus,
    },
    {
      label: "Gecikme Oranı",
      value: `${result.delay_rate}%`,
      sub: delayStatus === "good" ? "Sistem sağlıklı" : delayStatus === "warn" ? "Dikkat gerekli" : "Kritik seviye",
      icon: delayStatus === "good" ? "🟢" : delayStatus === "warn" ? "🟡" : "🔴",
      accent: statusColors[delayStatus].accent,
      bg: statusColors[delayStatus].bg,
      progress: result.delay_rate,
      status: delayStatus,
    },
    {
      label: "Kuyruk Bekleme",
      value: `${result.avg_wait_minutes} dk`,
      sub: "ort. tarayıcı kuyruğu",
      icon: "⏳",
      accent: statusColors[waitStatus].accent,
      bg: statusColors[waitStatus].bg,
      status: waitStatus,
    },
    {
      label: "Uçtan-Uca Süre",
      value: `${result.avg_total_minutes} dk`,
      sub: `maks ${result.max_total_minutes} dk`,
      icon: "⏱️",
      accent: "#818cf8",
      bg: "rgba(129,140,248,0.06)",
      status: "neutral",
    },
    {
      label: "Tarayıcı Kullanımı",
      value: `${result.scanner_utilization}%`,
      sub: utilStatus === "good" ? "Optimum kapasite" : utilStatus === "warn" ? "Yüksek yük" : "Aşırı yüklenme",
      icon: "📡",
      accent: statusColors[utilStatus].accent,
      bg: statusColors[utilStatus].bg,
      progress: result.scanner_utilization,
      status: utilStatus,
    },
    {
      label: "Başarı Oranı",
      value: `${(100 - result.delay_rate).toFixed(1)}%`,
      sub: "zamanında uçağa yüklenen",
      icon: "🛫",
      accent: "#34d399",
      bg: "rgba(52,211,153,0.06)",
      progress: 100 - result.delay_rate,
      status: delayStatus === "bad" ? "warn" : "good",
    },
  ];

  return (
    <div>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>Simülasyon Sonuçları</div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
            Operasyon analizi
          </div>
        </div>
        <div style={{
          background: "rgba(34,197,94,0.1)",
          border: "1px solid rgba(34,197,94,0.25)",
          borderRadius: 8,
          padding: "4px 12px",
          fontSize: 12,
          color: "#86efac",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
          Tamamlandı
        </div>
      </div>

      {/* Cards grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 12,
      }}>
        {cards.map((card, i) => (
          <StatCard key={i} card={card} />
        ))}
      </div>
    </div>
  );
}

function StatCard({ card }: { card: CardConfig }) {
  const st = card.status ? statusColors[card.status] : statusColors.neutral;

  return (
    <div className="card-glow" style={{
      background: `linear-gradient(135deg, ${card.bg} 0%, rgba(13,27,46,0.9) 100%)`,
      border: `1px solid ${st.border}`,
      borderRadius: 14,
      padding: "16px",
      transition: "all 0.2s ease",
      cursor: "default",
    }}>
      {/* Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", lineHeight: 1.3 }}>
          {card.label}
        </div>
        <span style={{ fontSize: 16 }}>{card.icon}</span>
      </div>

      {/* Value */}
      <div className="count-anim" style={{
        fontSize: 22,
        fontWeight: 800,
        color: card.accent,
        letterSpacing: "-0.5px",
        lineHeight: 1,
        marginBottom: 6,
        fontVariantNumeric: "tabular-nums",
      }}>
        {card.value}
      </div>

      {/* Sub text */}
      <div style={{ fontSize: 11, color: "#334155", marginBottom: card.progress !== undefined ? 8 : 0 }}>
        {card.sub}
      </div>

      {/* Progress bar */}
      {card.progress !== undefined && (
        <div style={{
          height: 3, borderRadius: 99,
          background: "rgba(255,255,255,0.05)",
          overflow: "hidden",
        }}>
          <div style={{
            height: "100%",
            width: `${Math.min(card.progress, 100)}%`,
            borderRadius: 99,
            background: `linear-gradient(90deg, ${card.accent}80, ${card.accent})`,
            transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
          }} />
        </div>
      )}
    </div>
  );
}
