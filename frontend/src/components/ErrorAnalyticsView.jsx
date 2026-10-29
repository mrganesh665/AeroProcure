import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell
} from 'recharts';
import { fetchMonthEvaluation } from '../services/api';
import { BarChart3, TrendingUp, AlertTriangle, ShieldCheck, Calendar, ArrowUpDown } from 'lucide-react';

export default function ErrorAnalyticsView({ onSelectDate, gateClosureHour }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState('date');
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchMonthEvaluation(2026, 1, gateClosureHour)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [gateClosureHour]);

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
        <div className="inline-block animate-spin h-8 w-8 border-4 border-cyan-500 border-t-transparent rounded-full mb-3" />
        <p>Calculating full-month January 2026 error analytics & quantiles...</p>
      </div>
    );
  }

  if (!data || !data.overallKpis) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        Failed to load January 2026 evaluation metrics.
      </div>
    );
  }

  const { overallKpis, diurnalProfile, errorHistogram, dailyScorecards } = data;
  const q = overallKpis.quantiles;

  // Sorting scorecards
  const sortedScorecards = [...dailyScorecards].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (typeof valA === 'string') {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortAsc ? valA - valB : valB - valA;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default descending for metrics
    }
  };

  return (
    <div className="space-y-6">

      {/* Month Overview Hero */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-cyan-400" />
              <span>January 2026 National Wind Forecast Accuracy Evaluation</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive statistical evaluation across all <span className="text-cyan-300 font-semibold">{data.totalHoursAnalyzed} settlement hours</span> (Gate Closure D-1 @ {gateClosureHour}:00 UTC).
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 self-start md:self-auto">
            UK National Grid BMRS Data
          </span>
        </div>

        {/* Quantiles Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-4">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 uppercase">Mean Abs Error</span>
            <div className="text-xl font-bold text-cyan-400 font-mono mt-0.5">{overallKpis.mae.toLocaleString()} MW</div>
            <span className="text-[10px] text-slate-500">WAPE {overallKpis.wape}%</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 uppercase">RMSE</span>
            <div className="text-xl font-bold text-amber-300 font-mono mt-0.5">{overallKpis.rmse.toLocaleString()} MW</div>
            <span className="text-[10px] text-slate-500">Peak Penalty</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 uppercase">Systemic Bias</span>
            <div className="text-xl font-bold text-rose-400 font-mono mt-0.5">+{overallKpis.bias.toLocaleString()} MW</div>
            <span className="text-[10px] text-rose-400 font-semibold">Over-forecast</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 uppercase">P10 Error (Long)</span>
            <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">{q.p10.toLocaleString()} MW</div>
            <span className="text-[10px] text-slate-500">Under-forecast</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 uppercase">P50 Error (Median)</span>
            <div className="text-xl font-bold text-amber-300 font-mono mt-0.5">+{q.p50.toLocaleString()} MW</div>
            <span className="text-[10px] text-slate-500">Central Bias</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 uppercase">P90 Error (Short)</span>
            <div className="text-xl font-bold text-rose-400 font-mono mt-0.5">+{q.p90.toLocaleString()} MW</div>
            <span className="text-[10px] text-slate-500">Tail Short Risk</span>
          </div>
        </div>

        {/* Quantile Fan Visualizer */}
        <div className="mt-4 p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs">
          <div className="flex justify-between items-center text-slate-300 mb-2">
            <span className="font-semibold text-slate-200">Wind Forecast Error Quantile Spectrum</span>
            <span className="text-slate-400 font-mono text-[11px]">Range: {q.min} MW to +{q.max} MW</span>
          </div>
          <div className="relative h-6 bg-slate-800 rounded-full overflow-hidden flex">
            {/* Under-forecast zone (P10) */}
            <div style={{ width: '25%' }} className="bg-emerald-600/80 flex items-center justify-center text-[10px] font-bold text-white" title="P10 Under-forecast">
              P10 ({q.p10} MW)
            </div>
            {/* Median zone (P50) */}
            <div style={{ width: '45%' }} className="bg-amber-600/80 flex items-center justify-center text-[10px] font-bold text-white" title="P50 Median Over-forecast">
              P50 (+{q.p50} MW)
            </div>
            {/* Severe Over-forecast zone (P90) */}
            <div style={{ width: '30%' }} className="bg-rose-600/90 flex items-center justify-center text-[10px] font-bold text-white" title="P90 High Deficit Risk">
              P90 (+{q.p90} MW)
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            💡 <strong className="text-slate-200">Trader Takeaway:</strong> In 90% of hours in Jan 2026, the wind forecast over-predicted generation by up to <span className="text-rose-400 font-bold">{q.p90.toLocaleString()} MW</span>. Sizing thermal procurement with a P90 buffer completely eliminates unexpected balancing cash-out fines.
          </p>
        </div>
      </div>

      {/* Diurnal Error Profile & Histogram Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Diurnal Error Profile Chart */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
            <span>Diurnal Error Profile (Hour-of-Day)</span>
          </h3>
          <p className="text-xs text-slate-400 mb-3">
            Average forecast bias (MW) across the 24 hours of the day. Notice spikes during morning and evening peak demand.
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={diurnalProfile} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="hourLabel" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit=" MW" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg text-xs shadow-xl space-y-1">
                          <div className="font-semibold text-slate-200">{d.hourLabel} UTC</div>
                          <div className="text-rose-400">Avg Bias: +{d.bias} MW</div>
                          <div className="text-cyan-400">Avg MAE: {d.mae} MW</div>
                          <div className="text-slate-400">Avg Outturn: {d.avgActual} MW</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={0} stroke="#475569" />
                <Bar dataKey="bias" name="Mean Bias (MW)" fill="#f43f5e" radius={[2, 2, 0, 0]}>
                  {diurnalProfile.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.bias > 1800 ? '#f43f5e' : '#fb7185'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Error Distribution Histogram */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
            <span>Forecast Error Distribution Histogram</span>
          </h3>
          <p className="text-xs text-slate-400 mb-3">
            Frequency of hourly errors (Forecast - Actual). Note significant positive skew (over-forecast bias).
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={errorHistogram} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="binCenter" stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit=" hrs" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg text-xs shadow-xl space-y-1">
                          <div className="font-semibold text-slate-200">Error Bin: {d.binLabel} MW</div>
                          <div className="text-cyan-400">Count: {d.count} hours ({d.frequencyPct}%)</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine x={0} stroke="#38bdf8" strokeDasharray="2 2" />
                <Bar dataKey="count" name="Hours Count" fill="#0284c7" radius={[2, 2, 0, 0]}>
                  {errorHistogram.map((entry, index) => (
                    <Cell key={`hist-${index}`} fill={entry.binCenter > 0 ? '#38bdf8' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Daily Scorecard Table for all 31 Days of January 2026 */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-cyan-400" />
              <span>January 2026 Daily Trading Performance Scorecards</span>
            </h3>
            <p className="text-xs text-slate-400">Click any day to drill into that day's hourly outturn chart.</p>
          </div>
        </div>

        <div className="overflow-x-auto mt-3 max-h-72 overflow-y-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider sticky top-0 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 cursor-pointer hover:text-white" onClick={() => handleSort('date')}>
                  <div className="flex items-center gap-1">
                    <span>Date</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('mae')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>MAE (MW)</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('rmse')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>RMSE (MW)</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('bias')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Mean Bias (MW)</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('wape')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>WAPE (%)</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('reliabilityScore')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Accuracy Score</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {sortedScorecards.map((row) => (
                <tr key={row.date} className="hover:bg-slate-800/40 transition">
                  <td className="py-2 px-3 font-semibold text-slate-200">{row.date}</td>
                  <td className="py-2 px-3 text-right text-cyan-300">{row.mae.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right text-amber-300">{row.rmse.toLocaleString()}</td>
                  <td className={`py-2 px-3 text-right font-bold ${row.bias > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {row.bias > 0 ? `+${row.bias.toLocaleString()}` : row.bias.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-400">{row.wape}%</td>
                  <td className="py-2 px-3 text-right">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      row.reliabilityScore >= 85
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : row.reliabilityScore >= 70
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}>
                      {row.reliabilityScore}%
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      onClick={() => onSelectDate(row.date)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 text-[11px] transition"
                    >
                      Inspect Day
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
