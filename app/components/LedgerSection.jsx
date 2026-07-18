"use client";
import { useState } from "react";
import { C, inr } from "../lib/dashboardData";
import { SectionHeader, EmptyCard, Dropdown, DropdownItem } from "./DashboardUI";

export default function LedgerSection({ title, accent, rows, labelKey, showModeDot }) {
  const [count, setCount] = useState("10");
  const [dateFilter, setDateFilter] = useState("");

  if (!rows.length) {
    return <EmptyCard eyebrow="Full Log" title={title} accent={accent} message="No entries found yet." />;
  }

  const sorted = [...rows].sort((a, b) => b.dateObj - a.dateObj);
  let shown;
  if (dateFilter) {
    const target = new Date(dateFilter).toDateString();
    shown = sorted.filter((r) => r.dateObj.toDateString() === target);
  } else {
    shown = count === "all" ? sorted : sorted.slice(0, Number(count));
  }
  const total = shown.reduce((s, r) => s + r.amount, 0);

  return (
    <section className="rounded-2xl p-5 mb-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.hairline}` }}>
      <SectionHeader
        eyebrow="Full Log" title={title} accent={accent}
        subtitle={dateFilter ? `${shown.length} entries on this day` : `Showing last ${count === "all" ? "all" : count}`}
        right={
          <Dropdown label={count === "all" ? "All" : `Last ${count}`} accent={accent}>
            <DropdownItem active={count === "10"} accent={accent} onClick={() => setCount("10")}>Last 10</DropdownItem>
            <DropdownItem active={count === "20"} accent={accent} onClick={() => setCount("20")}>Last 20</DropdownItem>
            <DropdownItem active={count === "all"} accent={accent} onClick={() => setCount("all")}>All</DropdownItem>
          </Dropdown>
        }
      />

      <div className="flex items-center gap-2 mb-3">
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="f-body text-[12.5px] px-3 py-1.5 rounded-lg"
          style={{ border: `1px solid ${C.hairline}`, backgroundColor: C.paper, color: C.ink }}
        />
        {dateFilter && (
          <button onClick={() => setDateFilter("")}
            className="f-body text-[12px] font-semibold px-2.5 py-1.5 rounded-lg"
            style={{ backgroundColor: `${accent}1A`, color: accent }}>
            Clear
          </button>
        )}
        {dateFilter && (
          <span className="f-mono text-[12.5px] font-semibold ml-auto" style={{ color: accent }}>{inr(total)}</span>
        )}
      </div>

      {!shown.length ? (
        <p className="f-body text-[13px]" style={{ color: C.inkMuted }}>No entries match this date.</p>
      ) : (
        <div className="flex flex-col">
          {shown.map((r, i) => (
            <div key={i} className="flex items-center justify-between py-2.5" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.hairline}` }}>
              <div className="flex items-center gap-2 min-w-0">
                {showModeDot && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: r.isCash ? C.amber : C.teal }} />}
                <span className="f-body text-[13px] truncate" style={{ color: C.ink }}>{r[labelKey]}</span>
                <span className="f-body text-[11px] shrink-0" style={{ color: C.inkMuted }}>
                  {r.dateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                </span>
              </div>
              <span className="f-mono text-[12.5px] font-semibold shrink-0 ml-2" style={{ color: C.ink }}>{inr(r.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
