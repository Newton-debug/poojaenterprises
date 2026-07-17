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
import { ChevronDown, Ruler, IndianRupee, Trophy, CheckCircle2 } from "lucide-react";

/* =================================================================
   PASTE YOUR SHEETDB URL HERE — the only line you need to edit.
   Get it from sheetdb.io after connecting your Google Sheet.
   It looks like: https://sheetdb.io/api/v1/xxxxx
================================================================= */
const SHEETDB_URL = "https://sheetdb.io/api/v1/2lhcimkjxmeqw";

/* =================================================================
   YOUR GOOGLE SHEET MUST HAVE EXACTLY THESE 2 TABS
   (tab names are case-sensitive, must match exactly):

   Tab "Orders"      → columns: vendor, model, orderdate, status, completeddate
                        (status = "Pending" or "Completed" — blank counts as
                        Pending; completeddate only needs filling in once you
                        mark a row Completed)
   Tab "Collections" → columns: date, amount, mode, party

   Column header CASE doesn't matter (Vendor / vendor / VENDOR all
   work) — the code lowercases everything automatically. Only the
   two TAB names above need to match exactly.
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
const inr = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);

// makes every column header lowercase + trimmed, so sheet header
// casing (Vendor / vendor / VENDOR) never breaks anything
function normalizeRow(row) {
  const out = {};
  Object.keys(row).forEach((k) => {
    out[k.trim().toLowerCase()] = typeof row[k] === "string" ? row[k].trim() : row[k];
  });
  return out;
}

function pendingTone(days) {
  if (days >= 15) return { color: C.brick };
  if (days >= 8) return { color: C.amber };
  return { color: C.forest };
}

function daysBetween(dateStr) {
  const then = new Date(dateStr);
  const now = new Date();
  if (isNaN(then)) return 0;
  return Math.max(0, Math.floor((now - then) / 86400000));
}

function monthKeyOf(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabelOf(key) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

/* ---------------------------------------------------------------
   TICK GAUGE — signature ruler/measuring-tape motif
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
   CHART TOOLTIP
--------------------------------------------------------------- */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const cash = payload.find((p) => p.dataKey === "cash")?.value ?? 0;
  const bank = payload.find((p) => p.dataKey === "bank")?.value ?? 0;
  const trend = payload.find((p) => p.dataKey === "trend")?.value;
  return (
    <div className="rounded-xl px-3 py-2.5 shadow-lg f-body" style={{ backgroundColor: C.ink, color: C.paper, minWidth: 150 }}>
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

function SectionHeader({ eyebrow, title, subtitle, accent, right }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <div className="text-[11px] font-semibold tracking-[0.14em] uppercase f-body mb-1" style={{ color: accent }}>
          {eyebrow}
        </div>
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

/* ---------------------------------------------------------------
   1. PENDING ORDERS — from the "Orders" tab
--------------------------------------------------------------- */
function PendingOrders({ orders }) {
  if (!orders.length) {
    return (
      <EmptyCard eyebrow="The Red Zone" title="Pending Orders" accent={C.brick}
        message="No rows found in the 'Orders' tab of your Google Sheet yet." />
    );
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
   1b. COMPLETED ORDERS — collapsed by default, shows vendor, model,
       and completion date once expanded
--------------------------------------------------------------- */
function CompletedOrders({ completed }) {
  const [open, setOpen] = useState(false);
  if (!completed.length) return null;

  return (
    <section className="rounded-2xl p-5 mb-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.hairline}` }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center rounded-lg" style={{ width: 30, height: 30, backgroundColor: `${C.forest}1A` }}>
            <CheckCircle2 size={15} color={C.forest} />
          </span>
          <div className="text-left">
            <div className="f-display text-[15px] font-semibold" style={{ color: C.ink }}>Completed Orders</div>
            <div className="f-body text-[12px]" style={{ color: C.inkMuted }}>{completed.length} finished · tap to {open ? "hide" : "view"}</div>
          </div>
        </div>
        <ChevronDown
          size={18}
          color={C.inkMuted}
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }}
        />
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
   2. COLLECTION ENGINE — from the "Collections" tab
--------------------------------------------------------------- */
function CollectionEngine({ monthsList, monthDataMap }) {
  const [monthKey, setMonthKey] = useState(monthsList[monthsList.length - 1]?.key);
  const [stacked, setStacked] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  if (!monthsList.length) {
    return (
      <EmptyCard eyebrow="Cash vs Bank" title="Collection Engine" accent={C.teal}
        message="No rows found in the 'Collections' tab of your Google Sheet yet." />
    );
  }

  const data = monthDataMap[monthKey] || [];
  const monthLabel = monthsList.find((m) => m.key === monthKey)?.label || "";
  const totalCash = data.reduce((s, r) => s + r.cash, 0);
  const totalBank = data.reduce((s, r) => s + r.bank, 0);
  const grandTotal = totalCash + totalBank;
  const tickInterval = data.length > 20 ? 3 : data.length > 12 ? 1 : 0;

  return (
    <section className="rounded-2xl p-5 mb-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.hairline}` }}>
      <SectionHeader
        eyebrow="Cash vs Bank" title="Collection Engine" accent={C.teal}
        right={
          <div className="relative">
            <button onClick={() => setMenuOpen((v) => !v)}
              className="f-body text-[13px] font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: C.tealSoft, color: C.teal }}>
              {monthLabel.split(" ")[0]}
              <ChevronDown size={14} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-1.5 rounded-xl overflow-hidden shadow-lg z-10 f-body"
                style={{ backgroundColor: C.panel, border: `1px solid ${C.hairline}`, minWidth: 140 }}>
                {monthsList.map((m) => (
                  <button key={m.key} onClick={() => { setMonthKey(m.key); setMenuOpen(false); }}
                    className="w-full text-left text-[13px] px-3.5 py-2.5"
                    style={{ color: m.key === monthKey ? C.teal : C.ink, fontWeight: m.key === monthKey ? 600 : 400, backgroundColor: m.key === monthKey ? C.tealSoft : "transparent" }}>
                    {m.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        }
      />

      <div className="flex items-end justify-between mb-3 flex-wrap gap-2">
        <div>
          <div className="f-mono text-[24px] font-semibold leading-none" style={{ color: C.ink }}>{inr(grandTotal)}</div>
          <div className="f-body text-[12px] mt-1" style={{ color: C.inkMuted }}>collected in {monthLabel}</div>
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
            style={stacked === opt.v ? { backgroundColor: C.ink, color: C.paper } : { color: C.inkMuted }}>
            {opt.label}
          </button>
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

/* ---------------------------------------------------------------
   3. TOP 5 VENDORS — ranked leaderboard by total collected amount,
      built from the "party" column in the Collections tab
--------------------------------------------------------------- */
function TopVendors({ vendors }) {
  if (!vendors.length) {
    return (
      <EmptyCard eyebrow="Leaderboard" title="Top 5 Vendors" accent={C.forest}
        message="No parties found yet — add a 'party' column value to rows in your Collections tab." />
    );
  }
  const max = vendors[0]?.total || 1;

  return (
    <section className="rounded-2xl p-5 mb-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.hairline}` }}>
      <SectionHeader eyebrow="Leaderboard" title="Top 5 Vendors" accent={C.forest}
        subtitle="Ranked by total amount collected" />
      <div className="flex flex-col gap-3.5">
        {vendors.map((v, i) => (
          <div key={i} className="flex items-center gap-3">
            <span
              className="f-display text-[13px] font-semibold flex items-center justify-center shrink-0"
              style={{
                width: 24, height: 24, borderRadius: 8,
                backgroundColor: i === 0 ? C.forest : C.paper,
                color: i === 0 ? C.paper : C.inkMuted,
                border: i === 0 ? "none" : `1px solid ${C.hairline}`,
              }}
            >
              {i === 0 ? <Trophy size={12} /> : i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="f-body text-[13.5px] font-semibold truncate" style={{ color: C.ink }}>{v.name}</span>
                <span className="f-mono text-[12.5px] font-semibold ml-2 shrink-0" style={{ color: C.forest }}>{inr(v.total)}</span>
              </div>
              <div className="rounded-full overflow-hidden" style={{ height: 5, backgroundColor: C.hairline }}>
                <div style={{ width: `${Math.max(6, (v.total / max) * 100)}%`, height: "100%", backgroundColor: C.forest }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------
   HEADER — live current date + quick stat strip
--------------------------------------------------------------- */
function Header({ orders, monthTotal, companyName }) {
  const currentDate = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  const overdueCount = orders.filter((o) => o.days >= 15).length;

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
      <div className="grid grid-cols-3 gap-2.5">
        <StatChip label="Pending" value={orders.length} tone={C.ink} />
        <StatChip label="Overdue" value={overdueCount} tone={C.brick} />
        <StatChip label="This Month" value={`₹${Math.round(monthTotal / 1000)}k`} tone={C.forest} icon={<IndianRupee size={11} />} />
      </div>
    </div>
  );
}

function StatChip({ label, value, tone, icon }) {
  return (
    <div className="rounded-xl px-3 py-2.5" style={{ backgroundColor: C.panel, border: `1px solid ${C.hairline}` }}>
      <div className="f-body text-[10px] uppercase tracking-wide font-semibold mb-0.5" style={{ color: C.inkMuted }}>{label}</div>
      <div className="f-mono text-[17px] font-semibold flex items-center gap-0.5" style={{ color: tone }}>{icon}{value}</div>
    </div>
  );
}

/* ---------------------------------------------------------------
   ROOT — fetches from Google Sheets (via SheetDB) on load
--------------------------------------------------------------- */
export default function FurnitureDashboard() {
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [orders, setOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [monthsList, setMonthsList] = useState([]);
  const [monthDataMap, setMonthDataMap] = useState({});
  const [topVendors, setTopVendors] = useState([]);
  const [currentMonthTotal, setCurrentMonthTotal] = useState(0);

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

        // ---- Orders tab: vendor, model, orderdate, status, completeddate ----
        const ordersNormalized = ordersRaw.map(normalizeRow).filter((r) => r.vendor);

        const isDone = (r) => {
          const s = String(r.status || "").toLowerCase();
          return s.includes("complete") || s.includes("done");
        };

        const ordersClean = ordersNormalized
          .filter((r) => !isDone(r))
          .map((r) => ({ vendor: r.vendor, model: r.model, days: daysBetween(r.orderdate) }))
          .sort((a, b) => b.days - a.days);
        setOrders(ordersClean);

        const completedClean = ordersNormalized
          .filter(isDone)
          .map((r) => {
            const cd = new Date(r.completeddate);
            return {
              vendor: r.vendor,
              model: r.model,
              sortKey: isNaN(cd) ? 0 : cd.getTime(),
              completedLabel: isNaN(cd)
                ? "date not set"
                : cd.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
            };
          })
          .sort((a, b) => b.sortKey - a.sortKey);
        setCompletedOrders(completedClean);

        // ---- Collections tab: date, amount, mode, party ----
        const rows = collectionsRaw
          .map(normalizeRow)
          .filter((r) => r.date && r.amount)
          .map((r) => {
            const d = new Date(r.date);
            const modeStr = String(r.mode || "").toLowerCase();
            const isCash = modeStr.includes("cash");
            return {
              dateObj: d,
              monthKey: monthKeyOf(r.date),
              label: isNaN(d) ? r.date : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
              amount: Number(r.amount) || 0,
              isCash,
              party: r.party || "Unknown",
            };
          })
          .filter((r) => r.monthKey);

        // group into per-day cash/bank totals, per month
        const grouped = {};
        rows.forEach((r) => {
          if (!grouped[r.monthKey]) grouped[r.monthKey] = {};
          const dayKey = r.dateObj.toDateString();
          if (!grouped[r.monthKey][dayKey]) {
            grouped[r.monthKey][dayKey] = { sortKey: r.dateObj.getTime(), label: r.label, cash: 0, bank: 0 };
          }
          if (r.isCash) grouped[r.monthKey][dayKey].cash += r.amount;
          else grouped[r.monthKey][dayKey].bank += r.amount;
        });

        const map = {};
        Object.entries(grouped).forEach(([key, dayMap]) => {
          const dayRows = Object.values(dayMap).sort((a, b) => a.sortKey - b.sortKey);
          dayRows.forEach((row, i) => {
            const win = dayRows.slice(Math.max(0, i - 2), i + 1);
            row.trend = Math.round(win.reduce((s, r) => s + r.cash + r.bank, 0) / win.length);
          });
          map[key] = dayRows;
        });

        const list = Object.keys(map).sort().map((key) => ({ key, label: monthLabelOf(key) }));
        setMonthDataMap(map);
        setMonthsList(list);

        // current calendar month total, for the header stat chip
        const thisMonthKey = monthKeyOf(new Date().toISOString());
        const thisMonthRows = map[thisMonthKey] || [];
        setCurrentMonthTotal(thisMonthRows.reduce((s, r) => s + r.cash + r.bank, 0));

        // ---- Top 5 vendors by total amount (all-time, across all rows) ----
        const byParty = {};
        rows.forEach((r) => {
          byParty[r.party] = (byParty[r.party] || 0) + r.amount;
        });
        const ranked = Object.entries(byParty)
          .map(([name, total]) => ({ name, total }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 5);
        setTopVendors(ranked);

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
          <Header orders={orders} monthTotal={currentMonthTotal} companyName="Pooja Enterprises" />
          <div className="px-4">
            {status === "loading" && (
              <div className="f-body text-[13px] text-center py-10" style={{ color: C.inkMuted }}>Loading your data…</div>
            )}
            {status === "error" && (
              <div className="rounded-2xl p-5 mb-4 f-body text-[13px]" style={{ backgroundColor: C.brickSoft, color: C.brick }}>
                Couldn't load data. Make sure SHEETDB_URL at the top of this file is your real SheetDB link, and that your sheet has tabs named exactly "Orders" and "Collections".
              </div>
            )}
            {status === "ready" && (
              <>
                <PendingOrders orders={orders} />
                <CompletedOrders completed={completedOrders} />
                <CollectionEngine monthsList={monthsList} monthDataMap={monthDataMap} />
                <TopVendors vendors={topVendors} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
