import React from 'react';
import { Wind, Calendar, Clock, BarChart3, TrendingUp, Sliders, ShieldCheck, Database, RefreshCw } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  selectedDate,
  setSelectedDate,
  availableDates,
  gateClosureHour,
  setGateClosureHour,
  isSyncing,
  onSyncElexon,
  onOpenMethodology
}) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Info */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Wind className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-white">AeroProcure</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                  UK Day-Ahead Desk
                </span>
              </div>
              <p className="text-xs text-slate-400">Elexon BMRS National Wind Generation Intelligence</p>
            </div>
          </div>

          {/* Decision Timeline Controls (Date & Gate Closure) */}
          <div className="hidden md:flex items-center space-x-4 bg-slate-950/70 px-3 py-1.5 rounded-xl border border-slate-800">
            {/* Delivery Date */}
            <div className="flex items-center space-x-2 text-sm text-slate-300">
              <Calendar className="h-4 w-4 text-cyan-400" />
              <label htmlFor="delivery-date-select" className="text-xs text-slate-400 font-medium">Delivery:</label>
              <select
                id="delivery-date-select"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-900 text-cyan-300 text-xs font-semibold rounded-lg px-2.5 py-1 border border-slate-700 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {availableDates.map((d) => (
                  <option key={d} value={d}>
                    {d} {d === '2026-01-15' ? ' (Sample Day)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="h-4 w-[1px] bg-slate-800" />

            {/* Day-Ahead Gate Closure Cut-off */}
            <div className="flex items-center space-x-2 text-sm text-slate-300">
              <Clock className="h-4 w-4 text-amber-400" />
              <label htmlFor="gate-closure-select" className="text-xs text-slate-400 font-medium">Gate Cutoff (D-1):</label>
              <select
                id="gate-closure-select"
                value={gateClosureHour}
                onChange={(e) => setGateClosureHour(Number(e.target.value))}
                className="bg-slate-900 text-amber-300 text-xs font-semibold rounded-lg px-2.5 py-1 border border-slate-700 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value={9}>09:00 UTC (Early Cutoff)</option>
                <option value={10}>10:00 UTC (Pre-Auction)</option>
                <option value={11}>11:00 UTC (EPEX SPOT Auction)</option>
                <option value={12}>12:00 UTC (Nord Pool Auction)</option>
                <option value={14}>14:00 UTC (Post-Auction)</option>
              </select>
            </div>

            {/* Quick Live Sync */}
            <button
              onClick={onSyncElexon}
              disabled={isSyncing}
              title="Sync latest live records from Elexon BMRS API"
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-900 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>

          {/* Right Action */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenMethodology}
              className="flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition"
            >
              <Database className="h-3.5 w-3.5 text-cyan-400" />
              <span>Methodology & Elexon</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 overflow-x-auto py-2 border-t border-slate-800/80 text-sm font-medium">
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'daily'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span>Day-Ahead vs Outturn</span>
          </button>

          <button
            onClick={() => setActiveTab('evolution')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'evolution'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Lead-Time Forecast Evolution</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'analytics'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Quantitative Error Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('simulation')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'simulation'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sliders className="h-4 w-4" />
            <span>Thermal Hedging Simulator</span>
          </button>
        </div>

      </div>
    </header>
  );
}
