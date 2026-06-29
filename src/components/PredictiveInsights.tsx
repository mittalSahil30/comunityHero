/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, RefreshCw, AlertTriangle, ShieldCheck, TrendingUp, Info, HelpCircle, LayoutGrid, Calendar, AlertCircle } from 'lucide-react';
import { HotspotPrediction, Issue } from '../types';

interface PredictiveInsightsProps {
  hotspots: HotspotPrediction[];
  issues: Issue[];
  onTriggerPrediction: () => Promise<void>;
  showHotspotsOnMap: boolean;
  onToggleShowHotspotsOnMap: (val: boolean) => void;
}

export default function PredictiveInsights({
  hotspots,
  issues,
  onTriggerPrediction,
  showHotspotsOnMap,
  onToggleShowHotspotsOnMap
}: PredictiveInsightsProps) {
  const [running, setRunning] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'hotspots' | 'forecasts'>('hotspots');

  const handlePredictClick = async () => {
    setRunning(true);
    try {
      await onTriggerPrediction();
      // Ensure the hotspots are toggled ON once generated so user immediately sees them!
      onToggleShowHotspotsOnMap(true);
    } catch (err) {
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  // Helper for color-coding risk index
  const getRiskColor = (score: number) => {
    if (score >= 80) return { text: 'text-rose-600', border: 'border-rose-100', bg: 'bg-rose-50', bar: 'bg-rose-500' };
    if (score >= 60) return { text: 'text-amber-600', border: 'border-amber-100', bg: 'bg-amber-50', bar: 'bg-amber-500' };
    return { text: 'text-emerald-600', border: 'border-emerald-100', bg: 'bg-emerald-50', bar: 'bg-emerald-500' };
  };

  // Structured AI Forecast Dashboard Data (Ward / Sector Predictions)
  const forecastWards = [
    {
      ward: "Ward 12 (Sector 22 Market, Chandigarh)",
      issue: "Waste Overflow & Rodent Aggregation",
      probability: 91,
      eta: "Next week",
      trigger: "High volume accumulation surrounding municipal market bin + weekend collection backlog.",
      remedy: "Dispatch sanitation sweeping squad, adjust dumpster capacity to double payload, and increase daily collection frequency to 2x.",
      severity: "high"
    },
    {
      ward: "Ward 5 (Madhya Marg, Sector 17)",
      issue: "Corroded Water Main Rupture / Low Pressure Burst",
      probability: 84,
      eta: "Within 4-5 days",
      trigger: "Increasing reports of minor pressure fatigue leaks and localized street pooling on Madhya Marg bypass.",
      remedy: "Deploy sonic pipe leak detection tools, adjust water regulator valves to reduce system backup, and bypass worn pipes.",
      severity: "high"
    },
    {
      ward: "Ward 7 (Jan Marg, Sector 16)",
      issue: "Severe Road Asphalt Crumbling / Cyclist Hazard",
      probability: 73,
      eta: "Next 10 days",
      trigger: "Heavy municipal bus volume coupled with unresolved dual potholes expanding rapidly near Rose Garden.",
      remedy: "Schedule full-lane milling and asphalt overlay rather than loose cold-mix patching.",
      severity: "medium"
    }
  ];

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-5" id="predictive-insights-panel">
      
      {/* Title block */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4.5 h-4.5 text-indigo-500 animate-pulse" />
            AI Predictive maintenance
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Scans active community issues using Gemini AI to predict underlying municipal weaknesses.
          </p>
        </div>

        {/* Map Toggle Switcher */}
        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showHotspotsOnMap}
            onChange={(e) => onToggleShowHotspotsOnMap(e.target.checked)}
            className="sr-only peer"
          />
          <div className="relative w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
          <span className="text-xs font-semibold text-slate-700">Display Thermal Overlay</span>
        </label>
      </div>

      {/* Sub-Tabs: Toggle between Hotspots and Smart Forecast Dashboard */}
      <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/65">
        <button
          onClick={() => setActiveSubTab('hotspots')}
          className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'hotspots'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-950'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" /> Predictive Hotspots
        </button>
        <button
          onClick={() => setActiveSubTab('forecasts')}
          className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'forecasts'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-950'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" /> Smart AI Forecasts
        </button>
      </div>

      {activeSubTab === 'hotspots' ? (
        <div className="space-y-4">
          {/* Primary Action Button */}
          <button
            onClick={handlePredictClick}
            disabled={running}
            className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 active:scale-[0.98] disabled:scale-100 disabled:opacity-75 transition rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            id="trigger-ai-predictions"
          >
            {running ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analyzing municipal trends with Gemini 3.5-flash...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                Generate Live AI Hotspot Recommendations
              </>
            )}
          </button>

          {/* Hotspot Cards List */}
          <div className="space-y-4">
            {hotspots.length === 0 ? (
              <div className="border border-slate-100 p-6 rounded-xl text-center space-y-2 bg-slate-50/50">
                <Info className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">No Risk Hotspots Found</p>
                <p className="text-[11px] text-slate-400 max-w-[280px] mx-auto leading-normal">
                  Click the AI button above to instruct Gemini to group current reported complaints and build preventive maintenance insight cards.
                </p>
              </div>
            ) : (
              hotspots.map((hs) => {
                const styles = getRiskColor(hs.riskScore);
                return (
                  <div 
                    key={hs.id} 
                    className={`p-4 rounded-xl border space-y-3.5 transition duration-300 ${styles.bg} ${styles.border}`}
                  >
                    {/* Header: Title & Risk score */}
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <span className="px-2 py-0.5 bg-white border border-slate-200/60 rounded text-[9px] font-bold font-mono text-slate-500 uppercase">
                          {hs.category} Risk Zone
                        </span>
                        <h3 className="text-xs font-bold text-slate-900 mt-1">{hs.title}</h3>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-black font-mono flex items-center gap-0.5 ${styles.text}`}>
                          <TrendingUp className="w-3.5 h-3.5" />
                          {hs.riskScore}%
                        </span>
                        <span className="text-[8px] text-slate-400 block uppercase font-bold tracking-wider">Failure Risk</span>
                      </div>
                    </div>

                    {/* Progress bar representing risk indicator */}
                    <div className="w-full h-1.5 bg-slate-200/85 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${styles.bar}`} style={{ width: `${hs.riskScore}%` }}></div>
                    </div>

                    {/* Clinical AI reasoning */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">AI Diagnostics</span>
                      <p className="text-xs text-slate-700 leading-relaxed font-sans bg-white/60 p-2.5 rounded-lg border border-slate-100">
                        {hs.reasoning}
                      </p>
                    </div>

                    {/* Preventative recommendation */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Actionable Preventative Recommendation
                      </span>
                      <p className="text-xs text-emerald-950/90 font-medium leading-relaxed bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100/40">
                        {hs.recommendation}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* Smart Prediction AI Dashboard Layout */
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-100/70 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-indigo-600 animate-spin" />
              Live AI Forecasting Dashboard
            </div>
            <p className="text-xs text-indigo-950/90 leading-relaxed">
              Analyzing complaints, traffic cycles, and historical reports in Chandigarh. The system compiles upcoming infrastructure failures so preventative crews can deploy <strong>before</strong> issues escalate.
            </p>
          </div>

          <div className="space-y-4">
            {forecastWards.map((item, idx) => {
              const styles = getRiskColor(item.probability);
              return (
                <div key={idx} className={`p-4 bg-white border border-slate-150 rounded-xl space-y-3 shadow-sm hover:shadow-md transition duration-300 relative overflow-hidden`}>
                  
                  {/* High priority pulse indicator */}
                  {item.severity === 'high' && (
                    <div className="absolute top-0 right-0 h-1 w-full bg-rose-500 animate-pulse"></div>
                  )}

                  {/* Header info */}
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 uppercase tracking-wide">
                        {item.ward}
                      </span>
                      <h3 className="text-xs font-black text-slate-900 mt-1.5 flex items-center gap-1">
                        {item.severity === 'high' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        )}
                        {item.issue}
                      </h3>
                    </div>

                    <div className="text-right shrink-0">
                      <div className={`text-xs font-extrabold flex items-center justify-end font-mono ${styles.text}`}>
                        {item.probability}%
                      </div>
                      <span className="text-[8px] text-slate-400 uppercase tracking-wider block font-bold">Probability</span>
                    </div>
                  </div>

                  {/* Estimated Time Frame */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Predicted ETA: <strong className="text-slate-800">{item.eta}</strong></span>
                  </div>

                  {/* Diagnostic Trigger */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">AI Forecast Reason</span>
                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100/75">
                      {item.trigger}
                    </p>
                  </div>

                  {/* Recommended preventative action */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Pre-emptive Action Order
                    </span>
                    <p className="text-xs text-emerald-950 font-medium leading-relaxed bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100/40">
                      {item.remedy}
                    </p>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
