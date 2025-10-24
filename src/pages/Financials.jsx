import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar
} from "recharts";

function Card({ className = "", children }) {
  return <div className={`rounded-2xl shadow-lg bg-white/80 backdrop-blur p-5 ${className}`}>{children}</div>;
}
function SectionTitle({ children }) {
  return <h2 className="text-xl font-semibold mb-2">{children}</h2>;
}
function LabeledInput({ label, suffix, ...props }) {
  return (
    <label className="block mb-3">
      <div className="text-sm text-gray-700 mb-1 flex items-center justify-between">
        <span>{label}</span>
        {suffix ? <span className="text-gray-400">{suffix}</span> : null}
      </div>
      <input {...props} className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300" inputMode="decimal" />
    </label>
  );
}
function NumberInput({ label, value, onChange, min = 0, step = 1, suffix }) {
  return (
    <LabeledInput
      label={label}
      type="number"
      value={value}
      min={min}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
      suffix={suffix}
    />
  );
}
function Stat({ label, value, prefix = "" }) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-pink-50 to-sky-50 border border-gray-100 p-4">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-lg font-semibold">{prefix}{Number(value || 0).toLocaleString()}</div>
    </div>
  );
}
function HelmetNoIndex() {
  useEffect(() => {
    const m = document.createElement("meta");
    m.name = "robots";
    m.content = "noindex,nofollow";
    document.head.appendChild(m);
    return () => { document.head.removeChild(m); };
  }, []);
  return null;
}

function useQueryState(defaults) {
  const [state, setState] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const restored = { ...defaults };
    for (const k of Object.keys(defaults)) {
      const v = params.get(k);
      if (v !== null) {
        const n = Number(v);
        restored[k] = Number.isFinite(n) ? n : v;
      }
    }
    const ls = localStorage.getItem("proj_state");
    if (ls && window.location.search === "") {
      try { return { ...restored, ...JSON.parse(ls) }; } catch (err) {
        console.warn("Failed to parse saved projections state", err);
      }
    }
    return restored;
  });

  useEffect(() => {
    const sp = new URLSearchParams();
    Object.entries(state).forEach(([k, v]) => sp.set(k, String(v)));
    const q = sp.toString();
    const url = `${window.location.pathname}?${q}`;
    window.history.replaceState(null, "", url);
    localStorage.setItem("proj_state", JSON.stringify(state));
  }, [state]);

  return [state, setState];
}

function generateMonths(n = 24) { return Array.from({ length: n }, (_, i) => i + 1); }
function sum(arr) { return arr.reduce((a, b) => a + b, 0); }
function round2(n) { return Math.round(n * 100) / 100; }

