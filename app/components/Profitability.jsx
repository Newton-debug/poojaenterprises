"use client";
import { useState } from "react";
import { C, inr, sumForPeriod } from "../lib/dashboardData";
import { SectionHeader, EmptyCard, Dropdown, DropdownItem } from "./DashboardUI";

export default function Profitability({ collectionRows, labourRows, purchaseRows, otherExpenseRows, monthsList }) {
  const [mode, setMode] = useState("month"); // month | year | all | specificMonth
  const [monthKey, setMonthKey] = useState(null);

  if (!collectionRows.length && !labourRows.length && !purchaseRows.length && !otherExpenseRows.length) {
    return <EmptyCard eyebrow="Single-Entry P&L" title="Profitability" accent={C.ink} message="Add rows to Collections, Labour, Purchase or OtherExpenses to see profit here." />;
  }

  const sales = sumForPeriod(collectionRows, mode, monthKey);
  const purchase = sumForPeriod(purchaseRows, mode, monthKey);
  const labour = sumForPeriod(labourRows, mode, monthKey);
  const other = sumForPeriod(otherExpenseRows, mode, monthKey);
  const profit = sales - purchase - labour - other;

  const triggerLabel =
    mode === "year" ? "This Year" :
    mode === "all" ? "All Time" :
    mode === "specificMonth" ? (monthsList.find((m) => m.key === monthKey)?.label.split(" ")[0] || "") :
    "This Month";

  const periodText =
    mode === "year" ? "this year" :
    mode === "all" ? "all time" :
    mode === "specificMonth" ? (monthsList.find((m) => m.key === monthKey)?.label || "") :
    "this month";

  const rows = [
    { label: "Sales", value: sales, sign: "" },
    { label: "Purchases", value: purchase, sign: "−" },
    { label: "Labour", value: labour, sign: "−" },
    { label: "Other Expenses", value: other, sign: "−" },
  ];

  return (
    <section className="rounded-2xl p-5 mb-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.hairline}` }}>
      <SectionHeader
        eyebrow="Single-Entry P&L" title="Profitability" accent={C.ink}
        right={
          <Dropdown label={triggerLabel} accent={C.ink}>
            <DropdownItem active={mode === "month"} accent={C.ink} onClick={() => setMode("month")}>This Month</DropdownItem>
            <DropdownItem active={mode === "year"} accent={C.ink} onClick={() => setMode("year")}>This Year</DropdownItem>
            <DropdownItem active={mode === "all"} accent={C.ink} onClick={() => setMode("all")}>All Time</DropdownItem>
            <div style={{ borderTop: `1px solid ${C.hairline}` }} />
            {monthsList.map((m) => (
              <DropdownItem key={m.key} active={mode === "specificMonth" && monthKey === m.key} accent={C.ink}
                onClick={() => { setMode("specificMonth"); setMonthKey(m.key); }}>{m.label}</DropdownItem>
            ))}
          </Dropdown>
        }
      />

      <div className="mb-4">
        <div className="f-mono text-[28px] font-semibold leading-none" style={{ color: profit >= 0 ? C.forest : C.brick }}>
          {profit < 0 ? "−" : ""}{inr(Math.abs(profit))}
        </div>
        <div className="f-body text-[12px] mt-1" style={{ color: C.inkMuted }}>profit for {periodText}</div>
      </div>

      <div className="flex flex-col">
        {rows.map((r, i) => (
          <div key={r.label} className="flex items-center justify-between py-2" style={{ borderTop: i === 0 ? `1px solid ${C.hairline}` : `1px solid ${C.hairline}` }}>
            <span className="f-body text-[13px]" style={{ color: C.inkMuted }}>{r.label}</span>
            <span className="f-mono text-[13.5px] font-semibold" style={{ color: r.sign ? C.brick : C.ink }}>
              {r.sign}{inr(r.value)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
