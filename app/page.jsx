"use client";

import React, { useMemo, useState } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Home,
  ClipboardList,
  Receipt,
  Plus,
  X,
  ChevronDown,
  PackagePlus,
  Wallet,
  FileText,
  Ruler,
  IndianRupee,
} from "lucide-react";

/* ---------------------------------------------------------------
   PALETTE — warm workshop linen, brass amber, bank teal, brick red
--------------------------------------------------------------- */
const C = {
  paper: "#F6F1E7",
  panel: "#FFFDF9",
  ink: "#241E1A",
  inkMuted: "#8A8072",
  hairline: "#E7DFCF",
  amber: "#C0872E", // cash
  amberSoft: "#F3E4C6",
  teal: "#2F5C63", // bank
  tealSoft: "#DCE7E6",
  brick: "#A83B29", // danger / red zone
  brickSoft: "#F1DAD3",
  forest: "#3F6B52", // good / on-time
  forestSoft: "#DEE9DF",
};

/* ---------------------------------------------------------------
   FONT IMPORT (Space Grotesk / Inter / IBM Plex Mono)
--------------------------------------------------------------- */
const FontStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
    .f-display { font-family: 'Space Grotesk', sans-serif; }
    .f-body { font-family: 'Inter', sans-serif; }
    .f-mono { font-family: 'IBM Plex Mono', monospace; }
  `}</style>
);

/* ---------------------------------------------------------------
   MOCK DATA
--------------------------------------------------------------- */
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const pendingOrders = [
  { id: 1, vendor: "Kovai Woodcraft", model: "Milano-3S Sofa", days: 3 },
  { id: 2, vendor: "Heritage Oak Mills", model: "Oslo Recliner OR-2", days: 6 },
  { id: 3, vendor: "Annai Timbers", model: "Nordic Dining 6-Set", days: 9 },
  { id: 4, vendor: "Coastal Woodcraft", model: "Cane Back Chair CB-12", days: 12 },
  { id: 5, vendor: "SS Furniture Works", model: "Loft Bookshelf L-04", days: 14 },
  { id: 6, vendor: "Maple Works Ltd", model: "Study Table ST-9", days: 18 },
  { id: 7, vendor: "UrbanLoft Furnishings", model: "Wardrobe WD-220", days: 22 },
  { id: 8, vendor: "Nordic Frame Studio", model: "Milano-3S Sofa", days: 27 },
];

const moneyChase = [
  { id: 1, vendor: "Teakline Exports", model: "Oslo Recliner OR-2", amount: 84500 },
  { id: 2, vendor: "Kovai Woodcraft", model: "Nordic Dining 6-Set", amount: 132000 },
  { id: 3, vendor: "Solidwood Traders", model: "Wardrobe WD-220", amount: 47800 },
  { id: 4, vendor: "Artisan Cane Co", model: "Cane Back Chair CB-12", amount: 22400 },
  { id: 5, vendor: "Heritage Oak Mills", model: "Study Table ST-9", amount: 61200 },
  { id: 6, vendor: "Coimbatore Cane House", model: "Loft Bookshelf L-04", amount: 18650 },
];

const MONTHS = [
  { key: "2026-04", label: "April 2026", days: 30, seed: 11 },
  { key: "2026-05", label: "May 2026", days: 31, seed: 27 },
  { key: "2026-06", label: "June 2026", days: 30, seed: 44 },
  { key: "2026-07", label: "July 2026", days: 15, seed: 63 }, // partial, up to "today"
];

function buildMonth({ key, days, seed }) {
  const rand = seeded(seed);
  const [y, m] = key.split("-").map(Number);
  const rows = [];
  for (let d = 1; d <= days; d++) {
    const dateObj = new Date(y, m - 1, d);
    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
    const base = isWeekend ? 18000 : 32000;
    const cash = Math.round(base * (0.5 + rand() * 0.6));
    const bank = Math.round(base * (0.8 + rand() * 0.9));
    rows.push({
      day: d,
      label: dateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      cash,
      bank,
      total: cash + bank,
    });
  }
  // 3-day trailing moving average as trend overlay
  rows.forEach((row, i) => {
    const win = rows.slice(Math.max(0, i - 2), i + 1);
    row.trend = Math.round(win.reduce((s, r) => s + r.total, 0) / win.length);
  });
  return rows;
}

const monthData = Object.fromEntries(MONTHS.map((m) => [m.key, buildMonth(m)]));

/* ---------------------------------------------------------------
   HELPERS
--------------------------------------------------------------- */
const inr = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

function pendingTone(days) {
  if (days >= 15) return { color: C.brick, soft: C.brickSoft, label: "Overdue" };
  if (days >= 8) return { color: C.amber, soft: C.amberSoft, label: "Watch" };
  return { color: C.forest, soft: C.forestSoft, label: "On track" };
}

/* Ruler tick gauge — the signature motif: a measuring-tape style
   indicator standing in for a progress bar, ticks fill by days pending */
function TickGauge({ days, max = 30, color }) {
  const totalTicks = 12;
  const filled = Math.max(1, Math.round((Math.min(days, max) / max) * totalTicks));
  return (
    <div className="flex items-end gap-[3px] h-4" aria-hidden="true">
      {Array.from({ length: totalTicks }).map((_, i) => {
        const isMajor = i % 4 === 0;
        const active = i < filled;
        return (
          <span
            key={i}
            style={{
              width: 2,
              height: isMajor ? 14 : 8,
              backgroundColor: active ? color : C.hairline,
              borderRadius: 1,
            }}
          />
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------
   CUSTOM CHART TOOLTIP
--------------------------------------------------------------- */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const cash = payload.find((p) => p.dataKey === "cash")?.value ?? 0;
  const bank = payload.find((p) => p.dataKey === "bank")?.value ?? 0;
  const trend = payload.find((p) => p.dataKey === "trend")?.value;
  return (
    <div
      className="rounded-xl px-3 py-2.5 shadow-lg f-body"
      style={{ backgroundColor: C.ink, color: C.paper, minWidth: 150 }}
    >
      <div className="text-[11px] uppercase tracking-wide opacity-60 mb-1.5">{label}</div>
      <div className="flex items-center justify-between gap-4 text-[13px] mb-0.5">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: C.amber }} />
          Cash
        </span>
        <span className="f-mono">{inr(cash)}</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-[13px] mb-0.5">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: C.teal }} />
          Bank
        </span>
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

/* ---------------------------------------------------------------
   SECTION HEADER — shared eyebrow + title pattern
--------------------------------------------------------------- */
function SectionHeader({ eyebrow, title, subtitle, accent, right }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <div
          className="text-[11px] font-semibold tracking-[0.14em] uppercase f-body mb-1"
          style={{ color: accent }}
        >
          {eyebrow}
        </div>
        <h2 className="f-display text-[19px] font-semibold" style={{ color: C.ink }}>
          {title}
        </h2>
        {subtitle && (
          <p className="f-body text-[12.5px] mt-0.5" style={{ color: C.inkMuted }}>
            {subtitle}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

/* ---------------------------------------------------------------
   1. PENDING ORDERS — "The Red Zone"
--------------------------------------------------------------- */
function PendingOrders() {
  const overdue = pendingOrders.filter((o) => o.days >= 15).length;
  const avg = Math.round(pendingOrders.reduce((s, o) => s + o.days, 0) / pendingOrders.length);

  return (
    <section
      className="rounded-2xl p-5 mb-4"
      style={{ backgroundColor: C.panel, border: `1px solid ${C.hairline}` }}
    >
      <SectionHeader
        eyebrow="The Red Zone"
        title="Pending Orders"
        subtitle={`${pendingOrders.length} in production · avg ${avg} days · ${overdue} overdue`}
        accent={C.brick}
      />
      <div className="flex flex-col">
        {pendingOrders.map((o, i) => {
          const tone = pendingTone(o.days);
          return (
            <div
              key={o.id}
              className="flex items-center justify-between py-3"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${C.hairline}` }}
            >
              <div className="min-w-0 pr-3">
                <div className="f-body text-[14px] font-semibold truncate" style={{ color: C.ink }}>
                  {o.vendor}
                </div>
                <div className="f-body text-[12.5px] truncate" style={{ color: C.inkMuted }}>
                  {o.model}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span
                  className="f-mono text-[15px] font-semibold leading-none"
                  style={{ color: tone.color }}
                >
                  {o.days}d
                </span>
                <TickGauge days={o.days} color={tone.color} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------
   2. THE MONEY CHASE — completed but unpaid
