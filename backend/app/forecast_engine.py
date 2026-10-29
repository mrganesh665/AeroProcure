"""
Core domain logic for Wind Generation Forecast Evaluation & Day-Ahead Procurement.
Complies with UK wholesale electricity market and Elexon BMRS standards.
"""
import math
import sqlite3
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from app.db_loader import get_db_connection

class ForecastEngine:
    def __init__(self, conn_getter=get_db_connection):
        self.get_conn = conn_getter

    def get_available_dates(self) -> List[str]:
        """Returns list of delivery dates available in database."""
        conn = self.get_conn()
        cursor = conn.cursor()
        cursor.execute("SELECT DISTINCT settlement_date FROM actual_generation WHERE settlement_date LIKE '2026-01%' ORDER BY settlement_date")
        dates = [row[0] for row in cursor.fetchall()]
        conn.close()
        return dates

    def get_day_ahead_forecast(
        self, 
        delivery_date: str, 
        gate_closure_hour: int = 11,
        resolution: str = "hourly"
    ) -> Dict[str, Any]:
        """
        Retrieves Day-Ahead forecast available at decision cut-off time (D-1 at gate_closure_hour)
        and matches with actual generation.
        """
        deliv_dt = datetime.strptime(delivery_date, "%Y-%m-%d")
        cutoff_dt = deliv_dt - timedelta(days=1) + timedelta(hours=gate_closure_hour)
        cutoff_iso = cutoff_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

        conn = self.get_conn()
        cursor = conn.cursor()

        # 1. Fetch Day-Ahead forecast: for each target startTime on delivery_date, get latest publishTime <= cutoff
        query_fc = """
        SELECT fg.start_time, fg.generation, fg.publish_time
        FROM forecast_generation fg
        INNER JOIN (
            SELECT start_time, MAX(publish_time) AS max_pub
            FROM forecast_generation
            WHERE publish_time <= ? AND start_time >= ? AND start_time < ?
            GROUP BY start_time
        ) latest ON fg.start_time = latest.start_time AND fg.publish_time = latest.max_pub
        ORDER BY fg.start_time
        """
        start_day_iso = f"{delivery_date}T00:00:00Z"
        end_day_iso = f"{(deliv_dt + timedelta(days=1)).strftime('%Y-%m-%d')}T00:00:00Z"
        
        cursor.execute(query_fc, (cutoff_iso, start_day_iso, end_day_iso))
        fc_rows = {row["start_time"]: {"generation": row["generation"], "publish_time": row["publish_time"]} for row in cursor.fetchall()}

        # 2. Fetch Latest Intraday forecast (latest available prior to each delivery period)
        query_intraday = """
        SELECT fg.start_time, fg.generation, fg.publish_time
        FROM forecast_generation fg
        INNER JOIN (
            SELECT start_time, MAX(publish_time) AS max_pub
            FROM forecast_generation
            WHERE start_time >= ? AND start_time < ?
            GROUP BY start_time
        ) latest ON fg.start_time = latest.start_time AND fg.publish_time = latest.max_pub
        ORDER BY fg.start_time
        """
        cursor.execute(query_intraday, (start_day_iso, end_day_iso))
        intraday_rows = {row["start_time"]: {"generation": row["generation"], "publish_time": row["publish_time"]} for row in cursor.fetchall()}

        # 3. Fetch Actual Generation (FUELHH)
        query_act = """
        SELECT start_time, settlement_period, generation, publish_time
        FROM actual_generation
        WHERE start_time >= ? AND start_time < ?
        ORDER BY start_time
        """
        cursor.execute(query_act, (start_day_iso, end_day_iso))
        act_rows = cursor.fetchall()
        conn.close()

        # Build hourly aggregated actuals
        hourly_actuals = {}
        for r in act_rows:
            hr_key = r["start_time"][:13] + ":00:00Z"
            hourly_actuals.setdefault(hr_key, []).append(r["generation"])
        
        hourly_act_avg = {k: sum(v)/len(v) for k, v in hourly_actuals.items()}

        # Combine time series
        timeline = []
        # Sorted unique hours
        hours = sorted(list(set(list(fc_rows.keys()) + list(hourly_act_avg.keys()))))
        
        abs_errors = []
        sq_errors = []
        raw_errors = []
        
        for hr in hours:
            fc_info = fc_rows.get(hr)
            intra_info = intraday_rows.get(hr)
            act_val = hourly_act_avg.get(hr)
            
            fc_val = fc_info["generation"] if fc_info else None
            intra_val = intra_info["generation"] if intra_info else None
            
            err = (fc_val - act_val) if (fc_val is not None and act_val is not None) else None
            if err is not None:
                abs_errors.append(abs(err))
                sq_errors.append(err ** 2)
                raw_errors.append(err)
            
            # Settlement period number for hour (1 to 48 -> Hour h corresponds to SP 2h+1 and 2h+2)
            hour_int = int(hr[11:13])
            sp_range = f"SP{hour_int * 2 + 1}-{hour_int * 2 + 2}"
            
            timeline.append({
                "time": hr,
                "hour": hour_int,
                "hourLabel": f"{hour_int:02d}:00",
                "settlementPeriodRange": sp_range,
                "dayAheadForecast": round(fc_val, 1) if fc_val is not None else None,
                "dayAheadPublishTime": fc_info["publish_time"] if fc_info else None,
                "intradayForecast": round(intra_val, 1) if intra_val is not None else None,
                "intradayPublishTime": intra_info["publish_time"] if intra_info else None,
                "actualGeneration": round(act_val, 1) if act_val is not None else None,
                "error": round(err, 1) if err is not None else None,
                "absError": round(abs(err), 1) if err is not None else None,
                "percentError": round((abs(err) / act_val * 100), 1) if (err is not None and act_val and act_val > 0) else None,
                "status": "Over-forecast (Short)" if err and err > 0 else ("Under-forecast (Long)" if err and err < 0 else "Balanced")
            })

        # Calculate daily KPIs
        n = len(abs_errors)
        mae = (sum(abs_errors) / n) if n > 0 else 0.0
        rmse = math.sqrt(sum(sq_errors) / n) if n > 0 else 0.0
        bias = (sum(raw_errors) / n) if n > 0 else 0.0
        tot_act = sum(hourly_act_avg.values()) if hourly_act_avg else 0
        wape = (sum(abs_errors) / tot_act * 100) if tot_act > 0 else 0.0
        
        # Reliability score: 100 - WAPE clamped to 0-100
        reliability_score = max(0.0, min(100.0, round(100.0 - wape, 1)))

        return {
            "deliveryDate": delivery_date,
            "decisionCutoff": cutoff_iso,
            "gateClosureHour": gate_closure_hour,
            "timeline": timeline,
            "kpis": {
                "mae": round(mae, 1),
                "rmse": round(rmse, 1),
                "bias": round(bias, 1),
                "wape": round(wape, 1),
                "reliabilityScore": reliability_score,
                "peakActualMW": round(max(hourly_act_avg.values()), 1) if hourly_act_avg else 0,
                "minActualMW": round(min(hourly_act_avg.values()), 1) if hourly_act_avg else 0,
                "avgActualMW": round(sum(hourly_act_avg.values())/len(hourly_act_avg), 1) if hourly_act_avg else 0,
                "dataPointsCount": n
            }
        }

    def get_month_evaluation(self, year: int = 2026, month: int = 1, gate_closure_hour: int = 11) -> Dict[str, Any]:
        """
        Evaluates the full month's forecast accuracy quantitatively.
        Computes MAE, RMSE, Bias, Quantiles, Diurnal Profile, and Daily Scorecard.
        """
        conn = self.get_conn()
        cursor = conn.cursor()

        # Get all days
        month_prefix = f"{year:04d}-{month:02d}"
        cursor.execute("SELECT DISTINCT settlement_date FROM actual_generation WHERE settlement_date LIKE ? ORDER BY settlement_date", (f"{month_prefix}%",))
        dates = [row[0] for row in cursor.fetchall()]
        conn.close()

        all_errors = []
        all_abs_errors = []
        all_sq_errors = []
        total_actual_mw = 0.0
        daily_scorecards = []
        hourly_diurnal_buckets = {h: {"errors": [], "abs_errors": [], "actuals": [], "forecasts": []} for h in range(24)}

        for d in dates:
            day_data = self.get_day_ahead_forecast(d, gate_closure_hour=gate_closure_hour)
            timeline = day_data["timeline"]
            kpis = day_data["kpis"]

            day_errs = [t["error"] for t in timeline if t["error"] is not None]
            all_errors.extend(day_errs)
            all_abs_errors.extend([t["absError"] for t in timeline if t["absError"] is not None])
            all_sq_errors.extend([t["error"]**2 for t in timeline if t["error"] is not None])
            
            for t in timeline:
                if t["actualGeneration"] is not None:
                    total_actual_mw += t["actualGeneration"]
                if t["hour"] in hourly_diurnal_buckets and t["error"] is not None:
                    hourly_diurnal_buckets[t["hour"]]["errors"].append(t["error"])
                    hourly_diurnal_buckets[t["hour"]]["abs_errors"].append(t["absError"])
                    hourly_diurnal_buckets[t["hour"]]["actuals"].append(t["actualGeneration"])
                    hourly_diurnal_buckets[t["hour"]]["forecasts"].append(t["dayAheadForecast"])

            daily_scorecards.append({
                "date": d,
                "mae": kpis["mae"],
                "rmse": kpis["rmse"],
                "bias": kpis["bias"],
                "wape": kpis["wape"],
                "avgActualMW": kpis["avgActualMW"],
                "reliabilityScore": kpis["reliabilityScore"]
            })

        n = len(all_errors)
        if n == 0:
            return {}

        sorted_errors = sorted(all_errors)
        p10 = sorted_errors[int(0.10 * (n - 1))]
        p25 = sorted_errors[int(0.25 * (n - 1))]
        p50 = sorted_errors[int(0.50 * (n - 1))] # median
        p75 = sorted_errors[int(0.75 * (n - 1))]
        p90 = sorted_errors[int(0.90 * (n - 1))]

        overall_mae = sum(all_abs_errors) / n
        overall_rmse = math.sqrt(sum(all_sq_errors) / n)
        overall_bias = sum(all_errors) / n
        overall_wape = (sum(all_abs_errors) / total_actual_mw * 100) if total_actual_mw > 0 else 0.0

        # Build Diurnal Profile (24 hours)
        diurnal_profile = []
        for h in range(24):
            b = hourly_diurnal_buckets[h]
            nb = len(b["errors"])
            h_mae = sum(b["abs_errors"]) / nb if nb > 0 else 0
            h_bias = sum(b["errors"]) / nb if nb > 0 else 0
            h_act = sum(b["actuals"]) / nb if nb > 0 else 0
            h_fc = sum(b["forecasts"]) / nb if nb > 0 else 0
            diurnal_profile.append({
                "hour": h,
                "hourLabel": f"{h:02d}:00",
                "mae": round(h_mae, 1),
                "bias": round(h_bias, 1),
                "avgActual": round(h_act, 1),
                "avgForecast": round(h_fc, 1),
                "biasDirection": "Over-forecast" if h_bias > 0 else "Under-forecast"
            })

        # Error distribution histogram (15 bins)
        min_err = min(sorted_errors)
        max_err = max(sorted_errors)
        num_bins = 15
        bin_width = (max_err - min_err) / num_bins if max_err != min_err else 1
        histogram = []
        for i in range(num_bins):
            bin_start = min_err + i * bin_width
            bin_end = bin_start + bin_width
            count = sum(1 for e in sorted_errors if (bin_start <= e < bin_end) or (i == num_bins - 1 and e == bin_end))
            histogram.append({
                "binLabel": f"{int(bin_start):,} to {int(bin_end):,}",
                "binCenter": round((bin_start + bin_end) / 2, 0),
                "count": count,
                "frequencyPct": round(count / n * 100, 1)
            })

        return {
            "period": f"{year:04d}-{month:02d}",
            "totalHoursAnalyzed": n,
            "overallKpis": {
                "mae": round(overall_mae, 1),
                "rmse": round(overall_rmse, 1),
                "bias": round(overall_bias, 1),
                "wape": round(overall_wape, 2),
                "reliabilityScore": max(0.0, min(100.0, round(100.0 - overall_wape, 1))),
                "quantiles": {
                    "p10": round(p10, 1),
                    "p25": round(p25, 1),
                    "p50": round(p50, 1),
                    "p75": round(p75, 1),
                    "p90": round(p90, 1),
                    "min": round(min_err, 1),
                    "max": round(max_err, 1)
                }
            },
            "diurnalProfile": diurnal_profile,
            "errorHistogram": histogram,
            "dailyScorecards": daily_scorecards
        }

    def simulate_procurement_hedging(
        self,
        delivery_date: str,
        customer_demand_mw: float = 2500.0,
        wind_portfolio_share_pct: float = 10.0,
        gate_closure_hour: int = 11,
        risk_strategy: str = "conservative_p90"
    ) -> Dict[str, Any]:
        """
        Interactive Day-Ahead Procurement & Thermal Hedging Decision Simulator.
        Helps procurement desks determine thermal power purchase schedules
        accounting for quantified wind forecast uncertainty.
        """
        # Fetch day-ahead data
        day_data = self.get_day_ahead_forecast(delivery_date, gate_closure_hour=gate_closure_hour)
        month_data = self.get_month_evaluation(2026, 1, gate_closure_hour=gate_closure_hour)
        
        quantiles = month_data["overallKpis"]["quantiles"]
        mean_bias = month_data["overallKpis"]["bias"]
        
        # Scale factor for utility wind portfolio: national generation * (wind_portfolio_share_pct / 100)
        scale = wind_portfolio_share_pct / 100.0
        
        timeline = day_data["timeline"]
        procurement_schedule = []

        total_demand_mwh = 0.0
        total_thermal_hedged_mwh = 0.0
        total_actual_wind_mwh = 0.0
        total_imbalance_mwh = 0.0
        unhedged_imbalance_mwh = 0.0

        for t in timeline:
            raw_fc_mw = (t["dayAheadForecast"] or 0.0) * scale
            act_wind_mw = (t["actualGeneration"] or 0.0) * scale

            # Demand in this hour
            demand_mw = customer_demand_mw

            # Adjustment buffer depending on risk strategy
            if risk_strategy == "conservative_p90":
                # Assume wind might be lower by P90 over-forecast amount
                # Over-forecast error = Forecast - Actual, so buffer = P90 over-forecast
                wind_deduction = max(0.0, raw_fc_mw - (quantiles["p90"] * scale))
            elif risk_strategy == "debiased_p50":
                # De-bias forecast using median/mean bias
                wind_deduction = max(0.0, raw_fc_mw - (mean_bias * scale))
            elif risk_strategy == "aggressive_p10":
                # Assume wind might be higher (P10)
                wind_deduction = max(0.0, raw_fc_mw - (quantiles["p10"] * scale))
            else: # "naive"
                wind_deduction = raw_fc_mw

            # Day-Ahead thermal procurement recommendation
            recommended_thermal_mw = max(0.0, demand_mw - wind_deduction)
            
            # Naive procurement (without buffer)
            naive_thermal_mw = max(0.0, demand_mw - raw_fc_mw)

            # Net position in real-time
            # Total generation = thermal procured + actual wind
            realtime_gen = recommended_thermal_mw + act_wind_mw
            imbalance_mw = realtime_gen - demand_mw # positive = long, negative = short

            naive_realtime_gen = naive_thermal_mw + act_wind_mw
            naive_imbalance_mw = naive_realtime_gen - demand_mw

            procurement_schedule.append({
                "hour": t["hour"],
                "hourLabel": t["hourLabel"],
                "customerDemandMW": round(demand_mw, 1),
                "portfolioWindForecastMW": round(raw_fc_mw, 1),
                "adjustedWindExpectationMW": round(wind_deduction, 1),
                "recommendedThermalProcurementMW": round(recommended_thermal_mw, 1),
                "naiveProcurementMW": round(naive_thermal_mw, 1),
                "portfolioActualWindMW": round(act_wind_mw, 1),
                "netImbalanceMW": round(imbalance_mw, 1),
                "naiveImbalanceMW": round(naive_imbalance_mw, 1)
            })

            total_demand_mwh += demand_mw
            total_thermal_hedged_mwh += recommended_thermal_mw
            total_actual_wind_mwh += act_wind_mw
            total_imbalance_mwh += abs(imbalance_mw)
            unhedged_imbalance_mwh += abs(naive_imbalance_mw)

        # Estimated financial impact (UK typical wholesale prices: £85/MWh Day-Ahead, £140/MWh Short Imbalance penalty)
        short_imbalance_avoided_mwh = max(0.0, unhedged_imbalance_mwh - total_imbalance_mwh)
        estimated_penalty_savings_gbp = short_imbalance_avoided_mwh * (140.0 - 85.0)

        return {
            "deliveryDate": delivery_date,
            "riskStrategy": risk_strategy,
            "windPortfolioSharePct": wind_portfolio_share_pct,
            "customerDemandMW": customer_demand_mw,
            "schedule": procurement_schedule,
            "summary": {
                "totalDemandMWh": round(total_demand_mwh, 1),
                "totalThermalProcuredMWh": round(total_thermal_hedged_mwh, 1),
                "totalActualWindMWh": round(total_actual_wind_mwh, 1),
                "hedgedTotalImbalanceMWh": round(total_imbalance_mwh, 1),
                "unhedgedTotalImbalanceMWh": round(unhedged_imbalance_mwh, 1),
                "imbalanceReductionPct": round((1.0 - total_imbalance_mwh / unhedged_imbalance_mwh) * 100, 1) if unhedged_imbalance_mwh > 0 else 0,
                "estimatedSavingsGBP": round(estimated_penalty_savings_gbp, 0)
            }
        }

    def get_forecast_evolution(self, delivery_date: str, target_hour: int = 12) -> Dict[str, Any]:
        """
        Retrieves the evolution of the forecast for a specific target hour
        across all forecast runs (from D-3 up to real-time).
        """
        target_iso = f"{delivery_date}T{target_hour:02d}:00:00Z"
        conn = self.get_conn()
        cursor = conn.cursor()

        # Get all forecasts for this start_time
        cursor.execute("""
        SELECT publish_time, generation
        FROM forecast_generation
        WHERE start_time = ?
        ORDER BY publish_time
        """, (target_iso,))
        fc_runs = cursor.fetchall()

        # Get actual for this hour
        cursor.execute("""
        SELECT generation FROM actual_generation
        WHERE start_time LIKE ?
        """, (f"{delivery_date}T{target_hour:02d}:%",))
        act_rows = cursor.fetchall()
        actual_val = sum(r["generation"] for r in act_rows) / len(act_rows) if act_rows else None

        conn.close()

        target_dt = datetime.strptime(target_iso, "%Y-%m-%dT%H:%M:%SZ")

        runs = []
        for r in fc_runs:
            pub_dt = datetime.strptime(r["publish_time"], "%Y-%m-%dT%H:%M:%SZ")
            lead_time_hours = round((target_dt - pub_dt).total_seconds() / 3600.0, 1)
            err = r["generation"] - actual_val if actual_val is not None else None
            runs.append({
                "publishTime": r["publish_time"],
                "leadTimeHours": lead_time_hours,
                "forecastMW": round(r["generation"], 1),
                "actualMW": round(actual_val, 1) if actual_val is not None else None,
                "errorMW": round(err, 1) if err is not None else None,
                "isDayAheadGate": 20 <= lead_time_hours <= 28 # standard gate closure window
            })

        return {
            "deliveryDate": delivery_date,
            "targetHour": target_hour,
            "targetTime": target_iso,
            "actualGenerationMW": round(actual_val, 1) if actual_val is not None else None,
            "runs": runs
        }

