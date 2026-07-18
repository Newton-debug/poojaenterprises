"use client";
import { useEffect, useState } from "react";

/* PASTE YOUR SHEETDB URL HERE */
export const SHEETDB_URL = "https://sheetdb.io/api/v1/2lhcimkjxmeqw";

/* Sheet "Orders": vendor, model, orderdate, status, completeddate
   Sheet "Collections": date, amount, mode, party
   Sheet "Labour": date, name, amount, note
   Sheet "Purchase": date, vendor, amount, note
   Sheet "OtherExpenses": date, category, amount, note
   Dates as dd-mm-yy or dd-mm-yyyy. Tab names must match exactly. */

export const C = {
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
  forestSoft: "#DEE9DF",
};

export const inr = (n) => "₹" + new Intl.NumberFormat("en-IN").format(Math.round(n || 0));
export const toNumber = (v) => Number(String(v ?? "").replace(/[^0-9.-]/g, "")) || 0;

export function normalizeRow(row) {
  const out = {};
  Object.keys(row).forEach((k) => {
    out[k.trim().toLowerCase()] = typeof row[k] === "string" ? row[k].trim() : row[k];
  });
  return out;
}

export function parseSheetDate(str) {
  if (!str) return new Date(NaN);
  const parts = String(str).trim().split(/[\/\-.]/);
  if (parts.length !== 3) return new Date(str);
  const nums = parts.map((p) => parseInt(p, 10));
  if (String(parts[0]).length === 4) {
    const [y, m, d] = nums;
    return new Date(y, m - 1, d);
  }
  let [d, m, y] = nums;
  if (y < 100) y += 2000;
  return new Date(y, m - 1, d);
}

export function daysBetween(dateStr) {
  const then = parseSheetDate(dateStr);
  const now = new Date();
  if (isNaN(then)) return 0;
  return Math.max(0, Math.floor((now - then) / 86400000));
}

