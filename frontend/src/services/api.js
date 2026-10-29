const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function fetchDates() {
  try {
    const res = await fetch(`${API_BASE}/dates`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch dates:', err);
    // Fallback January 2026 dates
    const dates = Array.from({ length: 31 }, (_, i) => `2026-01-${String(i + 1).padStart(2, '0')}`);
    return { dates, defaultDate: '2026-01-15' };
  }
}

export async function fetchForecastVsActual(date = '2026-01-15', gateClosure = 11, resolution = 'hourly') {
  const res = await fetch(`${API_BASE}/forecast-vs-actual?date=${date}&gate_closure=${gateClosure}&resolution=${resolution}`);
  if (!res.ok) throw new Error(`Failed to load forecast vs actual: ${res.statusText}`);
  return await res.json();
}

export async function fetchForecastEvolution(date = '2026-01-15', targetHour = 12) {
  const res = await fetch(`${API_BASE}/forecast-evolution?date=${date}&target_hour=${targetHour}`);
  if (!res.ok) throw new Error(`Failed to load forecast evolution: ${res.statusText}`);
  return await res.json();
}

export async function fetchMonthEvaluation(year = 2026, month = 1, gateClosure = 11) {
  const res = await fetch(`${API_BASE}/month-evaluation?year=${year}&month=${month}&gate_closure=${gateClosure}`);
  if (!res.ok) throw new Error(`Failed to load month evaluation: ${res.statusText}`);
  return await res.json();
}

export async function simulateProcurement(params) {
  const res = await fetch(`${API_BASE}/procurement-simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Simulation failed: ${res.statusText}`);
  return await res.json();
}

export async function triggerElexonSync(fromDate = '2026-01-01', toDate = '2026-01-05') {
  const res = await fetch(`${API_BASE}/sync-elexon`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fromDate, toDate }),
  });
  if (!res.ok) throw new Error(`Sync failed: ${res.statusText}`);
  return await res.json();
}
