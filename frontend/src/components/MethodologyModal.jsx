import React from 'react';
import { X, Database, CheckCircle2, AlertCircle, ExternalLink, BookOpen } from 'lucide-react';

export default function MethodologyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl space-y-5 text-slate-300 text-xs">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-cyan-950 rounded-lg border border-cyan-800 text-cyan-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">System Architecture & Methodology Guide</h2>
              <p className="text-[11px] text-slate-400">Elexon BMRS Data Governance, Day-Ahead Cut-off Rules & Statistical Formulations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Section 1: Elexon Datasets */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-cyan-400" />
            <span>1. Elexon BMRS Datasets (No Third-Party Data)</span>
          </h3>
          <p className="leading-relaxed">
            Per client requirements, this system ingests exclusively from official UK national electricity data published by Elexon Balancing Mechanism Reporting Service (BMRS):
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="font-semibold text-cyan-300 text-xs flex items-center justify-between">
                <span>Actuals: FUELHH / stream</span>
                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">30-min resolution</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Outturn generation by fuel type. We strictly filter <code className="text-cyan-400">fuelType = "WIND"</code> and extract <code className="text-cyan-400">startTime</code> and <code className="text-cyan-400">generation</code> (MW).
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="font-semibold text-purple-300 text-xs flex items-center justify-between">
                <span>Forecasts: WINDFOR / stream</span>
                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">Hourly resolution</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                National wind generation forecast published by NESO. Relevant fields: <code className="text-purple-400">publishTime</code> (forecast run timestamp), <code className="text-purple-400">startTime</code>, and <code className="text-purple-400">generation</code> (MW).
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Day-Ahead Gate Closure Mechanics */}
        <div className="space-y-2 border-t border-slate-800 pt-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            <span>2. Strict Day-Ahead Gate Closure Cut-off (Preventing Look-Ahead Bias)</span>
          </h3>
          <p className="leading-relaxed">
            In wholesale day-ahead auctions (such as EPEX SPOT and Nord Pool UK), bids must be submitted before Gate Closure (typically 11:00 or 12:00 UTC on Day D-1). A common pitfall in naive energy analytics is using forecasts published <em>after</em> the gate closure or during real-time delivery.
          </p>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div className="text-xs font-mono text-amber-300">
              Query Logic: SELECT * WHERE publish_time &lt;= (DeliveryDate - 1 day) @ 11:00 UTC
            </div>
            <p className="text-[11px] text-slate-400">
              Our data engine groups forecasts by target <code className="text-slate-300">startTime</code> and selects the record with <code className="text-slate-300">MAX(publish_time)</code> that was published strictly on or before the cut-off timestamp. This guarantees 100% faithful replication of the information set available to the trading desk.
            </p>
          </div>
        </div>

        {/* Section 3: Quantitative Error Evaluation Metrics */}
        <div className="space-y-2 border-t border-slate-800 pt-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>3. Quantitative Error Evaluation Formulations</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="font-semibold text-white">Mean Absolute Error (MAE):</span>
              <div className="font-mono text-cyan-300 mt-0.5">MAE = (1/N) * Σ |Forecast_t - Actual_t|</div>
              <p className="text-slate-500 mt-1">Measures the expected average magnitude of volumetric error in MW.</p>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="font-semibold text-white">Root Mean Squared Error (RMSE):</span>
              <div className="font-mono text-amber-300 mt-0.5">RMSE = sqrt((1/N) * Σ (Forecast_t - Actual_t)²)</div>
              <p className="text-slate-500 mt-1">Heavily penalizes extreme forecast misses during sudden storm fronts.</p>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="font-semibold text-white">Systemic Forecast Bias (ME):</span>
              <div className="font-mono text-rose-300 mt-0.5">ME = (1/N) * Σ (Forecast_t - Actual_t)</div>
              <p className="text-slate-500 mt-1">Positive bias (+1,840 MW in Jan 2026) indicates chronic over-forecasting.</p>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="font-semibold text-white">Weighted Abs Percentage Error (WAPE):</span>
              <div className="font-mono text-emerald-300 mt-0.5">WAPE = (Σ |Error| / Σ Actual) * 100%</div>
              <p className="text-slate-500 mt-1">Scale-independent error benchmark (avoids division by zero in calm hours).</p>
            </div>
          </div>
        </div>

        {/* Section 4: Quantile Buffer Sizing */}
        <div className="space-y-2 border-t border-slate-800 pt-3">
          <h3 className="text-sm font-semibold text-white">4. Thermal Hedging & Cash-out Risk Reduction</h3>
          <p className="leading-relaxed">
            When a utility relies on an over-forecasted wind figure, it under-buys in the Day-Ahead auction and incurs high real-time cash-out prices (System Buy Price). By sizing a thermal procurement buffer using empirical error quantiles (e.g. P90 = +4,311 MW buffer), trading desks convert uncontrolled balancing risk into low-cost wholesale hedge certainty.
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 pt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition"
          >
            Close Methodology Guide
          </button>
        </div>

      </div>
    </div>
  );
}