function calcProjections(s) {
  const months = generateMonths(s.horizonMonths);
  const matDropInRevenue = months.map(() => s.matDropInPrice * s.matDropInsPerMonth);
  const reformerDropInRevenue = months.map(() => s.reformerDropInPrice * s.reformerDropInsPerMonth);
  const matMembershipRevenue = months.map(() => s.matMembershipPrice * s.matMembershipCount);
  const reformerMembershipRevenue = months.map(() => s.reformerMembershipPrice * s.reformerMembershipCount);
  const hybridMembershipRevenue = months.map(() => s.hybridMembershipPrice * s.hybridMembershipCount);
  const matClassRevenue = months.map(() =>
    s.enableClassRev ? s.matClassesPerDay * 30 * s.matCapacity * (s.matUtilization / 100) * s.matDropInPrice : 0
  );
  const reformerClassRevenue = months.map(() =>
    s.enableClassRev ? s.reformerClassesPerDay * 30 * s.reformerCapacity * (s.reformerUtilization / 100) * s.reformerDropInPrice : 0
  );
  const totalRevenue = months.map((_, i) =>
    matDropInRevenue[i] + reformerDropInRevenue[i] + matMembershipRevenue[i] +
    reformerMembershipRevenue[i] + hybridMembershipRevenue[i] + matClassRevenue[i] + reformerClassRevenue[i]
  );
  const matInstructorCost = months.map(() =>
    s.matClassesPerDay * 30 * (s.matInstructorBase + s.matInstructorPerStudent * s.matCapacity * (s.matUtilization / 100))
  );
  const reformerInstructorCost = months.map(() =>
    s.reformerClassesPerDay * 30 * (s.reformerInstructorBase + s.reformerInstructorPerStudent * s.reformerCapacity * (s.reformerUtilization / 100))
  );
  const fixedCosts = months.map(() => s.rent + s.utilities + s.insurance + s.software + s.otherFixed);
  const variableCosts = months.map((_, i) => totalRevenue[i] * (s.variableCostPct / 100));
  const cogs = months.map(() => s.cogsPerMonth);
  const totalExpenses = months.map((_, i) =>
    matInstructorCost[i] + reformerInstructorCost[i] + fixedCosts[i] + variableCosts[i] + cogs[i]
  );
  const ebitda = months.map((_, i) => totalRevenue[i] - totalExpenses[i]);
  const preTaxIncome = ebitda;
  const taxes = months.map((_, i) => Math.max(0, preTaxIncome[i] * (s.taxRatePct / 100)));
  const netIncome = months.map((_, i) => preTaxIncome[i] - taxes[i]);
  let cum = -s.startupCosts;
  const cumulative = months.map((_, i) => (cum += netIncome[i]));
  const breakEvenMonth = cumulative.findIndex((v) => v >= 0) + 1 || null;

  const rows = months.map((m, i) => ({
    month: `M${m}`,
    revenue: round2(totalRevenue[i]),
    expenses: round2(totalExpenses[i]),
    profit: round2(netIncome[i]),
    cumulative: round2(cumulative[i]),
    matDropIn: round2(matDropInRevenue[i]),
    reformerDropIn: round2(reformerDropInRevenue[i]),
    matMembership: round2(matMembershipRevenue[i]),
    reformerMembership: round2(reformerMembershipRevenue[i]),
    hybridMembership: round2(hybridMembershipRevenue[i]),
    matClassRev: round2(matClassRevenue[i]),
    reformerClassRev: round2(reformerClassRevenue[i]),
  }));

  return {
    rows,
    totals: {
      revenue: sum(totalRevenue),
      expenses: sum(totalExpenses),
      profit: sum(netIncome),
      startup: s.startupCosts,
    },
    breakEvenMonth: Number.isFinite(breakEvenMonth) && breakEvenMonth > 0 ? breakEvenMonth : null,
  };
}

function PasswordGate({ children }) {
  const keyName = "projections_pass_ok";
  const [ok, setOk] = useState(() => localStorage.getItem(keyName) === "1");
  const [pw, setPw] = useState("");
  const CORRECT = import.meta.env.VITE_PROJECTIONS_PASSWORD || "daydream";
  if (ok) return children;
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-50 to-sky-50 p-6">
      <Card className="max-w-sm w-full">
        <h1 className="text-2xl font-bold mb-4">Private Page</h1>
        <p className="text-sm text-gray-600 mb-4">Enter the password to view financial projections.</p>
        <input type="password" className="w-full rounded-xl border border-gray-200 px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
               placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} />
        <button className="w-full rounded-xl bg-black text-white py-2 font-medium hover:opacity-90"
          onClick={() => { if (pw === CORRECT) { localStorage.setItem(keyName, "1"); setOk(true); } else { alert("Incorrect password"); } }}>
          Unlock
        </button>
      </Card>
    </div>
  );
}

