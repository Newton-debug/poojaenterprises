"use client";
import Link from "next/link";
import { ChevronRight, ListTree } from "lucide-react";
import { C, useDashboardData } from "./lib/dashboardData";
import Shell from "./components/Shell";
import Header from "./components/Header";
import PendingOrders from "./components/PendingOrders";
import CompletedOrders from "./components/CompletedOrders";
import CollectionEngine from "./components/CollectionEngine";
import TopVendors from "./components/TopVendors";
import Profitability from "./components/Profitability";

export default function HomePage() {
  const { status, orders, completedOrders, allDays, monthsList, collectionRows, labourRows, purchaseRows, otherExpenseRows } = useDashboardData();

  return (
    <Shell>
      <Header orders={orders} allDays={allDays} companyName="Pooja Enterprises" />
      <div className="px-4">
        {status === "loading" && <div className="f-body text-[13px] text-center py-10" style={{ color: C.inkMuted }}>Loading your data…</div>}
        {status === "error" && (
          <div className="rounded-2xl p-5 mb-4 f-body text-[13px]" style={{ backgroundColor: C.brickSoft, color: C.brick }}>
            Couldn't load data. Make sure SHEETDB_URL in app/lib/dashboardData.js is your real SheetDB link, and your sheet has tabs named exactly "Orders" and "Collections".
          </div>
        )}
        {status === "ready" && (
          <>
            <Profitability
              collectionRows={collectionRows}
              labourRows={labourRows}
              purchaseRows={purchaseRows}
              otherExpenseRows={otherExpenseRows}
              monthsList={monthsList}
            />
            <PendingOrders orders={orders} />
            <CompletedOrders completed={completedOrders} />
            <CollectionEngine allDays={allDays} monthsList={monthsList} />
            <TopVendors rows={collectionRows} monthsList={monthsList} />

            <Link href="/breakdown"
              className="flex items-center justify-between rounded-2xl p-5 mb-4"
              style={{ backgroundColor: C.ink }}>
              <div className="flex items-center gap-2.5">
                <ListTree size={18} color={C.paper} />
                <span className="f-display text-[15px] font-semibold" style={{ color: C.paper }}>View Full Breakdown</span>
              </div>
              <ChevronRight size={18} color={C.paper} />
            </Link>
          </>
        )}
      </div>
    </Shell>
  );
}
