"use client";
import { useState } from "react";
import { ChevronDown, CheckCircle2 } from "lucide-react";
import { C } from "../lib/dashboardData";

export default function CompletedOrders({ completed }) {
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
            <div className="f-body text-[12px]" style={{ color: C.inkMuted }}>{completed.length} in the last 7 days · tap to {open ? "hide" : "view"}</div>
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