export default function Financials() {
  const defaults = {
    horizonMonths: 24,
    matDropInsPerMonth: 40, reformerDropInsPerMonth: 60,
    matDropInPrice: 25, reformerDropInPrice: 35,
    matMembershipCount: 30, matMembershipPrice: 70,
    reformerMembershipCount: 35, reformerMembershipPrice: 220,
    hybridMembershipCount: 20, hybridMembershipPrice: 140,
    enableClassRev: 1,
    matClassesPerDay: 3, matCapacity: 20, matUtilization: 45,
    reformerClassesPerDay: 4, reformerCapacity: 6, reformerUtilization: 55,
    matInstructorBase: 35, matInstructorPerStudent: 0,
    reformerInstructorBase: 50, reformerInstructorPerStudent: 0,
    rent: 3000, utilities: 300, insurance: 200, software: 150, otherFixed: 250,
    variableCostPct: 4, cogsPerMonth: 0,
    startupCosts: 15000, taxRatePct: 5,
  };

  const [s, setS] = useQueryState(defaults);
  const res = useMemo(() => calcProjections(s), [s]);

  return (
    <PasswordGate>
      <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-sky-50">
        <HelmetNoIndex />
        <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-pink-200 to-sky-200" />
              <h1 className="text-lg sm:text-xl font-bold">Financial Projections (Private)</h1>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <a className="px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50" href={window.location.href}>Share (URL encodes inputs)</a>
              <button className="px-3 py-1.5 rounded-xl bg-black text-white"
                onClick={() => { localStorage.removeItem("proj_state"); window.location.search = ""; }}>
                Reset
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.aside initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="lg:col-span-1">
            <Card>
              <SectionTitle>Scenario Inputs</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <NumberInput label="Horizon (months)" value={s.horizonMonths} onChange={(v) => setS({ ...s, horizonMonths: v })} />
                <div className="col-span-2 text-sm text-gray-500 mt-1">Revenue – Drop-Ins</div>
                <NumberInput label="Mat drop-ins/mo" value={s.matDropInsPerMonth} onChange={(v) => setS({ ...s, matDropInsPerMonth: v })} />
                <NumberInput label="Mat drop-in $" value={s.matDropInPrice} onChange={(v) => setS({ ...s, matDropInPrice: v })} />
                <NumberInput label="Reformer drop-ins/mo" value={s.reformerDropInsPerMonth} onChange={(v) => setS({ ...s, reformerDropInsPerMonth: v })} />
                <NumberInput label="Reformer drop-in $" value={s.reformerDropInPrice} onChange={(v) => setS({ ...s, reformerDropInPrice: v })} />
                <div className="col-span-2 text-sm text-gray-500 mt-1">Revenue – Memberships</div>
                <NumberInput label="Mat members" value={s.matMembershipCount} onChange={(v) => setS({ ...s, matMembershipCount: v })} />
                <NumberInput label="Mat member $" value={s.matMembershipPrice} onChange={(v) => setS({ ...s, matMembershipPrice: v })} />
                <NumberInput label="Reformer members" value={s.reformerMembershipCount} onChange={(v) => setS({ ...s, reformerMembershipCount: v })} />
                <NumberInput label="Reformer member $" value={s.reformerMembershipPrice} onChange={(v) => setS({ ...s, reformerMembershipPrice: v })} />
                <NumberInput label="Hybrid members" value={s.hybridMembershipCount} onChange={(v) => setS({ ...s, hybridMembershipCount: v })} />
                <NumberInput label="Hybrid member $" value={s.hybridMembershipPrice} onChange={(v) => setS({ ...s, hybridMembershipPrice: v })} />
                <div className="col-span-2 text-sm text-gray-500 mt-1">Revenue – Classes (toggle)</div>
                <label className="col-span-2 flex items-center gap-2 mb-2">
                  <input type="checkbox" checked={!!s.enableClassRev} onChange={(e) => setS({ ...s, enableClassRev: e.target.checked ? 1 : 0 })} />
                  <span className="text-sm">Include capacity-based class revenue</span>
                </label>
                <NumberInput label="Mat classes/day" value={s.matClassesPerDay} onChange={(v) => setS({ ...s, matClassesPerDay: v })} />
                <NumberInput label="Mat capacity" value={s.matCapacity} onChange={(v) => setS({ ...s, matCapacity: v })} />
                <NumberInput label="Mat utilization %" value={s.matUtilization} onChange={(v) => setS({ ...s, matUtilization: v })} />
                <NumberInput label="Reformer classes/day" value={s.reformerClassesPerDay} onChange={(v) => setS({ ...s, reformerClassesPerDay: v })} />
                <NumberInput label="Reformer capacity" value={s.reformerCapacity} onChange={(v) => setS({ ...s, reformerCapacity: v })} />
                <NumberInput label="Reformer utilization %" value={s.reformerUtilization} onChange={(v) => setS({ ...s, reformerUtilization: v })} />
                <div className="col-span-2 text-sm text-gray-500 mt-1">Instructor Pay</div>
                <NumberInput label="Mat base/class" value={s.matInstructorBase} onChange={(v) => setS({ ...s, matInstructorBase: v })} />
                <NumberInput label="Mat $/student" value={s.matInstructorPerStudent} onChange={(v) => setS({ ...s, matInstructorPerStudent: v })} />
                <NumberInput label="Reformer base/class" value={s.reformerInstructorBase} onChange={(v) => setS({ ...s, reformerInstructorBase: v })} />
                <NumberInput label="Reformer $/student" value={s.reformerInstructorPerStudent} onChange={(v) => setS({ ...s, reformerInstructorPerStudent: v })} />
                <div className="col-span-2 text-sm text-gray-500 mt-1">Fixed Costs (monthly)</div>
                <NumberInput label="Rent" value={s.rent} onChange={(v) => setS({ ...s, rent: v })} />
                <NumberInput label="Utilities" value={s.utilities} onChange={(v) => setS({ ...s, utilities: v })} />
                <NumberInput label="Insurance" value={s.insurance} onChange={(v) => setS({ ...s, insurance: v })} />
                <NumberInput label="Software" value={s.software} onChange={(v) => setS({ ...s, software: v })} />
                <NumberInput label="Other fixed" value={s.otherFixed} onChange={(v) => setS({ ...s, otherFixed: v })} />
                <div className="col-span-2 text-sm text-gray-500 mt-1">Variable & Other</div>
                <NumberInput label="Variable cost %" value={s.variableCostPct} onChange={(v) => setS({ ...s, variableCostPct: v })} />
                <NumberInput label="COGS/mo" value={s.cogsPerMonth} onChange={(v) => setS({ ...s, cogsPerMonth: v })} />
                <div className="col-span-2 text-sm text-gray-500 mt-1">Startup & Taxes</div>
                <NumberInput label="Startup one-time" value={s.startupCosts} onChange={(v) => setS({ ...s, startupCosts: v })} />
                <NumberInput label="Tax rate %" value={s.taxRatePct} onChange={(v) => setS({ ...s, taxRatePct: v })} />
              </div>
            </Card>
          </motion.aside>

          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.25 }} className="lg:col-span-2 space-y-6">
            <Card>
              <SectionTitle>Summary</SectionTitle>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat label="Total Revenue" value={res.totals.revenue} prefix="$" />
                <Stat label="Total Expenses" value={res.totals.expenses} prefix="$" />
                <Stat label="Total Profit" value={res.totals.profit} prefix="$" />
                <Stat label="Startup Cost" value={res.totals.startup} prefix="$" />
              </div>
              <div className="mt-3 text-sm text-gray-600">
                {res.breakEvenMonth ? (
                  <span>Estimated break-even: <b>Month {res.breakEvenMonth}</b> (cumulative profit ≥ 0)</span>
                ) : (<span>No break-even within horizon.</span>)}
              </div>
            </Card>

            <Card>
              <SectionTitle>Revenue, Expenses & Profit (Monthly)</SectionTitle>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={res.rows} margin={{ left: 12, right: 20, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" name="Revenue" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="expenses" name="Expenses" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="profit" name="Profit" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <SectionTitle>Revenue Breakdown (Monthly)</SectionTitle>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={res.rows} margin={{ left: 12, right: 20, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
                    <Legend />
                    <Bar stackId="rev" dataKey="matDropIn" name="Mat Drop-ins" />
                    <Bar stackId="rev" dataKey="reformerDropIn" name="Reformer Drop-ins" />
                    <Bar stackId="rev" dataKey="matMembership" name="Mat Memberships" />
                    <Bar stackId="rev" dataKey="reformerMembership" name="Reformer Memberships" />
                    <Bar stackId="rev" dataKey="hybridMembership" name="Hybrid Memberships" />
                    <Bar stackId="rev" dataKey="matClassRev" name="Mat Classes" />
                    <Bar stackId="rev" dataKey="reformerClassRev" name="Reformer Classes" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <SectionTitle>Monthly Table</SectionTitle>
              <div className="overflow-auto max-h-[420px]">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="text-left">
                      {["Month","Revenue","Expenses","Profit","Cumulative"].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {res.rows.map((r) => (
                      <tr key={r.month} className="border-b last:border-0">
                        <td className="px-3 py-2 font-medium">{r.month}</td>
                        <td className="px-3 py-2">${r.revenue.toLocaleString()}</td>
                        <td className="px-3 py-2">${r.expenses.toLocaleString()}</td>
                        <td className={`px-3 py-2 ${r.profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>${r.profit.toLocaleString()}</td>
                        <td className="px-3 py-2">${r.cumulative.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.section>
        </main>

        <footer className="py-10 text-center text-xs text-gray-500">
          Private – noindex. Consider protecting with Cloudflare Access for extra security.
        </footer>
      </div>
    </PasswordGate>
  );
}
