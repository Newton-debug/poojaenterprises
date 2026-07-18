"use client";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { C, useDashboardData } from "../lib/dashboardData";
import Shell from "../components/Shell";
import LedgerSection from "../components/LedgerSection";

export default function BreakdownPage() {
  const { status, collectionRows, labourRows, purchaseRows, otherExpenseRows } = useDashboardData();

  return (
    <Shell>
      <div className="px-5 pt-6 pb-4">
        <Link href="/" className="flex items-center gap-1.5 mb-4 f-body text-[13px] font-semibold" style={{ color: C.inkMuted }}>
          <ChevronLeft size={16} /> Back to Home
        </Link>
        <h1 className="f-display text-[21px] font-semibold" style={{ color: C.ink }}>Full Breakdown</h1>
        <p className="f-body text-[12.5px] mt-1" style={{ color: C.inkMuted }}>Every entry, filterable by date</p>
      </div>
      <div className="px-4">
        {status === "loading" && <div className="f-body text-[13px] text-center py-10" style={{ color: C.inkMuted }}>Loading…</div>}
        {status === "ready" && (
          <>
            <LedgerSection title="Collection" accent={C.teal} rows={collectionRows} labelKey="party" showModeDot />
            <LedgerSection title="Labour" accent={C.brick} rows={labourRows} labelKey="label" />
            <LedgerSection title="Purchase" accent={C.amber} rows={purchaseRows} labelKey="label" />
            <LedgerSection title="Expenses" accent={C.forest} rows={otherExpenseRows} labelKey="label" />
          </>
        )}
      </div>
    </Shell>
  );
}
