"use client";
import { C } from "../lib/dashboardData";
import { FontStyles } from "./DashboardUI";

export default function Shell({ children }) {
  return (
    <div className="min-h-screen w-full flex justify-center" style={{ backgroundColor: "#DED6C4", fontFamily: "Inter, sans-serif" }}>
      <FontStyles />
      <div className="relative w-full max-w-[430px] sm:my-6 sm:rounded-[2.25rem] sm:shadow-2xl overflow-hidden" style={{ backgroundColor: C.paper }}>
        <div className="h-screen sm:h-[860px] overflow-y-auto" style={{ paddingBottom: 32 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
