"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { C } from "../lib/dashboardData";

export const FontStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
    .f-display { font-family: 'Space Grotesk', sans-serif; }
    .f-body { font-family: 'Inter', sans-serif; }
    .f-mono { font-family: 'IBM Plex Mono', monospace; }
  `}</style>
);

export function TickGauge({ days, max = 30, color }) {
  const totalTicks = 12;
  const filled = Math.max(1, Math.round((Math.min(days, max) / max) * totalTicks));
  return (
    <div className="flex items-end gap-[3px] h-4" aria-hidden="true">
      {Array.from({ length: totalTicks }).map((_, i) => {
        const isMajor = i % 4 === 0;
        const active = i < filled;
        return (
          <span key={i} style={{ width: 2, height: isMajor ? 14 : 8, backgroundColor: active ? color : C.hairline, borderRadius: 1 }} />
        );
      })}
    </div>
  );
}

export function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const inr = (n) => "₹" + new Intl.NumberFormat("en-IN").format(Math.round(n || 0));
  const cash = payload.find((p) => p.dataKey === "cash")?.value ?? 0;
  const bank = payload.find((p) => p.dataKey === "bank")?.value ?? 0;
  const trend = payload.find((p) => p.dataKey === "trend")?.value;
  return (
    <div className="rounded-xl px-3 py-2.5 shadow-lg f-body" style={{ backgroundColor: C.ink, color: C.paper, minWidth: 150 }}>
      <div className="text-[11px] uppercase tracking-wide opacity-60 mb-1.5">{label}</div>
      <div className="flex items-center justify-between gap-4 text-[13px] mb-0.5">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ backgroundColor: C.amber }} />Cash</span>
        <span className="f-mono">{inr(cash)}</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-[13px] mb-0.5">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ backgroundColor: C.teal }} />Bank</span>
        <span className="f-mono">{inr(bank)}</span>
      </div>
      {trend !== undefined && (
        <div className="flex items-center justify-between gap-4 text-[13px] pt-1.5 mt-1.5 border-t border-white/15">
          <span className="opacity-70">3-day trend</span>
          <span className="f-mono opacity-90">{inr(trend)}</span>
        </div>
      )}
    </div>
  );
}

export function SectionHeader({ eyebrow, title, subtitle, accent, right }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <div className="text-[11px] font-semibold tracking-[0.14em] uppercase f-body mb-1" style={{ color: accent }}>{eyebrow}</div>
        <h2 className="f-display text-[19px] font-semibold" style={{ color: C.ink }}>{title}</h2>
        {subtitle && <p className="f-body text-[12.5px] mt-0.5" style={{ color: C.inkMuted }}>{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function EmptyCard({ eyebrow, title, accent, message }) {
  return (
    <section className="rounded-2xl p-5 mb-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.hairline}` }}>
      <SectionHeader eyebrow={eyebrow} title={title} accent={accent} />
      <p className="f-body text-[13px]" style={{ color: C.inkMuted }}>{message}</p>
    </section>
  );
}

export function LegendPill({ color, label, value }) {
  return (
    <div className="text-right">
      <div className="flex items-center justify-end gap-1.5">
        <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
        <span className="f-body text-[11px] uppercase tracking-wide" style={{ color: C.inkMuted }}>{label}</span>
      </div>
      <div className="f-mono text-[12.5px] font-semibold" style={{ color: C.ink }}>{value}</div>
    </div>
  );
}

export function Dropdown({ label, accent, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)}
        className="f-body text-[13px] font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg"
        style={{ backgroundColor: `${accent}1A`, color: accent }}>
        {label}
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute right-0 mt-1.5 rounded-xl overflow-hidden shadow-lg z-20 f-body"
          style={{ backgroundColor: C.panel, border: `1px solid ${C.hairline}`, minWidth: 160, maxHeight: 260, overflowY: "auto" }}
          onClick={() => setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({ active, accent, onClick, children }) {
  return (
    <button onClick={onClick} className="w-full text-left text-[13px] px-3.5 py-2.5 f-body"
      style={{ color: active ? accent : C.ink, fontWeight: active ? 600 : 400, backgroundColor: active ? `${accent}1A` : "transparent" }}>
      {children}
    </button>
  );
}
