# Part 1: Client Presentation & Pilot Pitch Script
**Target Audience:** UK Energy Utility Executive Leadership & Day-Ahead Power Procurement Trading Desk  
**Target Duration:** Maximum 5 Minutes (0:00 - 5:00 in your recording)  
**Tone:** Commercial, authoritative, value-focused, solutions-oriented.

---

### [0:00 - 0:45] Introduction & The Commercial Stakes
*(Visual: Open the AeroProcure platform home view showing January 2026 data on screen)*

> **Speaker:**  
> "Good morning, team. Today, I am excited to share the results of our pilot project designed specifically for your wholesale day-ahead power procurement desk.
> 
> As a UK energy utility serving retail and commercial demand, your trading desk faces a multi-million-pound challenge every single day before 11:00 AM:  
> **How much thermal baseload and flexible power must you buy in the wholesale Day-Ahead auction, versus how much demand will be covered by wind generation?**
> 
> In the UK market, if you trust an inaccurate wind forecast and under-procure thermal power, your position is left **short** in real-time. That shortfall is dumped into the Balancing Mechanism, where system buy cash-out penalties can spike up to £140/MWh or even thousands of pounds per MWh during winter peak demand.
> 
> To solve this, we built **AeroProcure UK**—a specialized platform connected directly to official Elexon BMRS datasets that does two critical things:
> 1. It cuts through forecast noise to reveal the **exact latest forecast available at your auction gate closure**, eliminating look-ahead distortion.
> 2. It **quantifies forecast error statistically**, translating uncertainty into an actionable, de-biased thermal hedging schedule."

---

### [0:45 - 2:00] Live Portal Walkthrough: The January 2026 Reality
*(Visual: Navigate to the "Day-Ahead vs Outturn" tab. Select Date: 2026-01-15, point to the Gate Closure selector at D-1 11:00 UTC, and hover over the chart)*

> **Speaker:**  
> "Let’s look at real market data from January 2026.  
> Right here on the navigation bar, notice the **Gate Cutoff filter**. When your desk submits Day-Ahead auction orders on Day D-1 at 11:00 AM, you cannot trade on forecasts published later that evening. AeroProcure strictly enforces this boundary.
> 
> Looking at January 15th, 2026:
> - The cyan line represents what the national wind forecast told your desk at 11:00 AM D-1: predicting **15,828 MW** of wind at midnight.
> - The emerald line shows the actual outturn generation from Elexon FUELHH: wind only delivered **14,456 MW**.
> - The red delta shows your exposure: a **1,371 MW shortfall** in that single hour alone!
> 
> If your desk traded naively on the raw point forecast, you would have entered the delivery day with a massive unhedged short position.
> 
> You can also toggle the purple dashed line, which reveals how the forecast was revised intraday. But for your Day-Ahead procurement commitments, those updates came too late. You need quantitative clarity upfront."

---

### [2:00 - 3:15] Quantitative Error Analytics & Key Findings
*(Visual: Click on the "Quantitative Error Analytics" tab. Point to the Quantile cards, Diurnal Profile chart, and Error Distribution Histogram)*

> **Speaker:**  
> "To prevent these trading losses, we analyzed all **744 hourly settlement periods** of January 2026. The findings are staggering:
> 
> 1. **Systemic Over-Forecast Bias:** Over the entire month of January 2026, national wind forecasts exhibited an average bias of **+1,840 MW**. The weather models consistently over-promised wind generation by nearly 2 gigawatts!
> 2. **Mean Absolute Error (MAE):** Stood at **2,123 MW** with a WAPE of **18.3%**.
> 3. **Quantile Risk Asymmetry:** Look at the error spectrum here:
>    - **P10:** -492 MW (occasional wind surpluses).
>    - **P50 (Median):** +1,638 MW over-forecast.
>    - **P90 Tail Risk:** In 10% of hours, wind generation was over-forecast by more than **+4,311 MW**!
> 
> Furthermore, looking at our **Diurnal Error Profile**, forecast errors consistently peaked during the crucial morning ramp (07:00-09:00 UTC) and the evening demand peak (17:00-19:00 UTC)—precisely when wholesale power prices and balancing cash-out penalties are highest."

---

### [3:15 - 4:30] The Solution: Day-Ahead Thermal Hedging Simulator
*(Visual: Click on the "Thermal Hedging Simulator" tab. Adjust Customer Demand slider to 2,500 MW, Wind Share to 10%, and switch between 'Naive' and 'Conservative P90' strategy)*

> **Speaker:**  
> "Now, how does your desk turn this analysis into daily profit and loss protection?  
> This is our **Day-Ahead Thermal Hedging Simulator**.
> 
> Here, a trader inputs:
> - Your utility’s customer demand commitment—say, 2,500 MW baseload.
> - Your contracted wind portfolio share—say, 10% of national capacity.
> 
> Under the **Naive Strategy**, the desk takes the wind forecast at face value. Look at the financial card: the desk incurs significant unhedged imbalance penalties.
> 
> But when we select the **Conservative (P90 Wind Buffer)** strategy:
> - The platform automatically applies the empirical P90 uncertainty deduction to the wind forecast.
> - It calculates the exact **Recommended Thermal Procurement (MWh)** schedule across every hour of Day D.
> - Notice the summary metric: on this day alone, applying this hedge buffer delivers an estimated **£42,000 to £110,000 in avoided short cash-out penalties**!
> 
> Over an entire winter quarter, this systematic de-biasing translates to **millions of pounds in risk capital saved**."

---

### [4:30 - 5:00] Conclusion & Next Steps
*(Visual: Return to the main dashboard or Methodology view)*

> **Speaker:**  
> "In summary: AeroProcure UK transforms wind uncertainty from an operational liability into a strategic advantage. It guarantees decision-time data integrity, provides automated statistical risk metrics, and gives your traders the confidence to size thermal purchases optimally.
> 
> The pilot is fully live, tested, and containerized. We are ready to integrate this into your desk’s daily workflow starting next week. Thank you, and I’d be delighted to take your questions."
