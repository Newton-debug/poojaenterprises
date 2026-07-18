"use client";
import { useState } from "react";
import { ChevronDown, Trophy } from "lucide-react";
import { C, inr } from "../lib/dashboardData";
import { SectionHeader, EmptyCard, Dropdown, DropdownItem } from "./DashboardUI";

export default function TopVendors({ rows, monthsList }) {
  const [monthFilter, setMonthFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("both");
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
            <span className="f-body text-[13px] font-semibold" style={{ color: C.inkMuted }}>Other vendors ({others.length})</span>
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
