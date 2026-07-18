"use client";
import { C, pendingTone } from "../lib/dashboardData";
import { SectionHeader, EmptyCard, TickGauge } from "./DashboardUI";

export default function PendingOrders({ orders }) {
  if (!orders.length) {
    return <EmptyCard eyebrow="The Red Zone" title="Pending Orders" accent={C.brick} message="No rows found in the 'Orders' tab yet." />;
  }
  const avg = Math.round(orders.reduce((s, o) => s + o.days, 0) / orders.length);

  return (
    <section className="rounded-2xl p-5 mb-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.hairline}` }}>
      <SectionHeader eyebrow="The Red Zone" title="Pending Orders" accent={C.brick}
        subtitle={`${orders.length} in production · avg ${avg} days`} />
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
