import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { simulateProcurement } from '../services/api';
import { Sliders, Flame, ShieldAlert, DollarSign, Zap, ArrowRight, Info } from 'lucide-react';

export default function ProcurementSimulator({ deliveryDate, gateClosureHour }) {
  const [demandMW, setDemandMW] = useState(2500);
  const [windSharePct, setWindSharePct] = useState(10);
  const [riskStrategy, setRiskStrategy] = useState('conservative_p90');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    simulateProcurement({
      deliveryDate,
      customerDemandMW: Number(demandMW),
      windPortfolioSharePct: Number(windSharePct),
      gateClosureHour,
      riskStrategy
    })
      .then((res) => {
        if (isMounted) {
          setResult(res);
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
  }, [deliveryDate, demandMW, windSharePct, riskStrategy, gateClosureHour]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg text-xs shadow-xl space-y-1 font-sans">
          <div className="font-bold text-slate-200 border-b border-slate-800 pb-1">
            Hour {d.hourLabel} UTC
          </div>
          <div className="text-slate-300">Customer Demand: <span className="font-mono font-bold text-white">{d.customerDemandMW} MW</span></div>
          <div className="text-amber-400">Recommended Thermal Buy: <span className="font-mono font-bold">{d.recommendedThermalProcurementMW} MW</span></div>
          <div className="text-cyan-400">Expected Wind Contribution: <span className="font-mono font-bold">{d.adjustedWindExpectationMW} MW</span></div>
          <div className="text-emerald-400">Actual Wind Outturn: <span className="font-mono font-bold">{d.portfolioActualWindMW} MW</span></div>
          <div className="border-t border-slate-800 pt-1 text-slate-400">
            Net Imbalance: <span className={`font-mono font-bold ${d.netImbalanceMW >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {d.netImbalanceMW > 0 ? `+${d.netImbalanceMW}` : d.netImbalanceMW} MW
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">

      {/* Control Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Flame className="h-5 w-5 text-amber-500" />
              <span>Day-Ahead Thermal Power Procurement Decision Simulator</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Determine how much thermal generation to purchase on Day D-1 to cover consumer demand, accounting for quantified wind forecast uncertainty.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-950 text-amber-400 border border-amber-800 self-start md:self-auto">
            Hedge Sizing Engine
          </span>
        </div>

        {/* Sliders & Strategy Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          
          {/* Customer Demand Slider */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label htmlFor="customer-demand-slider" className="font-semibold text-slate-300">Customer Electricity Demand</label>
              <span className="font-mono font-bold text-cyan-400 text-sm">{demandMW.toLocaleString()} MW</span>
            </div>
            <input
              id="customer-demand-slider"
              type="range"
              min={500}
              max={8000}
              step={100}
              value={demandMW}
              onChange={(e) => setDemandMW(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>500 MW</span>
              <span>4,000 MW</span>
              <span>8,000 MW</span>
            </div>
          </div>

          {/* Wind Portfolio Share Slider */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label htmlFor="wind-share-slider" className="font-semibold text-slate-300">Utility Wind Capacity Share</label>
              <span className="font-mono font-bold text-emerald-400 text-sm">{windSharePct}%</span>
            </div>
            <input
              id="wind-share-slider"
              type="range"
              min={1}
              max={30}
              step={1}
              value={windSharePct}
              onChange={(e) => setWindSharePct(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>1% (Regional)</span>
              <span>10% (Mid-tier)</span>
              <span>30% (Major Big 6)</span>
            </div>
          </div>

          {/* Risk Hedging Strategy */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <label htmlFor="risk-hedging-select" className="text-xs font-semibold text-slate-300 block">Risk Tolerance & Buffer Sizing</label>
            <select
              id="risk-hedging-select"
              value={riskStrategy}
              onChange={(e) => setRiskStrategy(e.target.value)}
              className="w-full bg-slate-900 text-amber-300 text-xs font-bold rounded-lg p-2.5 border border-slate-700 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="conservative_p90">🛡️ Conservative (P90 Wind Buffer - Risk Averse)</option>
              <option value="debiased_p50">⚖️ Balanced (P50 Mean De-biased - Cost Minimizing)</option>
              <option value="aggressive_p10">⚡ Aggressive (P10 Upper Wind - Low Thermal Upfront)</option>
              <option value="naive">⚠️ Naive Forecast (No Safety Buffer)</option>
            </select>
            <p className="text-[10px] text-slate-400">
              {riskStrategy === 'conservative_p90' && 'Protects desk against severe wind deficits. Procures adequate thermal to avoid cash-out fines.'}
              {riskStrategy === 'debiased_p50' && 'Corrects for the average +1,840 MW national wind over-forecast bias.'}
              {riskStrategy === 'aggressive_p10' && 'Assumes strong wind outturn, purchases minimal thermal.'}
              {riskStrategy === 'naive' && 'Blindly trusts point forecast without adjusting for error.'}
            </p>
          </div>

        </div>
      </div>

      {/* Simulator Results & Chart */}
      {result && result.summary && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          
          {/* Financial & Volume Impact Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">Total Customer Demand</span>
              <div className="text-xl font-bold text-white font-mono mt-1">
                {result.summary.totalDemandMWh.toLocaleString()} MWh
              </div>
              <span className="text-[10px] text-slate-500">24-hour delivery target</span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">Thermal Energy Procured</span>
              <div className="text-xl font-bold text-amber-400 font-mono mt-1">
                {result.summary.totalThermalProcuredMWh.toLocaleString()} MWh
              </div>
              <span className="text-[10px] text-slate-500">Day-Ahead wholesale contract</span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">Actual Wind Outturn</span>
              <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
                {result.summary.totalActualWindMWh.toLocaleString()} MWh
              </div>
              <span className="text-[10px] text-slate-500">Zero-carbon generation delivered</span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">Avoided Penalty Value</span>
              <div className="text-xl font-bold text-cyan-400 font-mono mt-1">
                £{result.summary.estimatedSavingsGBP.toLocaleString()}
              </div>
              <span className="text-[10px] text-cyan-400">vs unhedged cash-out exposure</span>
            </div>
          </div>

          {/* Interactive Stacked Procurement Chart */}
          <div className="pt-2">
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center justify-between">
              <span>Day-Ahead Procurement Stack vs Realized Demand Coverage ({deliveryDate})</span>
              <span className="text-xs font-normal text-slate-400">Resolution: Hourly (SP 1-48)</span>
            </h3>
            
            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={result.schedule} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="hourLabel" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit=" MW" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

                  {/* Customer Demand Target Line */}
                  <Line
                    type="stepAfter"
                    dataKey="customerDemandMW"
                    name="Customer Demand (MW)"
                    stroke="#f8fafc"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />

                  {/* Thermal Procurement Recommendation */}
                  <Area
                    type="monotone"
                    dataKey="recommendedThermalProcurementMW"
                    name="Thermal Procurement (Day-Ahead Buy)"
                    fill="#f59e0b"
                    fillOpacity={0.4}
                    stroke="#f59e0b"
                    strokeWidth={2}
                  />

                  {/* Portfolio Wind Actual Outturn */}
                  <Line
                    type="monotone"
                    dataKey="portfolioActualWindMW"
                    name="Delivered Wind Outturn (MW)"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 2 }}
                  />

                  {/* Raw Wind Forecast for Reference */}
                  <Line
                    type="monotone"
                    dataKey="portfolioWindForecastMW"
                    name="Raw Point Wind Forecast"
                    stroke="#38bdf8"
                    strokeWidth={1.5}
                    strokeDasharray="2 2"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Strategy Recommendation Note */}
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
            <Info className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Procurement Desk Strategy Note:</strong> When operating in the UK Day-Ahead wholesale market, submitting orders based on the raw point forecast leaves the desk exposed to an average +1,840 MW national wind shortfall in January 2026. By applying the{' '}
              <span className="text-amber-400 font-semibold">{riskStrategy.replace('_', ' ').toUpperCase()}</span> buffer, the utility successfully pre-procures required thermal baseload at competitive day-ahead rates (~£85/MWh) rather than being penalized in the real-time Balancing Mechanism (~£140/MWh).
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
