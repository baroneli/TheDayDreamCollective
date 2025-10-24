import React, { useMemo } from "react";

export default function PriceMatrix({ rows, setRows }) {
  const totals = useMemo(() => {
    const byType = { Mat: { total:0, uses:0 }, Reformer: { total:0, uses:0 } };
    rows.forEach(r => {
      const uses = Number(r.uses||0);
      const price = Number(r.price||0);
      if (r.type in byType && uses>0) {
        byType[r.type].total += price;
        byType[r.type].uses  += uses;
      }
    });
    const matAvg = byType.Mat.uses>0 ? byType.Mat.total/byType.Mat.uses : 0;
    const refAvg = byType.Reformer.uses>0 ? byType.Reformer.total/byType.Reformer.uses : 0;
    return { matAvg, refAvg };
  }, [rows]);

  const update = (id, key, val) => {
    setRows(rows.map(r => r.id===id ? {...r, [key]: val} : r));
  };

  return (
    <div className="overflow-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2 px-2">Class Type</th>
            <th className="py-2 px-2">Option</th>
            <th className="py-2 px-2">Price ($)</th>
            <th className="py-2 px-2">Assumed Uses</th>
            <th className="py-2 px-2">Effective $/Class</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const eff = Number(r.uses||0)>0 ? (Number(r.price||0)/Number(r.uses||0)) : Number(r.price||0);
            return (
              <tr key={r.id} className="border-b last:border-0">
                <td className="py-2 px-2">{r.type}</td>
                <td className="py-2 px-2">{r.option}</td>
                <td className="py-2 px-2">
                  <input type="number" inputMode="decimal" className="w-28 rounded-md border px-2 py-1"
                         value={r.price} onChange={(e)=>update(r.id,'price', Number(e.target.value))} />
                </td>
                <td className="py-2 px-2">
                  <input type="number" className="w-20 rounded-md border px-2 py-1"
                         value={r.uses} onChange={(e)=>update(r.id,'uses', Number(e.target.value))} />
                </td>
                <td className="py-2 px-2">${isFinite(eff)? eff.toFixed(2): '0.00'}</td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="font-semibold">
            <td className="py-2 px-2" colSpan={4}>Avg Effective $/Class (Mat)</td>
            <td className="py-2 px-2">${isFinite(totals.matAvg)? totals.matAvg.toFixed(2): '0.00'}</td>
          </tr>
          <tr className="font-semibold">
            <td className="py-2 px-2" colSpan={4}>Avg Effective $/Class (Reformer)</td>
            <td className="py-2 px-2">${isFinite(totals.refAvg)? totals.refAvg.toFixed(2): '0.00'}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
