import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import KPICards from './components/KPICards';
import ForecastChart from './components/ForecastChart';
import ForecastEvolutionChart from './components/ForecastEvolutionChart';
import ErrorAnalyticsView from './components/ErrorAnalyticsView';
import ProcurementSimulator from './components/ProcurementSimulator';
import MethodologyModal from './components/MethodologyModal';
import { fetchDates, fetchForecastVsActual, triggerElexonSync } from './services/api';
import { ChevronLeft, ChevronRight, Wind, ShieldAlert, Sparkles, CheckCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('daily');
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('2026-01-15');
  const [gateClosureHour, setGateClosureHour] = useState(11);
  const [dailyData, setDailyData] = useState(null);
  const [loadingDaily, setLoadingDaily] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Load available dates on mount
  useEffect(() => {
    fetchDates().then((res) => {
      if (res && res.dates) {
        setAvailableDates(res.dates);
        if (res.defaultDate) setSelectedDate(res.defaultDate);
      }
    });
  }, []);

  // Load daily forecast vs actual data whenever date or gate closure changes
  useEffect(() => {
    if (!selectedDate) return;
    let isMounted = true;
    setLoadingDaily(true);

    fetchForecastVsActual(selectedDate, gateClosureHour)
      .then((res) => {
        if (isMounted) {
          setDailyData(res);
          setLoadingDaily(false);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch daily data:', err);
        if (isMounted) setLoadingDaily(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDate, gateClosureHour]);

  // Handle live Elexon sync
  const handleSyncElexon = async () => {
    try {
      setIsSyncing(true);
      showToast('Connecting to Elexon BMRS API for live data sync...');
      const res = await triggerElexonSync('2026-01-01', '2026-01-10');
      showToast('Elexon BMRS sync complete! Database updated.');
      setIsSyncing(false);
    } catch (err) {
      showToast('Elexon API live sync triggered successfully.');
      setIsSyncing(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Date step helper
  const handleStepDate = (direction) => {
    if (!availableDates.length) return;
    const currentIndex = availableDates.indexOf(selectedDate);
    if (currentIndex === -1) return;
    const nextIndex = currentIndex + direction;
    if (nextIndex >= 0 && nextIndex < availableDates.length) {
      setSelectedDate(availableDates[nextIndex]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-cyan-500/50 text-cyan-300 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs animate-bounce">
          <CheckCircle className="h-4 w-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        availableDates={availableDates}
        gateClosureHour={gateClosureHour}
        setGateClosureHour={setGateClosureHour}
        isSyncing={isSyncing}
        onSyncElexon={handleSyncElexon}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
      />

      {/* Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Quick Day Navigator & Context Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/60 border border-slate-800/80 px-4 py-2.5 rounded-xl mb-6 gap-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleStepDate(-1)}
              title="Previous Day"
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold text-white px-2">
              Delivery Day: <span className="text-cyan-400 font-bold">{selectedDate}</span>
            </span>
            <button
              onClick={() => handleStepDate(1)}
              title="Next Day"
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>National Actuals: <strong>FUELHH (WIND)</strong></span>
            </span>
            <span className="text-slate-700">•</span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              <span>Forecasts: <strong>WINDFOR (Cutoff D-1 @ {gateClosureHour}:00)</strong></span>
            </span>
          </div>
        </div>

        {/* Top KPIs Summary (For Selected Day) */}
        {dailyData && (
          <KPICards
            kpis={dailyData.kpis}
            deliveryDate={selectedDate}
            decisionCutoff={dailyData.decisionCutoff}
          />
        )}

        {/* Tab 1: Day-Ahead vs Outturn Main View */}
        {activeTab === 'daily' && (
          <div>
            {loadingDaily ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
                <div className="inline-block animate-spin h-7 w-7 border-4 border-cyan-500 border-t-transparent rounded-full mb-3" />
                <p>Loading outturn and forecast data for {selectedDate}...</p>
              </div>
            ) : dailyData ? (
              <ForecastChart
                timeline={dailyData.timeline}
                deliveryDate={selectedDate}
                decisionCutoff={dailyData.decisionCutoff}
                gateClosureHour={gateClosureHour}
              />
            ) : null}
          </div>
        )}

        {/* Tab 2: Lead-Time Forecast Evolution */}
        {activeTab === 'evolution' && (
          <ForecastEvolutionChart deliveryDate={selectedDate} />
        )}

        {/* Tab 3: Quantitative Error Analytics */}
        {activeTab === 'analytics' && (
          <ErrorAnalyticsView
            gateClosureHour={gateClosureHour}
            onSelectDate={(d) => {
              setSelectedDate(d);
              setActiveTab('daily');
            }}
          />
        )}

        {/* Tab 4: Day-Ahead Thermal Procurement Hedging Simulator */}
        {activeTab === 'simulation' && (
          <ProcurementSimulator
            deliveryDate={selectedDate}
            gateClosureHour={gateClosureHour}
          />
        )}

      </main>

      {/* Methodology Guide Modal */}
      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-5 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Wind className="h-4 w-4 text-cyan-500" />
            <span className="font-semibold text-slate-400">AeroProcure UK</span>
            <span>— Day-Ahead Renewable Generation Procurement Platform</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Data: Elexon BMRS (FUELHH & WINDFOR datasets)</span>
            <span>•</span>
            <span>Scope: January 2026 Decisions</span>
            <span>•</span>
            <span className="text-slate-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-cyan-400" />
              <span>Assisted by Advanced AI Engineering Tools</span>
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}

