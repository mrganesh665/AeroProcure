import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { Layers, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function ForecastChart({ timeline, deliveryDate, decisionCutoff, gateClosureHour }) {
  const [showDayAhead, setShowDayAhead] = useState(true);
  const [showActual, setShowActual] = useState(true);
  const [showIntraday, setShowIntraday] = useState(true);
  const [showErrorBars, setShowErrorBars] = useState(true);

  if (!timeline || timeline.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        No forecast or outturn data available for {deliveryDate}.
      </div>
    );
  }

  // Format decision cutoff timestamp for display
  const cutoffDisplay = decisionCutoff
    ? `${decisionCutoff.slice(0, 10)} @ ${decisionCutoff.slice(11, 16)} UTC`
    : `D-1 @ ${gateClosureHour}:00 UTC`;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-lg shadow-xl text-xs space-y-1.5 backdrop-blur z-50">
          <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1 flex justify-between gap-4">
            <span>Hour {data.hourLabel}</span>
            <span className="text-cyan-400">{data.settlementPeriodRange}</span>
          </div>

          <div className="flex justify-between gap-4 text-cyan-400">
            <span>Day-Ahead Forecast (Gate Cutoff):</span>
            <span className="font-mono font-bold">{data.dayAheadForecast ? `${data.dayAheadForecast.toLocaleString()} MW` : '-'}</span>
          </div>

          <div className="flex justify-between gap-4 text-emerald-400">
            <span>Actual Outturn Generation:</span>
            <span className="font-mono font-bold">{data.actualGeneration ? `${data.actualGeneration.toLocaleString()} MW` : '-'}</span>
          </div>

          {data.intradayForecast && (
            <div className="flex justify-between gap-4 text-purple-400">
              <span>Latest Intraday Forecast:</span>
              <span className="font-mono font-bold">{data.intradayForecast.toLocaleString()} MW</span>
            </div>
          )}

          {data.error !== null && (
            <div className="border-t border-slate-800 pt-1 mt-1 flex justify-between gap-4">
              <span className="text-slate-400">Forecast Error (FC - ACT):</span>
              <span className={`font-mono font-bold ${data.error > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {data.error > 0 ? `+${data.error.toLocaleString()}` : data.error.toLocaleString()} MW
                {data.percentError ? ` (${data.percentError}%)` : ''}
              </span>
            </div>
          )}

          <div className="text-[10px] text-slate-500 pt-0.5">
            Published: {data.dayAheadPublishTime ? data.dayAheadPublishTime.slice(11, 16) : '-'} UTC
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 mb-6 shadow-sm">
      {/* Chart Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Day-Ahead Forecast vs Actual Generation</span>
            <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {deliveryDate}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Day-Ahead decision gate cut-off: <span className="text-amber-400 font-semibold">{cutoffDisplay}</span>
            <span className="hidden sm:inline"> (Strictly excludes forecasts published after auction gate)</span>
          </p>
        </div>

        {/* Series Visibility Toggles */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <button
            onClick={() => setShowDayAhead(!showDayAhead)}
            className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition ${
              showDayAhead
                ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800'
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            <span>Day-Ahead Gate Forecast</span>
          </button>

          <button
            onClick={() => setShowActual(!showActual)}
            className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition ${
              showActual
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Actual Outturn</span>
          </button>

          <button
            onClick={() => setShowIntraday(!showIntraday)}
            className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition ${
              showIntraday
                ? 'bg-purple-950/60 text-purple-300 border-purple-800'
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-purple-400" />
            <span>Intraday Revisions</span>
          </button>

          <button
            onClick={() => setShowErrorBars(!showErrorBars)}
            className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition ${
              showErrorBars
                ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            <span>Error Delta</span>
          </button>
        </div>
      </div>

      {/* Main Chart */}
      <div className="h-[380px] w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={timeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="hourLabel"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              yAxisId="power"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              unit=" MW"
            />
            <YAxis
              yAxisId="error"
              orientation="right"
              stroke="#475569"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(v) => `${v > 0 ? '+' : ''}${(v / 1000).toFixed(1)}k`}
              domain={['auto', 'auto']}
              hide={!showErrorBars}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine yAxisId="error" y={0} stroke="#475569" strokeDasharray="2 2" />

            {/* Error Bars on secondary axis */}
            {showErrorBars && (
              <Bar
                yAxisId="error"
                dataKey="error"
                name="Forecast Error"
                fill="#f43f5e"
                opacity={0.35}
                radius={[2, 2, 0, 0]}
              />
            )}

            {/* Latest Intraday Line */}
            {showIntraday && (
              <Line
                yAxisId="power"
                type="monotone"
                dataKey="intradayForecast"
                name="Intraday Forecast"
                stroke="#c084fc"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            )}

            {/* Day-Ahead Gate Forecast Line */}
            {showDayAhead && (
              <Line
                yAxisId="power"
                type="monotone"
                dataKey="dayAheadForecast"
                name="Day-Ahead Forecast (Gate Cutoff)"
                stroke="#06b6d4"
                strokeWidth={3}
                dot={{ r: 3, fill: '#06b6d4' }}
                activeDot={{ r: 5 }}
              />
            )}

            {/* Actual Outturn Generation Line */}
            {showActual && (
              <Line
                yAxisId="power"
                type="monotone"
                dataKey="actualGeneration"
                name="Actual Wind Outturn"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 3, fill: '#10b981' }}
                activeDot={{ r: 5 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Hourly Data Table with Settlement Periods */}
      <div className="mt-6 border-t border-slate-800 pt-4">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Half-Hourly Settlement Period & Hourly Outturn Breakdown</span>
          <span className="text-[11px] text-slate-500 font-normal">All times UTC</span>
        </h3>
        <div className="overflow-x-auto max-h-56 overflow-y-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider sticky top-0 border-b border-slate-800">
              <tr>
                <th className="py-2 px-3">Hour (UTC)</th>
                <th className="py-2 px-3">Settlement Periods</th>
                <th className="py-2 px-3 text-right">Day-Ahead FC (MW)</th>
                <th className="py-2 px-3 text-right">Actual Gen (MW)</th>
                <th className="py-2 px-3 text-right">Error (MW)</th>
                <th className="py-2 px-3 text-right">Error %</th>
                <th className="py-2 px-3 text-center">Desk Exposure Position</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {timeline.map((row) => (
                <tr key={row.hour} className="hover:bg-slate-800/40 transition">
                  <td className="py-2 px-3 font-semibold text-slate-200">{row.hourLabel}</td>
                  <td className="py-2 px-3 text-slate-400">{row.settlementPeriodRange}</td>
                  <td className="py-2 px-3 text-right text-cyan-300">
                    {row.dayAheadForecast ? row.dayAheadForecast.toLocaleString() : '-'}
                  </td>
                  <td className="py-2 px-3 text-right text-emerald-300">
                    {row.actualGeneration ? row.actualGeneration.toLocaleString() : '-'}
                  </td>
                  <td className={`py-2 px-3 text-right font-bold ${
                    row.error > 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {row.error !== null ? (row.error > 0 ? `+${row.error.toLocaleString()}` : row.error.toLocaleString()) : '-'}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-400">
                    {row.percentError !== null ? `${row.percentError}%` : '-'}
                  </td>
                  <td className="py-2 px-3 text-center font-sans text-[11px]">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${
                      row.error > 0 
                        ? 'bg-rose-950/70 text-rose-300 border border-rose-800/50' 
                        : 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/50'
                    }`}>
                      {row.error > 0 ? 'Short (Thermal Deficit)' : 'Long (Surplus)'}
                    </span>
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
