"use client";
import { useEffect, useState } from "react";
import { ChevronDown, Ruler } from "lucide-react";
import { C, inr, monthKeyOfDate } from "../lib/dashboardData";
import { DropdownItem } from "./DashboardUI";

const HEADER_PERIODS = [
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
];

export default function Header({ orders, allDays, companyName }) {
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
