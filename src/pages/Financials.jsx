import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import PriceMatrix from "../components/PriceMatrix.jsx";
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar
} from "recharts";

function Card({ className = "", children }) {
  return <div className={`rounded-2xl shadow-lg bg-white p-4 md:p-5 ${className}`}>{children}</div>;
}
function SectionTitle({ children, right }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-base md:text-lg font-semibold">{children}</h2>
      {right}
    </div>
  );
}
function Labeled({ label, children }) {
  return (
    <label className="space-y-1">
      <div className="text-xs text-gray-600">{label}</div>
      {children}
    </label>
  );
}
function Num({ value, onChange, step=1 }) {
  return (
    <input type="number" inputMode="decimal"
      className="w-28 md:w-32 rounded-lg border border-gray-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
      value={value} step={step} onChange={(e)=>onChange(Number(e.target.value))}/>
  );
}
function Money({ value, onChange, step=1 }) {
  return <Num value={value} onChange={onChange} step={step} />;
}
function Stat({ label, value, prefix = "" }) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-pink-50 to-sky-50 border border-gray-100 p-3">
      <div className="text-xs text-gray-500 mb-0.5">{label}</div>
      <div className="text-base font-semibold">{prefix}{Number(value||0).toLocaleString()}</div>
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
      try { return { ...restored, ...JSON.parse(ls) }; } catch {}
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

function calcProjections(s, priceMatrixAvgs, useMatrix) {
  const months = generateMonths(s.horizonMonths);

  const matPrice = useMatrix && priceMatrixAvgs.matAvg>0 ? priceMatrixAvgs.matAvg : s.matDropInPrice;
  const refPrice = useMatrix && priceMatrixAvgs.refAvg>0 ? priceMatrixAvgs.refAvg : s.reformerDropInPrice;

  const matDropInRevenue = months.map(() => matPrice * s.matDropInsPerMonth);
  const reformerDropInRevenue = months.map(() => refPrice * s.reformerDropInsPerMonth);
  const privateRevenue = months.map(() => s.privateRevenuePerMonth);

  const matMembershipRevenue = months.map(() => s.matMembershipPrice * s.matMembershipCount);
  const reformerMembershipRevenue = months.map(() => s.reformerMembershipPrice * s.reformerMembershipCount);
  const hybridMembershipRevenue = months.map(() => s.hybridMembershipPrice * s.hybridMembershipCount);

  const retailRevenue = months.map(() => s.retailRevenuePerMonth);

  const matClassRevenue = months.map(() =>
    s.enableClassRev ? s.matClassesPerWeek * 4 * s.matCapacity * (s.matUtilization/100) * matPrice : 0
  );
  const reformerClassRevenue = months.map(() =>
    s.enableClassRev ? s.reformerClassesPerWeek * 4 * s.reformerCapacity * (s.reformerUtilization/100) * refPrice : 0
  );

  const totalRevenue = months.map((_, i) =>
    matDropInRevenue[i] + reformerDropInRevenue[i] + privateRevenue[i] +
    matMembershipRevenue[i] + reformerMembershipRevenue[i] + hybridMembershipRevenue[i] +
    retailRevenue[i] + matClassRevenue[i] + reformerClassRevenue[i]
  );

  const matInstructorCost = months.map(() =>
    s.matClassesPerWeek * 4 * (s.matInstructorBase + s.matInstructorPerStudent * s.matCapacity * (s.matUtilization/100))
  );
  const reformerInstructorCost = months.map(() =>
    s.reformerClassesPerWeek * 4 * (s.reformerInstructorBase + s.reformerInstructorPerStudent * s.reformerCapacity * (s.reformerUtilization/100))
  );

  const fixed = months.map(() =>
    s.cleaningSupplies + s.cleaningServices + s.salaries + s.benefits +
    s.insurance + s.licenses + s.marketing + s.rent + s.software +
    s.maintenance + s.legal + s.utilities + s.website + s.depreciation + s.interest
  );

  const variable = months.map((_, i) => totalRevenue[i] * (s.variableCostPct/100));
  const cogs = months.map(() => s.cogsPerMonth);

  const startup = s.equipment + s.furniture + s.renovations;

  const totalExpenses = months.map((_, i) =>
    matInstructorCost[i] + reformerInstructorCost[i] + fixed[i] + variable[i] + cogs[i]
  );

  const ebitda = months.map((_, i) => totalRevenue[i] - totalExpenses[i]);
  const preTax = ebitda;
  const taxes = months.map((_, i) => Math.max(0, preTax[i] * (s.taxRatePct/100)));
  const net = months.map((_, i) => preTax[i] - taxes[i]);

  let cum = -startup;
  const cumulative = months.map((_, i) => (cum += net[i]));
  const breakEvenMonth = cumulative.findIndex(v => v >= 0) + 1 || null;

  const rows = months.map((m, i) => ({
    month: `M${m}`,
    revenue: round2(totalRevenue[i]),
    expenses: round2(totalExpenses[i]),
    profit: round2(net[i]),
    cumulative: round2(cumulative[i]),
    matDropIn: round2(matDropInRevenue[i]),
    reformerDropIn: round2(reformerDropInRevenue[i]),
    matMembership: round2(matMembershipRevenue[i]),
    reformerMembership: round2(reformerMembershipRevenue[i]),
    hybridMembership: round2(hybridMembershipRevenue[i]),
    privateRev: round2(privateRevenue[i]),
    retailRev: round2(retailRevenue[i]),
    matClassRev: round2(matClassRevenue[i]),
    reformerClassRev: round2(reformerClassRevenue[i]),
  }));

  return {
    rows,
    totals: { revenue: sum(totalRevenue), expenses: sum(totalExpenses), profit: sum(net), startup },
    breakEvenMonth: Number.isFinite(breakEvenMonth) && breakEvenMonth>0 ? breakEvenMonth : null
  };
}

