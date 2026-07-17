"use client";

import React, { useEffect, useState } from "react";
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
import { ChevronDown, Ruler, Trophy, CheckCircle2, ChevronRight } from "lucide-react";

/* =================================================================
   PASTE YOUR SHEETDB URL HERE
================================================================= */
const SHEETDB_URL = "https://sheetdb.io/api/v1/2lhcimkjxmeqw";

/* =================================================================
   GOOGLE SHEET — 2 tabs, exact names:

   Tab "Orders"      → vendor, model, orderdate, status, completeddate
                        dates as dd-mm-yy or dd-mm-yyyy (e.g. 11-7-26)
   Tab "Collections" → date, amount, mode, party
                        dates as dd-mm-yy or dd-mm-yyyy

   Column header CASE never matters. Tab names must match exactly.
================================================================= */

/* ---------------------------------------------------------------
   PALETTE
--------------------------------------------------------------- */
const C = {
  paper: "#F6F1E7",
  panel: "#FFFDF9",
  ink: "#241E1A",
  inkMuted: "#8A8072",
  hairline: "#E7DFCF",
  amber: "#C0872E",
  teal: "#2F5C63",
  tealSoft: "#DCE7E6",
  brick: "#A83B29",
  brickSoft: "#F1DAD3",
  forest: "#3F6B52",
  forestSoft: "#DEE9DF",
};

const FontStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
    .f-display { font-family: 'Space Grotesk', sans-serif; }
    .f-body { font-family: 'Inter', sans-serif; }
    .f-mono { font-family: 'IBM Plex Mono', monospace; }
  `}</style>
);

/* ---------------------------------------------------------------
   HELPERS
--------------------------------------------------------------- */
// explicit ₹ prefix — never falls back to $ under any locale
const inr = (n) => "₹" + new Intl.NumberFormat("en-IN").format(Math.round(n || 0));

const toNumber = (v) => Number(String(v ?? "").replace(/[^0-9.-]/g, "")) || 0;

function normalizeRow(row) {
  const out = {};
  Object.keys(row).forEach((k) => {
    out[k.trim().toLowerCase()] = typeof row[k] === "string" ? row[k].trim() : row[k];
  });
  return out;
}

// reads dates as dd-mm-yy / dd-mm-yyyy (not the US mm-dd-yy default),
// but still handles yyyy-mm-dd if that's what a cell contains
function parseSheetDate(str) {
  if (!str) return new Date(NaN);
  const parts = String(str).trim().split(/[\/\-.]/);
  if (parts.length !== 3) return new Date(str);
  const nums = parts.map((p) => parseInt(p, 10));
  if (String(parts[0]).length === 4) {
    const [y, m, d] = nums;
    return new Date(y, m - 1, d);
  }
  let [d, m, y] = nums;
  if (y < 100) y += 2000;
  return new Date(y, m - 1, d);
}

function pendingTone(days) {
  if (days >= 15) return { color: C.brick };
  if (days >= 8) return { color: C.amber };
  return { color: C.forest };
}

function daysBetween(dateStr) {
  const then = parseSheetDate(dateStr);
  const now = new Date();
  if (isNaN(then)) return 0;
  return Math.max(0, Math.floor((now - then) / 86400000));
}

function monthKeyOfDate(d) {
  if (isNaN(d)) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabelOf(key) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

/* ---------------------------------------------------------------
   SHARED BITS
--------------------------------------------------------------- */
function TickGauge({ days, max = 30, color }) {
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

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
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

function SectionHeader({ eyebrow, title, subtitle, accent, right }) {
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

function EmptyCard({ eyebrow, title, accent, message }) {
  return (
    <section className="rounded-2xl p-5 mb-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.hairline}` }}>
      <SectionHeader eyebrow={eyebrow} title={title} accent={accent} />
      <p className="f-body text-[13px]" style={{ color: C.inkMuted }}>{message}</p>
    </section>
  );
}

