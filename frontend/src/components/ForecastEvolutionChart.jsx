import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Scatter
} from 'recharts';
import { fetchForecastEvolution } from '../services/api';
import { Clock, TrendingDown, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ForecastEvolutionChart({ deliveryDate }) {
  const [targetHour, setTargetHour] = useState(12);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchForecastEvolution(deliveryDate, targetHour)
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
  }, [deliveryDate, targetHour]);

  const targetHoursOptions = [
    { hour: 0, label: '00:00 (Overnight)' },
    { hour: 6, label: '06:00 (Morning Ramp)' },
    { hour: 12, label: '12:00 (Midday)' },
    { hour: 17, label: '17:00 (Evening Peak Demand)' },
    { hour: 21, label: '21:00 (Night)' }
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const pt = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg text-xs shadow-xl space-y-1">
          <div className="text-slate-400 font-mono">
            Lead Time: <span className="text-cyan-400 font-bold">{pt.leadTimeHours}h before delivery</span>
          </div>
          <div className="text-slate-300">
            Published: {pt.publishTime.replace('T', ' ').replace('Z', ' UTC')}
          </div>
          <div className="text-cyan-300 font-semibold">
            Forecast: {pt.forecastMW.toLocaleString()} MW
          </div>
          {pt.actualMW !== null && (
            <div className="text-emerald-400 font-semibold">
              Actual Outturn: {pt.actualMW.toLocaleString()} MW
            </div>
          )}
          {pt.errorMW !== null && (
            <div className={`font-mono ${pt.errorMW > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              Error: {pt.errorMW > 0 ? `+${pt.errorMW.toLocaleString()}` : pt.errorMW.toLocaleString()} MW
            </div>
          )}
          {pt.isDayAheadGate && (
            <div className="text-[10px] text-amber-300 font-semibold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800 mt-1">
              ★ Day-Ahead Auction Gate Window
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 mb-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-cyan-400" />
            <span>Forecast Evolution Across Lead Time</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            How the forecast for target delivery hour <span className="text-cyan-300 font-semibold">{targetHour}:00 UTC</span> converged across model publication runs.
          </p>
        </div>

        {/* Target Hour Selector */}
        <div className="flex items-center space-x-2">
          <label htmlFor="target-hour-select" className="text-xs text-slate-400">Target Delivery Hour:</label>
          <select
            id="target-hour-select"
            value={targetHour}
            onChange={(e) => setTargetHour(Number(e.target.value))}
            className="bg-slate-950 text-cyan-300 text-xs font-semibold rounded-lg px-3 py-1.5 border border-slate-700 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            {targetHoursOptions.map((opt) => (
              <option key={opt.hour} value={opt.hour}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
          Loading evolution runs...
        </div>
      ) : !data || !data.runs || data.runs.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
          No multi-run data available for this hour.
        </div>
      ) : (
        <div>
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400">Actual Outturn Generation</span>
              <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
                {data.actualGenerationMW ? `${data.actualGenerationMW.toLocaleString()} MW` : '-'}
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400">Initial D-2 Run</span>
              <div className="text-lg font-bold text-cyan-300 font-mono mt-0.5">
                {data.runs[0] ? `${data.runs[0].forecastMW.toLocaleString()} MW` : '-'}
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400">Day-Ahead Gate Forecast</span>
              <div className="text-lg font-bold text-amber-300 font-mono mt-0.5">
                {(() => {
                  const gateRun = data.runs.find((r) => r.isDayAheadGate) || data.runs[Math.min(5, data.runs.length - 1)];
                  return gateRun ? `${gateRun.forecastMW.toLocaleString()} MW` : '-';
                })()}
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400">Final Pre-Delivery Run</span>
              <div className="text-lg font-bold text-purple-300 font-mono mt-0.5">
                {data.runs[data.runs.length - 1] ? `${data.runs[data.runs.length - 1].forecastMW.toLocaleString()} MW` : '-'}
              </div>
            </div>
          </div>

          {/* Evolution Chart */}
          <div className="h-[320px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[...data.runs].reverse()} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="leadTimeHours"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  reversed={true} // Right = closer to delivery (0h)
                  unit="h lead"
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  unit=" MW"
                />
                <Tooltip content={<CustomTooltip />} />
                {data.actualGenerationMW && (
                  <ReferenceLine
                    y={data.actualGenerationMW}
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    label={{
                      value: `Actual: ${data.actualGenerationMW} MW`,
                      fill: '#10b981',
                      fontSize: 11,
                      position: 'top'
                    }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="forecastMW"
                  name="Forecast at Publication"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#38bdf8' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 px-2 border-t border-slate-800">
            <span>← Far ahead (48h lead-time)</span>
            <span className="text-amber-400 font-medium">★ D-1 Gate Closure (24h to 20h lead-time)</span>
            <span>Real-time delivery (0h lead-time) →</span>
          </div>
        </div>
      )}
    </div>
  );
}