export function monthKeyOfDate(d) {
  if (isNaN(d)) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabelOf(key) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export function pendingTone(days) {
  if (days >= 15) return { color: C.brick };
  if (days >= 8) return { color: C.amber };
  return { color: C.forest };
}

export function startOfWeek(d) {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function parseLedgerRows(raw, labelField) {
  return raw
    .map(normalizeRow)
    .filter((r) => r.date && r.amount)
    .map((r) => {
      const d = parseSheetDate(r.date);
      return { dateObj: d, monthKey: monthKeyOfDate(d), amount: toNumber(r.amount), label: r[labelField] || "Unspecified" };
    })
    .filter((r) => !isNaN(r.dateObj) && r.monthKey);
}

export function sumForPeriod(rows, mode, monthKey) {
  const now = new Date();
  if (mode === "year") return rows.filter((r) => r.dateObj.getFullYear() === now.getFullYear()).reduce((s, r) => s + r.amount, 0);
  if (mode === "all") return rows.reduce((s, r) => s + r.amount, 0);
  if (mode === "specificMonth") return rows.filter((r) => r.monthKey === monthKey).reduce((s, r) => s + r.amount, 0);
  const mk = monthKeyOfDate(now);
  return rows.filter((r) => r.monthKey === mk).reduce((s, r) => s + r.amount, 0);
}

export function useDashboardData() {
  const [status, setStatus] = useState("loading");
  const [orders, setOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [allDays, setAllDays] = useState([]);
  const [monthsList, setMonthsList] = useState([]);
  const [collectionRows, setCollectionRows] = useState([]);
  const [labourRows, setLabourRows] = useState([]);
  const [purchaseRows, setPurchaseRows] = useState([]);
  const [otherExpenseRows, setOtherExpenseRows] = useState([]);

  useEffect(() => {
    async function load() {
      if (!SHEETDB_URL || SHEETDB_URL.includes("PASTE_YOUR_SHEETDB_URL")) {
        setStatus("error");
        return;
      }
      try {
        const noStore = { cache: "no-store" };
        const [ordersRaw, collectionsRaw, labourRaw, purchaseRaw, otherRaw] = await Promise.all([
          fetch(`${SHEETDB_URL}?sheet=Orders`, noStore).then((r) => r.json()),
          fetch(`${SHEETDB_URL}?sheet=Collections`, noStore).then((r) => r.json()),
          fetch(`${SHEETDB_URL}?sheet=Labour`, noStore).then((r) => r.json()).catch(() => []),
          fetch(`${SHEETDB_URL}?sheet=Purchase`, noStore).then((r) => r.json()).catch(() => []),
          fetch(`${SHEETDB_URL}?sheet=OtherExpenses`, noStore).then((r) => r.json()).catch(() => []),
        ]);

        const ordersNormalized = ordersRaw.map(normalizeRow).filter((r) => r.vendor);
        const isDone = (r) => {
          const s = String(r.status || "").toLowerCase();
          return s.includes("complete") || s.includes("done");
        };

        setOrders(
          ordersNormalized
            .filter((r) => !isDone(r))
            .map((r) => ({ vendor: r.vendor, model: r.model, days: daysBetween(r.orderdate) }))
            .sort((a, b) => b.days - a.days)
        );

        // completed more than 7 days ago drop off the dashboard automatically
        setCompletedOrders(
          ordersNormalized
            .filter(isDone)
            .map((r) => {
              const cd = parseSheetDate(r.completeddate);
              const sinceDays = isNaN(cd) ? 0 : Math.floor((new Date() - cd) / 86400000);
              return {
                vendor: r.vendor,
                model: r.model,
                sortKey: isNaN(cd) ? 0 : cd.getTime(),
                sinceDays,
                completedLabel: isNaN(cd) ? "date not set" : cd.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
              };
            })
            .filter((o) => o.sinceDays <= 7)
            .sort((a, b) => b.sortKey - a.sortKey)
        );

        const txns = collectionsRaw
          .map(normalizeRow)
          .filter((r) => r.date && r.amount)
          .map((r) => {
            const d = parseSheetDate(r.date);
            const modeStr = String(r.mode || "").toLowerCase();
            return {
              dateObj: d,
              monthKey: monthKeyOfDate(d),
              amount: toNumber(r.amount),
              isCash: modeStr.includes("cash"),
              party: r.party || "Unknown",
            };
          })
          .filter((r) => !isNaN(r.dateObj) && r.monthKey);

        setCollectionRows(txns);

        const dayMap = {};
        txns.forEach((r) => {
          const dayKey = r.dateObj.toDateString();
          if (!dayMap[dayKey]) {
            dayMap[dayKey] = {
              sortKey: r.dateObj.getTime(),
              dateObj: r.dateObj,
              label: r.dateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
              cash: 0,
              bank: 0,
            };
          }
          if (r.isCash) dayMap[dayKey].cash += r.amount;
          else dayMap[dayKey].bank += r.amount;
        });

        const daysSorted = Object.values(dayMap).sort((a, b) => a.sortKey - b.sortKey);
        daysSorted.forEach((row, i) => {
          const win = daysSorted.slice(Math.max(0, i - 2), i + 1);
          row.trend = Math.round(win.reduce((s, r) => s + r.cash + r.bank, 0) / win.length);
        });
        setAllDays(daysSorted);

        const monthKeys = Array.from(new Set(daysSorted.map((d) => monthKeyOfDate(d.dateObj)))).sort();

        const labourClean = parseLedgerRows(labourRaw, "name");
        const purchaseClean = parseLedgerRows(purchaseRaw, "vendor");
        const otherClean = parseLedgerRows(otherRaw, "category");
        setLabourRows(labourClean);
        setPurchaseRows(purchaseClean);
        setOtherExpenseRows(otherClean);

        const allMonthKeys = Array.from(new Set([
          ...monthKeys,
          ...labourClean.map((r) => r.monthKey),
          ...purchaseClean.map((r) => r.monthKey),
          ...otherClean.map((r) => r.monthKey),
        ])).sort();
        setMonthsList(allMonthKeys.map((key) => ({ key, label: monthLabelOf(key) })));

        setStatus("ready");
      } catch (e) {
        setStatus("error");
      }
    }
    load();
  }, []);

  return { status, orders, completedOrders, allDays, monthsList, collectionRows, labourRows, purchaseRows, otherExpenseRows };
}