export default function Financials() {
  const defaults = {
    horizonMonths: 12,
    matClassesPerWeek: 28,
    reformerClassesPerWeek: 42,
    matCapacity: 20,
    matUtilization: 50,
    reformerCapacity: 6,
    reformerUtilization: 50,
    matDropInsPerMonth: 40,
    reformerDropInsPerMonth: 60,
    privateRevenuePerMonth: 0,
    retailRevenuePerMonth: 0,
    matDropInPrice: 25,
    reformerDropInPrice: 35,
    matMembershipCount: 30,
    matMembershipPrice: 160,
    reformerMembershipCount: 20,
    reformerMembershipPrice: 280,
    hybridMembershipCount: 15,
    hybridMembershipPrice: 140,
    enableClassRev: 1,
    matInstructorBase: 50,
    matInstructorPerStudent: 0,
    reformerInstructorBase: 50,
    reformerInstructorPerStudent: 0,
    cleaningSupplies: 100,
    cleaningServices: 150,
    salaries: 14000,
    benefits: 0,
    insurance: 600,
    licenses: 50,
    marketing: 1000,
    renovations: 10000,
    equipment: 28725,
    furniture: 6500,
    rent: 5000,
    software: 500 + 1250,
    maintenance: 200,
    legal: 500,
    utilities: 350,
    website: 500,
    depreciation: 0,
    interest: 0,
    variableCostPct: 4,
    cogsPerMonth: 0,
    taxRatePct: 5,
  };

  const [s, setS] = useQueryState(defaults);
  const [useMatrix, setUseMatrix] = useState(true);
  const [matrixRows, setMatrixRows] = useState([
    { id: 1,  type: "Mat",      option: "Drop-In",           price: 25,  uses: 1  },
    { id: 2,  type: "Mat",      option: "5-Pack",            price: 115, uses: 5  },
    { id: 3,  type: "Mat",      option: "10-Pack",           price: 220, uses: 10 },
    { id: 4,  type: "Mat",      option: "20-Pack",           price: 400, uses: 20 },
    { id: 5,  type: "Mat",      option: "Monthly Unlimited", price: 160, uses: 10 },
    { id: 6,  type: "Reformer", option: "Drop-In",           price: 35,  uses: 1  },
    { id: 7,  type: "Reformer", option: "5-Pack",            price: 165, uses: 5  },
    { id: 8,  type: "Reformer", option: "10-Pack",           price: 310, uses: 10 },
    { id: 9,  type: "Reformer", option: "20-Pack",           price: 560, uses: 20 },
    { id: 10, type: "Reformer", option: "Monthly Unlimited", price: 280, uses: 12 },
  ]);

  const priceMatrixAvgs = useMemo(() => {
    const agg = { Mat: { total:0, uses:0 }, Reformer: { total:0, uses:0 } };
    matrixRows.forEach(r => {
      if ((r.type === "Mat" || r.type === "Reformer") && Number(r.uses)>0){
        agg[r.type].total += Number(r.price||0);
        agg[r.type].uses  += Number(r.uses||0);
      }
    });
    return {
      matAvg: agg.Mat.uses>0 ? agg.Mat.total/agg.Mat.uses : 0,
      refAvg: agg.Reformer.uses>0 ? agg.Reformer.total/agg.Reformer.uses : 0,
    };
  }, [matrixRows]);

  const res = useMemo(() => calcProjections(s, priceMatrixAvgs, useMatrix), [s, priceMatrixAvgs, useMatrix]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-sky-50">
      <HelmetNoIndex />
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-pink-200 to-sky-200" />
            <h1 className="text-lg font-bold">Financial Projections (Private)</h1>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <a className="px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50" href={window.location.href}>Share</a>
            <button className="px-3 py-1.5 rounded-xl bg-black text-white"
              onClick={() => { localStorage.removeItem("proj_state"); window.location.search = ""; }}>
              Reset
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.aside initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="lg:col-span-1 space-y-5">
          <Card>
            <SectionTitle>Scenario</SectionTitle>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Labeled label="Horizon (months)"><Num value={s.horizonMonths} onChange={v=>setS({...s, horizonMonths:v})}/></Labeled>
              <Labeled label="Use Price Matrix?">
                <input type="checkbox" className="h-5 w-5" checked={useMatrix} onChange={e=>setUseMatrix(e.target.checked)} />
              </Labeled>
              <Labeled label="Var. Cost %"><Num value={s.variableCostPct} onChange={v=>setS({...s, variableCostPct:v})}/></Labeled>
              <Labeled label="Tax Rate %"><Num value={s.taxRatePct} onChange={v=>setS({...s, taxRatePct:v})}/></Labeled>
            </div>
          </Card>

          <Card>
            <SectionTitle right={
              <label className="text-xs flex items-center gap-2">
                <input type="checkbox" checked={!!s.enableClassRev} onChange={e=>setS({...s, enableClassRev: e.target.checked?1:0})}/>
                Include capacity revenue
              </label>
            }>Classes & Capacity</SectionTitle>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Labeled label="Mat classes / wk"><Num value={s.matClassesPerWeek} onChange={v=>setS({...s, matClassesPerWeek:v})}/></Labeled>
              <Labeled label="Mat capacity"><Num value={s.matCapacity} onChange={v=>setS({...s, matCapacity:v})}/></Labeled>
              <Labeled label="Mat utilization %"><Num value={s.matUtilization} onChange={v=>setS({...s, matUtilization:v})}/></Labeled>

              <Labeled label="Reformer classes / wk"><Num value={s.reformerClassesPerWeek} onChange={v=>setS({...s, reformerClassesPerWeek:v})}/></Labeled>
              <Labeled label="Reformer capacity"><Num value={s.reformerCapacity} onChange={v=>setS({...s, reformerCapacity:v})}/></Labeled>
              <Labeled label="Reformer utilization %"><Num value={s.reformerUtilization} onChange={v=>setS({...s, reformerUtilization:v})}/></Labeled>
            </div>
          </Card>

          <Card>
            <SectionTitle>Direct Sales & Memberships</SectionTitle>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Labeled label="Mat drop-ins / mo"><Num value={s.matDropInsPerMonth} onChange={v=>setS({...s, matDropInsPerMonth:v})}/></Labeled>
              <Labeled label="Mat drop-in $ (fallback)"><Money value={s.matDropInPrice} onChange={v=>setS({...s, matDropInPrice:v})}/></Labeled>
              <Labeled label="Private/semi-private $/mo"><Money value={s.privateRevenuePerMonth} onChange={v=>setS({...s, privateRevenuePerMonth:v})}/></Labeled>

              <Labeled label="Reformer drop-ins / mo"><Num value={s.reformerDropInsPerMonth} onChange={v=>setS({...s, reformerDropInsPerMonth:v})}/></Labeled>
              <Labeled label="Reformer drop-in $ (fallback)"><Money value={s.reformerDropInPrice} onChange={v=>setS({...s, reformerDropInPrice:v})}/></Labeled>
              <Labeled label="Retail / pop-up $/mo"><Money value={s.retailRevenuePerMonth} onChange={v=>setS({...s, retailRevenuePerMonth:v})}/></Labeled>

              <Labeled label="Mat members"><Num value={s.matMembershipCount} onChange={v=>setS({...s, matMembershipCount:v})}/></Labeled>
              <Labeled label="Mat member $"><Money value={s.matMembershipPrice} onChange={v=>setS({...s, matMembershipPrice:v})}/></Labeled>

              <Labeled label="Reformer members"><Num value={s.reformerMembershipCount} onChange={v=>setS({...s, reformerMembershipCount:v})}/></Labeled>
              <Labeled label="Reformer member $"><Money value={s.reformerMembershipPrice} onChange={v=>setS({...s, reformerMembershipPrice:v})}/></Labeled>

              <Labeled label="Hybrid members"><Num value={s.hybridMembershipCount} onChange={v=>setS({...s, hybridMembershipCount:v})}/></Labeled>
              <Labeled label="Hybrid member $"><Money value={s.hybridMembershipPrice} onChange={v=>setS({...s, hybridMembershipPrice:v})}/></Labeled>
            </div>
          </Card>

          <Card>
            <SectionTitle>Instructor Pay</SectionTitle>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Labeled label="Mat base / class"><Money value={s.matInstructorBase} onChange={v=>setS({...s, matInstructorBase:v})}/></Labeled>
              <Labeled label="Mat $/student"><Money value={s.matInstructorPerStudent} onChange={v=>setS({...s, matInstructorPerStudent:v})}/></Labeled>
              <div />
              <Labeled label="Reformer base / class"><Money value={s.reformerInstructorBase} onChange={v=>setS({...s, reformerInstructorBase:v})}/></Labeled>
              <Labeled label="Reformer $/student"><Money value={s.reformerInstructorPerStudent} onChange={v=>setS({...s, reformerInstructorPerStudent:v})}/></Labeled>
            </div>
          </Card>

          <Card>
            <SectionTitle>Expenses (Monthly)</SectionTitle>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Labeled label="Cleaning supplies"><Money value={s.cleaningSupplies} onChange={v=>setS({...s, cleaningSupplies:v})}/></Labeled>
              <Labeled label="Cleaning services"><Money value={s.cleaningServices} onChange={v=>setS({...s, cleaningServices:v})}/></Labeled>
              <Labeled label="Salaries & wages"><Money value={s.salaries} onChange={v=>setS({...s, salaries:v})}/></Labeled>
              <Labeled label="Employee taxes/benefits"><Money value={s.benefits} onChange={v=>setS({...s, benefits:v})}/></Labeled>
              <Labeled label="Insurance"><Money value={s.insurance} onChange={v=>setS({...s, insurance:v})}/></Labeled>
              <Labeled label="Licenses & permits"><Money value={s.licenses} onChange={v=>setS({...s, licenses:v})}/></Labeled>
              <Labeled label="Marketing & ads"><Money value={s.marketing} onChange={v=>setS({...s, marketing:v})}/></Labeled>
              <Labeled label="Rent/lease"><Money value={s.rent} onChange={v=>setS({...s, rent:v})}/></Labeled>
              <Labeled label="Software (POS/booking)"><Money value={s.software} onChange={v=>setS({...s, software:v})}/></Labeled>
              <Labeled label="Studio maintenance"><Money value={s.maintenance} onChange={v=>setS({...s, maintenance:v})}/></Labeled>
              <Labeled label="Trademark/legal"><Money value={s.legal} onChange={v=>setS({...s, legal:v})}/></Labeled>
              <Labeled label="Utilities"><Money value={s.utilities} onChange={v=>setS({...s, utilities:v})}/></Labeled>
              <Labeled label="Website design"><Money value={s.website} onChange={v=>setS({...s, website:v})}/></Labeled>
              <Labeled label="Depreciation"><Money value={s.depreciation} onChange={v=>setS({...s, depreciation:v})}/></Labeled>
              <Labeled label="Interest expense"><Money value={s.interest} onChange={v=>setS({...s, interest:v})}/></Labeled>
            </div>
          </Card>

          <Card>
            <SectionTitle>Startup One-Time</SectionTitle>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Labeled label="Equipment (reformers, mats)"><Money value={s.equipment} onChange={v=>setS({...s, equipment:v})}/></Labeled>
              <Labeled label="Furniture/Decor"><Money value={s.furniture} onChange={v=>setS({...s, furniture:v})}/></Labeled>
              <Labeled label="Renovations/Buildout"><Money value={s.renovations} onChange={v=>setS({...s, renovations:v})}/></Labeled>
            </div>
          </Card>

          <Card>
            <SectionTitle>Prices Matrix</SectionTitle>
            <div className="text-xs text-gray-600 mb-2">
              Edit prices/uses. If “Use Price Matrix” is on, class revenue uses the average effective $/class.
            </div>
            <PriceMatrix rows={matrixRows} setRows={setMatrixRows} />
          </Card>
        </motion.aside>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="lg:col-span-2 space-y-5">
          <Card>
            <SectionTitle>Summary</SectionTitle>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label="Total Revenue" value={res.totals.revenue} prefix="$" />
              <Stat label="Total Expenses" value={res.totals.expenses} prefix="$" />
              <Stat label="Total Profit" value={res.totals.profit} prefix="$" />
              <Stat label="Startup Cost" value={res.totals.startup} prefix="$" />
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {res.breakEvenMonth ? (
                <span>Break-even: <b>Month {res.breakEvenMonth}</b></span>
              ) : (<span>No break-even within horizon.</span>)}
            </div>
          </Card>

          <Card>
            <SectionTitle>Revenue vs Expenses vs Profit (Monthly)</SectionTitle>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={res.rows} margin={{ left: 12, right: 20, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
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
                  <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
                  <Legend />
                  <Bar stackId="rev" dataKey="matDropIn" name="Mat Drop-ins" />
                  <Bar stackId="rev" dataKey="reformerDropIn" name="Reformer Drop-ins" />
                  <Bar stackId="rev" dataKey="privateRev" name="Private/Semi-private" />
                  <Bar stackId="rev" dataKey="retailRev" name="Retail/Pop-up" />
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
            <div className="overflow-auto max-h-[460px]">
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

      <footer className="py-8 text-center text-xs text-gray-500">
        Private – noindex. You can also lock this with Cloudflare Access.
      </footer>
    </div>
  );
}
