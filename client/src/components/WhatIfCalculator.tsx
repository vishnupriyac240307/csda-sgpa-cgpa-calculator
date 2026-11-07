import { useMemo, useState } from "react";
import { CURRICULUM } from "../data/curriculum";
import { calculateCGPA } from "../utils/calculation";

type MarksMap = Record<number, Record<string, number>>;
export default function WhatIfCalculator({ actualMarks }: { actualMarks: MarksMap }) {
  const [expected, setExpected] = useState<Record<string, string>>({});
  const projected = useMemo(() => {
    const merged: MarksMap = Object.fromEntries(Object.entries(actualMarks).map(([k,v]) => [Number(k), {...v}]));
    for (const s of CURRICULUM) {
      const value = expected[s.id];
      if (value !== undefined && value.trim() !== "" && Number.isFinite(Number(value)) &&
          Number(value) >= 0 && Number(value) <= s.maxMarks) {
        merged[s.semester] = {...(merged[s.semester] || {}), [s.id]: Number(value)};
      }
    }
    return calculateCGPA(CURRICULUM, merged);
  }, [actualMarks, expected]);
  const remaining = CURRICULUM.filter(s => s.includedInCGPA && actualMarks[s.semester]?.[s.id] === undefined);
  return <section className="panel">
    <div className="panel-heading"><div><h2>What-if CGPA calculator</h2><p>Try expected marks without changing your saved academic records.</p></div><button className="btn btn-ghost btn-sm" onClick={() => setExpected({})}>Reset estimates</button></div>
    {!CURRICULUM.length ? <p className="muted-copy">Configure the official curriculum first to use projections.</p> : <>
      {remaining.length === 0 ? <p className="muted-copy">There are no remaining CGPA-eligible subjects to estimate.</p> : <div className="whatif-grid">{remaining.map(s=><label key={s.id}>{s.name}<small>Semester {s.semester} · max {s.maxMarks}</small><input type="number" min="0" max={s.maxMarks} step={s.allowDecimalMarks?"any":"1"} placeholder="Expected marks" value={expected[s.id]||""} onChange={e=>setExpected(v=>({...v,[s.id]:e.target.value}))}/></label>)}</div>}
      <div className="whatif-result"><span>Projected CGPA estimate</span><strong>{projected.cgpa===null?"—":projected.cgpa.toFixed(2)}</strong><small>Estimate only · actual saved marks are unchanged</small></div>
    </>}
  </section>;
}