--------------------------------------------------------------- */
function MoneyChase() {
  const [reminded, setReminded] = useState({});
  const total = moneyChase.reduce((s, m) => s + m.amount, 0);

  return (
    <section
      className="rounded-2xl p-5 mb-4"
      style={{ backgroundColor: C.panel, border: `1px solid ${C.hairline}` }}
    >
      <SectionHeader
        eyebrow="Completed · Unpaid"
        title="The Money Chase"
        subtitle={`${moneyChase.length} vendors waiting · ${inr(total)} outstanding`}
        accent={C.brick}
      />
      <div className="flex flex-col">
        {moneyChase.map((m, i) => (
          <div
            key={m.id}
            className="flex items-center justify-between py-3 gap-3"
            style={{ borderTop: i === 0 ? "none" : `1px solid ${C.hairline}` }}
          >
            <div className="min-w-0">
              <div className="f-body text-[14px] font-semibold truncate" style={{ color: C.ink }}>
                {m.vendor}
              </div>
              <div className="f-body text-[12.5px] truncate" style={{ color: C.inkMuted }}>
                {m.model}
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="f-mono text-[14px] font-semibold" style={{ color: C.brick }}>
                {inr(m.amount)}
              </span>
              <button
                onClick={() => setReminded((r) => ({ ...r, [m.id]: !r[m.id] }))}
                className="f-body text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors"
                style={
                  reminded[m.id]
                    ? { backgroundColor: C.forestSoft, color: C.forest }
                    : { backgroundColor: C.brick, color: C.paper }
                }
              >
                {reminded[m.id] ? "Reminded ✓" : "Follow up"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------
   3. THE COLLECTION ENGINE — stacked bar + trendline
--------------------------------------------------------------- */
function CollectionEngine() {
  const [monthKey, setMonthKey] = useState("2026-07");
  const [stacked, setStacked] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const data = monthData[monthKey];
  const monthLabel = MONTHS.find((m) => m.key === monthKey).label;
  const totalCash = data.reduce((s, r) => s + r.cash, 0);
  const totalBank = data.reduce((s, r) => s + r.bank, 0);
  const grandTotal = totalCash + totalBank;

  // thin the x-axis labels on longer months so they don't crowd on mobile
  const tickInterval = data.length > 20 ? 3 : data.length > 12 ? 1 : 0;

  return (
    <section
      className="rounded-2xl p-5 mb-4"
      style={{ backgroundColor: C.panel, border: `1px solid ${C.hairline}` }}
    >
      <SectionHeader
        eyebrow="Cash vs Bank"
        title="Collection Engine"
        accent={C.teal}
        right={
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="f-body text-[13px] font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: C.tealSoft, color: C.teal }}
            >
              {monthLabel.split(" ")[0]}
              <ChevronDown size={14} />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 mt-1.5 rounded-xl overflow-hidden shadow-lg z-10 f-body"
                style={{ backgroundColor: C.panel, border: `1px solid ${C.hairline}`, minWidth: 140 }}
              >
                {MONTHS.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => {
                      setMonthKey(m.key);
                      setMenuOpen(false);
                    }}
                    className="w-full text-left text-[13px] px-3.5 py-2.5"
                    style={{
                      color: m.key === monthKey ? C.teal : C.ink,
                      fontWeight: m.key === monthKey ? 600 : 400,
                      backgroundColor: m.key === monthKey ? C.tealSoft : "transparent",
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        }
      />

      {/* Total + legend row */}
      <div className="flex items-end justify-between mb-3 flex-wrap gap-2">
        <div>
          <div className="f-mono text-[24px] font-semibold leading-none" style={{ color: C.ink }}>
            {inr(grandTotal)}
          </div>
          <div className="f-body text-[12px] mt-1" style={{ color: C.inkMuted }}>
            collected in {monthLabel}
          </div>
        </div>
        <div className="flex gap-3">
          <LegendPill color={C.amber} label="Cash" value={inr(totalCash)} />
          <LegendPill color={C.teal} label="Bank" value={inr(totalBank)} />
        </div>
      </div>

      {/* Stacked / grouped toggle */}
      <div
        className="inline-flex rounded-lg p-0.5 mb-3"
        style={{ backgroundColor: C.paper, border: `1px solid ${C.hairline}` }}
      >
        {[
          { v: true, label: "Stacked" },
          { v: false, label: "Grouped" },
        ].map((opt) => (
          <button
            key={opt.label}
            onClick={() => setStacked(opt.v)}
            className="f-body text-[12px] font-semibold px-3 py-1.5 rounded-md transition-colors"
            style={
              stacked === opt.v
                ? { backgroundColor: C.ink, color: C.paper }
                : { color: C.inkMuted }
            }
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div style={{ width: "100%", height: 240 }}>
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 6, right: 4, left: -18, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={C.hairline} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: C.inkMuted, fontFamily: "Inter" }}
              axisLine={{ stroke: C.hairline }}
              tickLine={false}
              interval={tickInterval}
            />
            <YAxis
              tick={{ fontSize: 10, fill: C.inkMuted, fontFamily: "Inter" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${Math.round(v / 1000)}k`}
              width={34}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(36,30,26,0.05)" }} />
            <Bar
              dataKey="cash"
              stackId={stacked ? "a" : "cash"}
              fill={C.amber}
              radius={stacked ? [0, 0, 0, 0] : [3, 3, 0, 0]}
              maxBarSize={22}
            />
            <Bar
              dataKey="bank"
              stackId={stacked ? "a" : "bank"}
              fill={C.teal}
              radius={[3, 3, 0, 0]}
              maxBarSize={22}
            />
            <Line
              type="monotone"
              dataKey="trend"
              stroke={C.ink}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function LegendPill({ color, label, value }) {
  return (
    <div className="text-right">
      <div className="flex items-center justify-end gap-1.5">
        <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
        <span className="f-body text-[11px] uppercase tracking-wide" style={{ color: C.inkMuted }}>
          {label}
        </span>
      </div>
      <div className="f-mono text-[12.5px] font-semibold" style={{ color: C.ink }}>
        {value}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   BOTTOM NAV + FAB SHEET
--------------------------------------------------------------- */
function BottomNav({ onOpenSheet }) {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 flex items-center justify-around px-2"
      style={{
        height: 76,
        backgroundColor: C.panel,
        borderTop: `1px solid ${C.hairline}`,
      }}
    >
      <NavIcon icon={<Home size={20} />} label="Home" active />
      <NavIcon icon={<ClipboardList size={20} />} label="Orders" />
      <div className="w-16" /> {/* space for FAB */}
      <NavIcon icon={<Receipt size={20} />} label="Bills" />
      <NavIcon icon={<Wallet size={20} />} label="Ledger" />

      <button
        onClick={onOpenSheet}
        className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center shadow-lg transition-transform active:scale-95"
        style={{
          top: -26,
          width: 60,
          height: 60,
          borderRadius: 18,
          backgroundColor: C.brick,
        }}
        aria-label="Add new"
      >
        <Plus size={26} color={C.paper} strokeWidth={2.5} />
      </button>
    </div>
  );
}

function NavIcon({ icon, label, active }) {
  return (
    <button className="flex flex-col items-center gap-1 py-2 px-2">
      <span style={{ color: active ? C.brick : C.inkMuted }}>{icon}</span>
      <span
        className="f-body text-[10px] font-medium"
        style={{ color: active ? C.brick : C.inkMuted }}
      >
        {label}
      </span>
    </button>
  );
}

function ActionSheet({ open, onClose }) {
  const actions = [
    { icon: PackagePlus, label: "New Order", hint: "Start a fresh production order", color: C.brick },
    { icon: Wallet, label: "Log Collection", hint: "Record today's cash or bank receipt", color: C.teal },
    { icon: FileText, label: "Raise Bill", hint: "Generate a sales bill for a vendor", color: C.forest },
  ];
  return (
    <>
      <div
        onClick={onClose}
        className="absolute inset-0 transition-opacity z-20"
        style={{
          backgroundColor: "rgba(36,30,26,0.45)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      />
      <div
        className="absolute left-0 right-0 bottom-0 rounded-t-3xl p-5 z-30 transition-transform"
        style={{
          backgroundColor: C.panel,
          transform: open ? "translateY(0)" : "translateY(110%)",
          paddingBottom: 28,
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="f-display text-[17px] font-semibold" style={{ color: C.ink }}>
            Log new data
          </h3>
          <button onClick={onClose} aria-label="Close">
            <X size={20} color={C.inkMuted} />
          </button>
        </div>
        <div className="flex flex-col gap-2.5">
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={onClose}
              className="flex items-center gap-3.5 p-3.5 rounded-2xl text-left transition-colors"
              style={{ border: `1px solid ${C.hairline}` }}
            >
              <span
                className="flex items-center justify-center shrink-0"
                style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: `${a.color}1A` }}
              >
                <a.icon size={19} color={a.color} />
              </span>
              <span>
                <div className="f-body text-[14px] font-semibold" style={{ color: C.ink }}>
                  {a.label}
                </div>
                <div className="f-body text-[12px]" style={{ color: C.inkMuted }}>
                  {a.hint}
                </div>
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------
   TOP HEADER — brand + quick stat strip
--------------------------------------------------------------- */
function Header() {
  const overdueCount = pendingOrders.filter((o) => o.days >= 15).length;
  const totalDue = moneyChase.reduce((s, m) => s + m.amount, 0);

  return (
    <div className="px-5 pt-6 pb-4">
      <div className="flex items-center gap-2 mb-5">
        <span
          className="flex items-center justify-center rounded-xl"
          style={{ width: 34, height: 34, backgroundColor: C.ink }}
        >
          <Ruler size={17} color={C.paper} />
        </span>
        <div>
          <div className="f-display text-[15px] font-semibold leading-none" style={{ color: C.ink }}>
            Pooja Enterprises
          </div>
          <div className="f-body text-[11px] mt-1" style={{ color: C.inkMuted }}>
            {currentDate}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <StatChip label="Pending" value={pendingOrders.length} tone={C.ink} />
        <StatChip label="Overdue" value={overdueCount} tone={C.brick} />
        <StatChip
          label="Due"
          value={`₹${Math.round(totalDue / 1000)}k`}
          tone={C.brick}
          icon={<IndianRupee size={11} />}
        />
      </div>
    </div>
  );
}

function StatChip({ label, value, tone, icon }) {
  return (
    <div
      className="rounded-xl px-3 py-2.5"
      style={{ backgroundColor: C.panel, border: `1px solid ${C.hairline}` }}
    >
      <div
        className="f-body text-[10px] uppercase tracking-wide font-semibold mb-0.5"
        style={{ color: C.inkMuted }}
      >
        {label}
      </div>
      <div className="f-mono text-[17px] font-semibold flex items-center gap-0.5" style={{ color: tone }}>
        {icon}
        {value}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   ROOT
--------------------------------------------------------------- */
export default function FurnitureDashboard() {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div
      className="min-h-screen w-full flex justify-center"
      style={{ backgroundColor: "#DED6C4", fontFamily: "Inter, sans-serif" }}
    >
      <FontStyles />
      <div
        className="relative w-full max-w-[430px] sm:my-6 sm:rounded-[2.25rem] sm:shadow-2xl overflow-hidden"
        style={{ backgroundColor: C.paper }}
      >
        <div className="h-screen sm:h-[860px] overflow-y-auto" style={{ paddingBottom: 96 }}>
          <Header />
          <div className="px-4">
            <PendingOrders />
            <MoneyChase />
            <CollectionEngine />
          </div>
        </div>

        <BottomNav onOpenSheet={() => setSheetOpen(true)} />
        <ActionSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
      </div>
    </div>
  );
}