function LegendPill({ color, label, value }) {
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

/* small reusable dropdown trigger + panel, used by chart + top vendors */
function Dropdown({ label, accent, children }) {
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

function DropdownItem({ active, accent, onClick, children }) {
  return (
    <button onClick={onClick} className="w-full text-left text-[13px] px-3.5 py-2.5 f-body"
      style={{ color: active ? accent : C.ink, fontWeight: active ? 600 : 400, backgroundColor: active ? `${accent}1A` : "transparent" }}>
      {children}
    </button>
  );
}

/* ---------------------------------------------------------------
   1. PENDING ORDERS
--------------------------------------------------------------- */
function PendingOrders({ orders }) {
  if (!orders.length) {
    return <EmptyCard eyebrow="The Red Zone" title="Pending Orders" accent={C.brick} message="No rows found in the 'Orders' tab yet." />;
  }
  const avg = Math.round(orders.reduce((s, o) => s + o.days, 0) / orders.length);
  const overdue = orders.filter((o) => o.days >= 15).length;

  return (
    <section className="rounded-2xl p-5 mb-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.hairline}` }}>
      <SectionHeader eyebrow="The Red Zone" title="Pending Orders" accent={C.brick}
        subtitle={`${orders.length} in production · avg ${avg} days · ${overdue} overdue`} />
      <div className="flex flex-col">
        {orders.map((o, i) => {
          const tone = pendingTone(o.days);
          return (
            <div key={i} className="flex items-center justify-between py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.hairline}` }}>
              <div className="min-w-0 pr-3">
                <div className="f-body text-[14px] font-semibold truncate" style={{ color: C.ink }}>{o.vendor}</div>
                <div className="f-body text-[12.5px] truncate" style={{ color: C.inkMuted }}>{o.model}</div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="f-mono text-[15px] font-semibold leading-none" style={{ color: tone.color }}>{o.days}d</span>
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
   1b. COMPLETED ORDERS — collapsed by default
--------------------------------------------------------------- */
function CompletedOrders({ completed }) {
  const [open, setOpen] = useState(false);
  if (!completed.length) return null;
  return (
    <section className="rounded-2xl p-5 mb-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.hairline}` }}>
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center rounded-lg" style={{ width: 30, height: 30, backgroundColor: `${C.forest}1A` }}>
            <CheckCircle2 size={15} color={C.forest} />
          </span>
          <div className="text-left">
            <div className="f-display text-[15px] font-semibold" style={{ color: C.ink }}>Completed Orders</div>
            <div className="f-body text-[12px]" style={{ color: C.inkMuted }}>{completed.length} finished · tap to {open ? "hide" : "view"}</div>
          </div>
        </div>
        <ChevronDown size={18} color={C.inkMuted} style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }} />
      </button>
      {open && (
        <div className="flex flex-col mt-3">
          {completed.map((o, i) => (
            <div key={i} className="flex items-center justify-between py-3" style={{ borderTop: `1px solid ${C.hairline}` }}>
              <div className="min-w-0 pr-3">
                <div className="f-body text-[14px] font-semibold truncate" style={{ color: C.ink }}>{o.vendor}</div>
                <div className="f-body text-[12.5px] truncate" style={{ color: C.inkMuted }}>{o.model}</div>
              </div>
              <span className="f-mono text-[12px] shrink-0" style={{ color: C.forest }}>{o.completedLabel}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------
   2. COLLECTION ENGINE — quick presets + calendar months in one dropdown
--------------------------------------------------------------- */
const QUICK_RANGES = [
  { key: "3d", label: "Last 3 Days", days: 3 },
  { key: "7d", label: "Last 7 Days", days: 7 },
  { key: "30d", label: "Last 30 Days", days: 30 },
];

function CollectionEngine({ allDays, monthsList }) {
  const [rangeMode, setRangeMode] = useState("7d"); // '3d' | '7d' | '30d' | 'month'
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

/* ---------------------------------------------------------------
   3. TOP VENDORS — month filter, cash/bank/both filter, split bar,
      collapsible "Other Vendors" for rank 6+
--------------------------------------------------------------- */
function TopVendors({ rows, monthsList }) {
  const [monthFilter, setMonthFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("both"); // both | cash | bank
  const [showOthers, setShowOthers] = useState(false);

  if (!rows.length) {
    return <EmptyCard eyebrow="Leaderboard" title="Top Vendors" accent={C.forest} message="No parties found yet in your Collections tab." />;
  }

  const passesMode = (r) => (modeFilter === "both" ? true : modeFilter === "cash" ? r.isCash : !r.isCash);
  const filtered = rows.filter((r) => (monthFilter === "all" || r.monthKey === monthFilter) && passesMode(r));

  const byParty = {};
  filtered.forEach((r) => {
    if (!byParty[r.party]) byParty[r.party] = { name: r.party, total: 0, cash: 0, bank: 0 };
    byParty[r.party].total += r.amount;
    if (r.isCash) byParty[r.party].cash += r.amount;
    else byParty[r.party].bank += r.amount;
  });
  const ranked = Object.values(byParty).sort((a, b) => b.total - a.total);
  const top5 = ranked.slice(0, 5);
  const others = ranked.slice(5);
  const max = top5[0]?.total || 1;
  const monthLabel = monthFilter === "all" ? "All Time" : monthsList.find((m) => m.key === monthFilter)?.label || "";

  return (
    <section className="rounded-2xl p-5 mb-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.hairline}` }}>
      <SectionHeader
        eyebrow="Leaderboard" title="Top Vendors" accent={C.forest}
        subtitle={`Ranked by amount · ${monthLabel}`}
        right={
          <Dropdown label={monthFilter === "all" ? "All Time" : monthLabel.split(" ")[0]} accent={C.forest}>
            <DropdownItem active={monthFilter === "all"} accent={C.forest} onClick={() => setMonthFilter("all")}>All Time</DropdownItem>
            <div style={{ borderTop: `1px solid ${C.hairline}` }} />
            {monthsList.map((m) => (
              <DropdownItem key={m.key} active={monthFilter === m.key} accent={C.forest} onClick={() => setMonthFilter(m.key)}>{m.label}</DropdownItem>
            ))}
          </Dropdown>
        }
      />

      <div className="inline-flex rounded-lg p-0.5 mb-4" style={{ backgroundColor: C.paper, border: `1px solid ${C.hairline}` }}>
        {[{ v: "both", label: "Both" }, { v: "cash", label: "Cash" }, { v: "bank", label: "Bank" }].map((opt) => (
          <button key={opt.v} onClick={() => setModeFilter(opt.v)}
            className="f-body text-[12px] font-semibold px-3 py-1.5 rounded-md transition-colors"
            style={modeFilter === opt.v ? { backgroundColor: C.ink, color: C.paper } : { color: C.inkMuted }}>{opt.label}</button>
        ))}
      </div>

      {!top5.length ? (
        <p className="f-body text-[13px]" style={{ color: C.inkMuted }}>No collections match this filter yet.</p>
      ) : (
        <div className="flex flex-col gap-3.5">
          {top5.map((v, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="f-display text-[13px] font-semibold flex items-center justify-center shrink-0"
                style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: i === 0 ? C.forest : C.paper, color: i === 0 ? C.paper : C.inkMuted, border: i === 0 ? "none" : `1px solid ${C.hairline}` }}>
                {i === 0 ? <Trophy size={12} /> : i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="f-body text-[13.5px] font-semibold truncate" style={{ color: C.ink }}>{v.name}</span>
                  <span className="f-mono text-[12.5px] font-semibold ml-2 shrink-0" style={{ color: C.forest }}>{inr(v.total)}</span>
                </div>
                <div className="rounded-full overflow-hidden flex" style={{ height: 5, backgroundColor: C.hairline }}>
                  <div style={{ width: `${Math.max(0, (v.cash / max) * 100)}%`, backgroundColor: C.amber }} />
                  <div style={{ width: `${Math.max(0, (v.bank / max) * 100)}%`, backgroundColor: C.teal }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {others.length > 0 && (
        <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${C.hairline}` }}>
          <button onClick={() => setShowOthers((v) => !v)} className="w-full flex items-center justify-between">
            <span className="f-body text-[13px] font-semibold" style={{ color: C.inkMuted }}>
              Other vendors ({others.length})
            </span>
            <ChevronDown size={16} color={C.inkMuted} style={{ transform: showOthers ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }} />
          </button>
          {showOthers && (
            <div className="flex flex-col mt-2">
              {others.map((v, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <span className="f-body text-[13px] truncate" style={{ color: C.ink }}>{v.name}</span>
                  <span className="f-mono text-[12px]" style={{ color: C.inkMuted }}>{inr(v.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------
   HEADER — live date, Pending stat, revenue stat with period dropdown
--------------------------------------------------------------- */
const HEADER_PERIODS = [
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
];

function Header({ orders, allDays, companyName }) {
  const [currentDate, setCurrentDate] = useState("");
  const [periodKey, setPeriodKey] = useState("month");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }));
  }, []);

  const now = new Date();
  let periodTotal = 0;
  if (periodKey === "week") {
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 6);
    cutoff.setHours(0, 0, 0, 0);
    periodTotal = allDays.filter((d) => d.dateObj >= cutoff).reduce((s, d) => s + d.cash + d.bank, 0);
  } else if (periodKey === "year") {
    periodTotal = allDays.filter((d) => d.dateObj.getFullYear() === now.getFullYear()).reduce((s, d) => s + d.cash + d.bank, 0);
  } else {
    const mk = monthKeyOfDate(now);
    periodTotal = allDays.filter((d) => monthKeyOfDate(d.dateObj) === mk).reduce((s, d) => s + d.cash + d.bank, 0);
  }
  const periodLabel = HEADER_PERIODS.find((p) => p.key === periodKey)?.label || "This Month";

  return (
    <div className="px-5 pt-6 pb-4">
      <div className="flex items-center gap-2 mb-5">
        <span className="flex items-center justify-center rounded-xl" style={{ width: 34, height: 34, backgroundColor: C.ink }}>
          <Ruler size={17} color={C.paper} />
        </span>
        <div>
          <div className="f-display text-[15px] font-semibold leading-none" style={{ color: C.ink }}>{companyName}</div>
          <div className="f-body text-[11px] mt-1" style={{ color: C.inkMuted }}>{currentDate}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-xl px-3 py-2.5" style={{ backgroundColor: C.panel, border: `1px solid ${C.hairline}` }}>
          <div className="f-body text-[10px] uppercase tracking-wide font-semibold mb-0.5" style={{ color: C.inkMuted }}>Pending</div>
          <div className="f-mono text-[17px] font-semibold" style={{ color: C.ink }}>{orders.length}</div>
        </div>

        <div className="relative">
          <button onClick={() => setMenuOpen((v) => !v)} className="w-full text-left rounded-xl px-3 py-2.5"
            style={{ backgroundColor: C.panel, border: `1px solid ${C.hairline}` }}>
            <div className="f-body text-[10px] uppercase tracking-wide font-semibold mb-0.5 flex items-center gap-1" style={{ color: C.inkMuted }}>
              {periodLabel}<ChevronDown size={10} />
            </div>
            <div className="f-mono text-[17px] font-semibold" style={{ color: C.forest }}>{inr(periodTotal)}</div>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-1.5 rounded-xl overflow-hidden shadow-lg z-20 f-body"
              style={{ backgroundColor: C.panel, border: `1px solid ${C.hairline}`, minWidth: 140 }}
              onClick={() => setMenuOpen(false)}>
              {HEADER_PERIODS.map((p) => (
                <DropdownItem key={p.key} active={periodKey === p.key} accent={C.forest} onClick={() => setPeriodKey(p.key)}>{p.label}</DropdownItem>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   ROOT
--------------------------------------------------------------- */
export default function FurnitureDashboard() {
  const [status, setStatus] = useState("loading");
  const [orders, setOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [allDays, setAllDays] = useState([]);
  const [monthsList, setMonthsList] = useState([]);
  const [collectionRows, setCollectionRows] = useState([]);

  useEffect(() => {
    async function load() {
      if (!SHEETDB_URL || SHEETDB_URL.includes("PASTE_YOUR_SHEETDB_URL")) {
        setStatus("error");
        return;
      }
      try {
        const [ordersRaw, collectionsRaw] = await Promise.all([
          fetch(`${SHEETDB_URL}?sheet=Orders`).then((r) => r.json()),
          fetch(`${SHEETDB_URL}?sheet=Collections`).then((r) => r.json()),
        ]);

        // ---- Orders ----
        const ordersNormalized = ordersRaw.map(normalizeRow).filter((r) => r.vendor);
        const isDone = (r) => {
          const s = String(r.status || "").toLowerCase();
          return s.includes("complete") || s.includes("done");
        };

        setOrders(
          ordersNormalized.filter((r) => !isDone(r))
            .map((r) => ({ vendor: r.vendor, model: r.model, days: daysBetween(r.orderdate) }))
            .sort((a, b) => b.days - a.days)
        );

        setCompletedOrders(
          ordersNormalized.filter(isDone)
            .map((r) => {
              const cd = parseSheetDate(r.completeddate);
              return {
                vendor: r.vendor, model: r.model,
                sortKey: isNaN(cd) ? 0 : cd.getTime(),
                completedLabel: isNaN(cd) ? "date not set" : cd.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
              };
            })
            .sort((a, b) => b.sortKey - a.sortKey)
        );

        // ---- Collections ----
        const txns = collectionsRaw
          .map(normalizeRow)
          .filter((r) => r.date && r.amount)
          .map((r) => {
            const d = parseSheetDate(r.date);
            const modeStr = String(r.mode || "").toLowerCase();
            return {
              dateObj: d,
              monthKey: monthKeyOfDate(d),
              amount: toNumber(r.amount),
              isCash: modeStr.includes("cash"),
              party: r.party || "Unknown",
            };
          })
          .filter((r) => !isNaN(r.dateObj) && r.monthKey);

        setCollectionRows(txns);

        const dayMap = {};
        txns.forEach((r) => {
          const dayKey = r.dateObj.toDateString();
          if (!dayMap[dayKey]) {
            dayMap[dayKey] = {
              sortKey: r.dateObj.getTime(),
              dateObj: r.dateObj,
              label: r.dateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
              cash: 0,
              bank: 0,
            };
          }
          if (r.isCash) dayMap[dayKey].cash += r.amount;
          else dayMap[dayKey].bank += r.amount;
        });

        const daysSorted = Object.values(dayMap).sort((a, b) => a.sortKey - b.sortKey);
        daysSorted.forEach((row, i) => {
          const win = daysSorted.slice(Math.max(0, i - 2), i + 1);
          row.trend = Math.round(win.reduce((s, r) => s + r.cash + r.bank, 0) / win.length);
        });
        setAllDays(daysSorted);

        const monthKeys = Array.from(new Set(daysSorted.map((d) => monthKeyOfDate(d.dateObj)))).sort();
        setMonthsList(monthKeys.map((key) => ({ key, label: monthLabelOf(key) })));

        setStatus("ready");
      } catch (e) {
        setStatus("error");
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen w-full flex justify-center" style={{ backgroundColor: "#DED6C4", fontFamily: "Inter, sans-serif" }}>
      <FontStyles />
      <div className="relative w-full max-w-[430px] sm:my-6 sm:rounded-[2.25rem] sm:shadow-2xl overflow-hidden" style={{ backgroundColor: C.paper }}>
        <div className="h-screen sm:h-[860px] overflow-y-auto" style={{ paddingBottom: 32 }}>
          <Header orders={orders} allDays={allDays} companyName="Pooja Enterprises" />
          <div className="px-4">
            {status === "loading" && <div className="f-body text-[13px] text-center py-10" style={{ color: C.inkMuted }}>Loading your data…</div>}
            {status === "error" && (
              <div className="rounded-2xl p-5 mb-4 f-body text-[13px]" style={{ backgroundColor: C.brickSoft, color: C.brick }}>
                Couldn't load data. Make sure SHEETDB_URL is your real SheetDB link, and your sheet has tabs named exactly "Orders" and "Collections".
              </div>
            )}
            {status === "ready" && (
              <>
                <PendingOrders orders={orders} />
                <CompletedOrders completed={completedOrders} />
                <CollectionEngine allDays={allDays} monthsList={monthsList} />
                <TopVendors rows={collectionRows} monthsList={monthsList} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
