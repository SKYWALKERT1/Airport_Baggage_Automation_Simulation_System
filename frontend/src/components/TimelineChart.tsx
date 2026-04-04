import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { TimelinePoint } from "../api/simulation";

interface Props {
  data: TimelinePoint[];
  live?: boolean;
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: number;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#0d1b2e",
      border: "1px solid rgba(56,189,248,0.2)",
      borderRadius: 12,
      padding: "12px 16px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      minWidth: 160,
    }}>
      <div style={{ fontSize: 11, color: "#475569", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label} dakika
      </div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: i < payload.length - 1 ? 6 : 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
            <span style={{ fontSize: 12, color: "#94a3b8" }}>
              {p.name === "queue" ? "Kuyruk" : "İşlenen"}
            </span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", fontVariantNumeric: "tabular-nums" }}>
            {p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function TimelineChart({ data, live = false }: Props) {
  return (
    <div style={{
      background: "linear-gradient(160deg, #0d1b2e 0%, #0a1220 100%)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 20,
      padding: "24px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
            {live && (
              <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: "#f59e0b", display: "inline-block",
                boxShadow: "0 0 6px #f59e0b",
                animation: "pulse-bg 1s ease-in-out infinite",
              }} />
            )}
            {live ? "Canlı Zaman Serisi" : "Zaman Serisi Analizi"}
          </div>
          <div style={{ fontSize: 12, color: "#475569" }}>
            Her 5 dakikadaki kuyruk uzunluğu ve işlenen bagaj
          </div>
        </div>
        {/* Legend */}
        <div style={{ display: "flex", gap: 16 }}>
          {[
            { color: "#f59e0b", label: "Kuyruk Uzunluğu" },
            { color: "#38bdf8", label: "İşlenen Bagaj" },
          ].map((l) => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 24, height: 3, borderRadius: 99,
                background: l.color,
              }} />
              <span style={{ fontSize: 11, color: "#64748b" }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="gradQueue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradProcessed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="1 4"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />

          <XAxis
            dataKey="time"
            tick={{ fill: "#334155", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}dk`}
            interval="preserveStartEnd"
          />

          <YAxis
            yAxisId="queue"
            tick={{ fill: "#334155", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={36}
          />

          <YAxis
            yAxisId="processed"
            orientation="right"
            tick={{ fill: "#334155", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={48}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.05)", strokeWidth: 1 }} />

          <Legend
            wrapperStyle={{ display: "none" }}
          />

          <Area
            yAxisId="queue"
            type="monotone"
            dataKey="queue"
            name="queue"
            stroke="#f59e0b"
            strokeWidth={2}
            fill="url(#gradQueue)"
            dot={false}
            activeDot={{ r: 5, fill: "#f59e0b", stroke: "#0d1b2e", strokeWidth: 2 }}
          />

          <Area
            yAxisId="processed"
            type="monotone"
            dataKey="processed"
            name="processed"
            stroke="#38bdf8"
            strokeWidth={2}
            fill="url(#gradProcessed)"
            dot={false}
            activeDot={{ r: 5, fill: "#38bdf8", stroke: "#0d1b2e", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
