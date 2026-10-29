import React from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, Zap, TrendingDown, Target } from 'lucide-react';

export default function KPICards({ kpis, deliveryDate, decisionCutoff }) {
  if (!kpis) return null;

  const isOverForecast = kpis.bias > 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      
      {/* MAE Card */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Mean Abs Error (MAE)</span>
          <Target className="h-4 w-4 text-cyan-400" />
        </div>
        <div className="mt-2 flex items-baseline space-x-1">
          <span className="text-2xl font-bold text-white tracking-tight">
            {kpis.mae.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400">MW</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">Average hourly divergence</p>
      </div>

      {/* RMSE Card */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Root Mean Sq (RMSE)</span>
          <AlertTriangle className="h-4 w-4 text-amber-400" />
        </div>
        <div className="mt-2 flex items-baseline space-x-1">
          <span className="text-2xl font-bold text-amber-300 tracking-tight">
            {kpis.rmse.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400">MW</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">Penalizes large tail misses</p>
      </div>

      {/* Mean Bias Card (Key Trading Alert) */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Forecast Bias (ME)</span>
          <ShieldAlert className={`h-4 w-4 ${isOverForecast ? 'text-rose-400' : 'text-emerald-400'}`} />
        </div>
        <div className="mt-2 flex items-baseline space-x-1.5">
          <span className={`text-2xl font-bold tracking-tight ${isOverForecast ? 'text-rose-400' : 'text-emerald-400'}`}>
            {kpis.bias > 0 ? `+${kpis.bias.toLocaleString()}` : kpis.bias.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400">MW</span>
        </div>
        <div className="mt-1">
          <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            isOverForecast 
              ? 'bg-rose-950/70 text-rose-300 border border-rose-800/60' 
              : 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60'
          }`}>
            {isOverForecast ? 'Over-forecast (Short Risk)' : 'Under-forecast (Long Surplus)'}
          </span>
        </div>
      </div>

      {/* WAPE & Reliability */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Forecast Accuracy</span>
          <CheckCircle className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="mt-2 flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold text-white tracking-tight">
            {kpis.reliabilityScore}%
          </span>
          <span className="text-xs text-slate-400">(WAPE {kpis.wape}%)</span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
          <div 
            className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
            style={{ width: `${kpis.reliabilityScore}%` }} 
          />
        </div>
      </div>

      {/* Peak Outturn Generation */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-sm relative overflow-hidden col-span-2 md:col-span-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Actual Wind Outturn</span>
          <Zap className="h-4 w-4 text-cyan-400" />
        </div>
        <div className="mt-2 flex items-baseline space-x-1">
          <span className="text-2xl font-bold text-cyan-400 tracking-tight">
            {kpis.peakActualMW ? kpis.peakActualMW.toLocaleString() : '-'}
          </span>
          <span className="text-xs text-slate-400">MW Peak</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Avg: <span className="text-slate-200 font-semibold">{kpis.avgActualMW ? kpis.avgActualMW.toLocaleString() : '-'} MW</span>
        </p>
      </div>

    </div>
  );
}

