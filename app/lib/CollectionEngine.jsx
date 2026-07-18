"use client";
import { useState } from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { C, inr, monthKeyOfDate } from "../lib/dashboardData";
import { SectionHeader, EmptyCard, LegendPill, ChartTooltip, Dropdown, DropdownItem } from "./DashboardUI";

const QUICK_RANGES = [
  { key: "3d", label: "Last 3 Days", days: 3 },
  { key: "7d", label: "Last 7 Days", days: 7 },
  { key: "30d", label: "Last 30 Days", days: 30 },
];

export default function CollectionEngine({ allDays, monthsList }) {
  const [rangeMode, setRangeMode] = useState("7d");
  const [monthKey, setMonthKey] = useState(monthsList[monthsList.length - 1]?.key);
  const [stacked, setStacked] = useState(true);

  if (!allDays.length) {
    return <EmptyCard eyebrow="Cash vs Bank" title="Collection Engine" accent={C.teal} message="No rows found in the 'Collections' tab yet." />;
  }

  let data, periodText, triggerLabel;
  if (rangeMode === "month") {
    data = allDays.filter((d) => monthKeyOfDate(d.dateObj) === monthKey);
    const monthLabel = monthsList.find((m) => m.key === monthKey)?.label || "";
    periodText = monthLabel;
    triggerLabel = monthLabel.split(" ")[0];
  } else {
    const q = QUICK_RANGES.find((r) => r.key === rangeMode);
    data = allDays.slice(-q.days);
    periodText = q.label.toLowerCase().replace("last", "the last");
    triggerLabel = q.label;
  }

  const totalCash = data.reduce((s, r) => s + r.cash, 0);
  const totalBank = data.reduce((s, r) => s + r.bank, 0);
  const grandTotal = totalCash + totalBank;
  const tickInterval = data.length > 20 ? 3 : data.length > 12 ? 1 : 0;

  return (
    <section className="rounded-2xl p-5 mb-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.hairline}` }}>
      <SectionHeader
        eyebrow="Cash vs Bank" title="Collection Engine" accent={C.teal}
        right={
          <Dropdown label={triggerLabel} accent={C.teal}>
            {QUICK_RANGES.map((r) => (
              <DropdownItem key={r.key} active={rangeMode === r.key} accent={C.teal} onClick={() => setRangeMode(r.key)}>{r.label}</DropdownItem>
            ))}
            <div style={{ borderTop: `1px solid ${C.hairline}` }} />
            {monthsList.map((m) => (
              <DropdownItem key={m.key} active={rangeMode === "month" && monthKey === m.key} accent={C.teal}
                onClick={() => { setRangeMode("month"); setMonthKey(m.key); }}>{m.label}</DropdownItem>
            ))}
          </Dropdown>
        }
      />

      <div className="flex items-end justify-between mb-3 flex-wrap gap-2">
        <div>
          <div className="f-mono text-[24px] font-semibold leading-none" style={{ color: C.ink }}>{inr(grandTotal)}</div>
          <div className="f-body text-[12px] mt-1" style={{ color: C.inkMuted }}>collected in {periodText}</div>
        </div>
        <div className="flex gap-3">
          <LegendPill color={C.amber} label="Cash" value={inr(totalCash)} />
          <LegendPill color={C.teal} label="Bank" value={inr(totalBank)} />
        </div>
      </div>

      <div className="inline-flex rounded-lg p-0.5 mb-3" style={{ backgroundColor: C.paper, border: `1px solid ${C.hairline}` }}>
        {[{ v: true, label: "Stacked" }, { v: false, label: "Grouped" }].map((opt) => (
          <button key={opt.label} onClick={() => setStacked(opt.v)}
            className="f-body text-[12px] font-semibold px-3 py-1.5 rounded-md transition-colors"
            style={stacked === opt.v ? { backgroundColor: C.ink, color: C.paper } : { color: C.inkMuted }}>{opt.label}</button>
        ))}
      </div>

      <div style={{ width: "100%", height: 240 }}>
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 6, right: 4, left: -18, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={C.hairline} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: C.inkMuted, fontFamily: "Inter" }} axisLine={{ stroke: C.hairline }} tickLine={false} interval={tickInterval} />
            <YAxis tick={{ fontSize: 10, fill: C.inkMuted, fontFamily: "Inter" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} width={34} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(36,30,26,0.05)" }} />
            <Bar dataKey="cash" stackId={stacked ? "a" : "cash"} fill={C.amber} radius={stacked ? [0, 0, 0, 0] : [3, 3, 0, 0]} maxBarSize={22} />
            <Bar dataKey="bank" stackId={stacked ? "a" : "bank"} fill={C.teal} radius={[3, 3, 0, 0]} maxBarSize={22} />
            <Line type="monotone" dataKey="trend" stroke={C.ink} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
