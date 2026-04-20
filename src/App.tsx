/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  ChevronRight,
  Info,
  AlertCircle,
  Zap
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---

interface TonnageData {
  ruh: number;
  dmm: number;
  jed: number;
}

interface ProductivityData {
  ruh: number;
  dmm: number;
  jed: number;
}

interface ManpowerConfig {
  fteCost: number;
  scCost: number;
}

// --- Components ---

const InputGroup = ({ 
  label, 
  value, 
  onChange, 
  min, 
  max, 
  step = 1, 
  unit = "",
  icon: Icon
}: { 
  label: string; 
  value: number; 
  onChange: (val: number) => void; 
  min: number; 
  max: number; 
  step?: number;
  unit?: string;
  icon?: any;
}) => {
  const [localValue, setLocalValue] = useState(value.toString());

  useEffect(() => {
    if (Number(localValue) !== value) {
      setLocalValue(value.toString());
    }
  }, [value, localValue]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);
    if (val === "") {
      onChange(0);
      return;
    }
    const num = Number(val);
    if (!isNaN(num)) {
      onChange(num);
    }
  };

  return (
    <div className="space-y-3 p-4 border-b border-zinc-100 last:border-0">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono uppercase tracking-wider text-zinc-600 flex items-center gap-2">
          {Icon && <Icon size={14} className="text-zinc-500" />}
          {label}
        </label>
        <div className="flex items-center gap-2">
          <input 
            type="number" 
            value={localValue}
            onChange={handleTextChange}
            min={min}
            max={max}
            step={step}
            className="w-24 bg-white border border-zinc-300 rounded px-2 py-1.5 text-sm font-mono text-zinc-900 focus:outline-none focus:border-zinc-500 transition-colors"
          />
          <span className="text-xs font-mono text-zinc-600">{unit}</span>
        </div>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step} 
        value={value} 
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-zinc-900"
      />
    </div>
  );
};

const StatCard = ({ label, value, subtext, icon: Icon, trend, valueClassName, subtextClassName }: { 
  label: string; 
  value: string | number; 
  subtext?: string; 
  icon: any;
  trend?: string;
  valueClassName?: string;
  subtextClassName?: string;
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white border border-zinc-200 p-6 rounded-xl shadow-sm space-y-4"
  >
    <div className="flex items-center justify-between">
      <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200">
        <Icon size={20} className="text-zinc-800" />
      </div>
      {trend && (
        <span className={cn(
          "text-xs font-mono font-bold uppercase tracking-tighter",
          trend === "Positive" ? "text-emerald-700" : trend === "Negative" ? "text-rose-700" : "text-zinc-500"
        )}>
          {trend}
        </span>
      )}
    </div>
    <div>
      <p className="text-xs font-mono uppercase tracking-widest text-zinc-600">{label}</p>
      <h3 className={cn("text-3xl font-mono font-medium mt-1", valueClassName || "text-zinc-950")}>
        {typeof value === 'number' && isNaN(value) ? '0' : value}
      </h3>
      {subtext && <p className={cn("text-xs font-mono mt-1", subtextClassName || "text-zinc-600")}>{subtext}</p>}
    </div>
  </motion.div>
);

export default function App() {
  // --- State ---
  const [tonnage, setTonnage] = useState<TonnageData>({
    ruh: 10000,
    dmm: 8000,
    jed: 7000
  });
  const [productivity, setProductivity] = useState<ProductivityData>({
    ruh: 224,
    dmm: 238,
    jed: 160
  });
  
  const [shiftHours, setShiftHours] = useState(10);

  const [currentHC, setCurrentHC] = useState({
    ruh: { fte: 36, sc: 103 },
    dmm: { fte: 12, sc: 23 },
    jed: { fte: 11, sc: 71 }
  });
  const [loadingFactor, setLoadingFactor] = useState(1.1);
  const [fteCost, setFteCost] = useState(2200);
  const [scCost, setScCost] = useState(1500);

  const currentFte = useMemo(() => currentHC.ruh.fte + currentHC.dmm.fte + currentHC.jed.fte, [currentHC]);
  const currentSc = useMemo(() => currentHC.ruh.sc + currentHC.dmm.sc + currentHC.jed.sc, [currentHC]);

  // --- Calculations ---
  const effectiveMinFtePercent = useMemo(() => {
    const total = currentFte + currentSc;
    if (total === 0) return 50; // Default to 50% if no current headcount entered
    return (currentFte / total) * 100;
  }, [currentFte, currentSc]);
  const totalTonnage = useMemo(() => tonnage.ruh + tonnage.dmm + tonnage.jed, [tonnage]);
  const overallProductivity = useMemo(() => Math.round((productivity.ruh + productivity.dmm + productivity.jed) / 3), [productivity]);
  
  const handleTotalTonnageChange = (newTotal: number) => {
    if (totalTonnage === 0) {
      const third = Math.round(newTotal / 3);
      setTonnage({
        ruh: third,
        dmm: third,
        jed: newTotal - (2 * third)
      });
      return;
    }
    const ratio = newTotal / totalTonnage;
    setTonnage({
      ruh: Math.round(tonnage.ruh * ratio),
      dmm: Math.round(tonnage.dmm * ratio),
      jed: Math.round(tonnage.jed * ratio)
    });
  };

  const handleOverallProductivityChange = (newOverall: number) => {
    if (totalTonnage === 0) {
      const third = Math.round(newOverall / 3);
      setProductivity({
        ruh: third,
        dmm: third,
        jed: newOverall - (2 * third)
      });
      return;
    }
    const ruh = Math.round((tonnage.ruh / totalTonnage) * newOverall * 3);
    const dmm = Math.round((tonnage.dmm / totalTonnage) * newOverall * 3);
    const jed = Math.round((tonnage.jed / totalTonnage) * newOverall * 3);
    setProductivity({ ruh, dmm, jed });
  };

  // Keep productivity targets in sync with tonnage ratios when tonnage changes
  useEffect(() => {
    handleOverallProductivityChange(overallProductivity);
  }, [tonnage, totalTonnage]);

  const calculateHours = (t: number, p: number) => p > 0 ? (t * 1000) / p : 0;

  const manpower = useMemo(() => {
    const ruhHoursRaw = calculateHours(tonnage.ruh, productivity.ruh) * loadingFactor;
    const dmmHoursRaw = calculateHours(tonnage.dmm, productivity.dmm) * loadingFactor;
    const jedHoursRaw = calculateHours(tonnage.jed, productivity.jed) * loadingFactor;
    
    const totalHours = ruhHoursRaw + dmmHoursRaw + jedHoursRaw;
    const MONTHLY_HOURS = shiftHours * 30;
    
    // 1. Global Optimization based on current total FTE%
    const minFteHours = totalHours * (effectiveMinFtePercent / 100);
    const globalFte = Math.ceil(minFteHours / MONTHLY_HOURS);
    const remainingHours = Math.max(0, totalHours - (globalFte * MONTHLY_HOURS));
    const globalSc = Math.ceil(remainingHours / MONTHLY_HOURS);

    // 2. Distribute FTEs and SCs based on their respective current shares
    // We use Math.ceil here to ensure station-level requirements are met
    const ruhFte = Math.ceil(globalFte * (currentFte > 0 ? currentHC.ruh.fte / currentFte : 1/3));
    const dmmFte = Math.ceil(globalFte * (currentFte > 0 ? currentHC.dmm.fte / currentFte : 1/3));
    const jedFte = Math.ceil(globalFte * (currentFte > 0 ? currentHC.jed.fte / currentFte : 1/3));

    const ruhSc = Math.ceil(globalSc * (currentSc > 0 ? currentHC.ruh.sc / currentSc : 1/3));
    const dmmSc = Math.ceil(globalSc * (currentSc > 0 ? currentHC.dmm.sc / currentSc : 1/3));
    const jedSc = Math.ceil(globalSc * (currentSc > 0 ? currentHC.jed.sc / currentSc : 1/3));

    // 3. Sum up the rounded station values for the final totals
    const totalFte = ruhFte + dmmFte + jedFte;
    const totalSc = ruhSc + dmmSc + jedSc;
    const totalHC = totalFte + totalSc;

    return {
      totalHours,
      totalFte,
      totalSc,
      totalHC,
      ruhFte,
      dmmFte,
      jedFte,
      ruhSc,
      dmmSc,
      jedSc,
      ruhHC: ruhFte + ruhSc,
      dmmHC: dmmFte + dmmSc,
      jedHC: jedFte + jedSc,
      ruhHours: (ruhFte + ruhSc) * MONTHLY_HOURS,
      dmmHours: (dmmFte + dmmSc) * MONTHLY_HOURS,
      jedHours: (jedFte + jedSc) * MONTHLY_HOURS,
      monthlyHours: MONTHLY_HOURS
    };
  }, [tonnage, productivity, loadingFactor, currentHC, currentFte, currentSc, effectiveMinFtePercent, shiftHours]);

  const costMovement = useMemo(() => {
    const fteDiff = manpower.totalFte - currentFte;
    const scDiff = manpower.totalSc - currentSc;
    return (fteDiff * fteCost) + (scDiff * scCost);
  }, [currentFte, currentSc, manpower.totalFte, manpower.totalSc, fteCost, scCost]);

  const chartData = [
    { name: 'RUH', heads: manpower.ruhHC, color: '#18181b' },
    { name: 'DMM', heads: manpower.dmmHC, color: '#3f3f46' },
    { name: 'JED', heads: manpower.jedHC, color: '#71717a' },
    { name: 'SATS Saudi', heads: manpower.totalHC, color: '#ef2536' },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-800 font-sans selection:bg-zinc-200">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="/logo.png" 
                alt="Opti-Ops Logo" 
                className="h-12 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
              <div>
                <h1 className="text-4xl font-mono font-bold uppercase tracking-tighter text-brand-red">Opti-Ops</h1>
                <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest">WORKFORCE OPTIMIZATION</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-tighter">System Optimal Mode</span>
              </div>
              <div className="h-10 w-px bg-zinc-200" />
              <div className="text-right">
                <p className="text-xs font-mono text-zinc-600 uppercase">BU</p>
                <p className="text-sm font-mono text-zinc-950">SATS Saudi</p>
              </div>
            </div>
          </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Inputs */}
        <div className="lg:col-span-4 space-y-8">
          {/* Tonnage Section */}
          <section className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
              <TrendingUp size={16} className="text-zinc-700" />
              <h2 className="text-base font-mono font-bold uppercase tracking-widest text-brand-red">Tonnage Configuration</h2>
            </div>
            
            <InputGroup 
              label="Saudi Total Tonnage" 
              value={totalTonnage} 
              onChange={handleTotalTonnageChange}
              min={5000} 
              max={300000} 
              unit="TONS"
              icon={TrendingUp}
            />
            
            <div className="px-5 py-2.5 bg-zinc-50/50 border-b border-zinc-100">
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Station Breakdown</p>
            </div>

            <InputGroup 
              label="RUH Tonnage" 
              value={tonnage.ruh} 
              onChange={(v) => setTonnage(prev => ({ ...prev, ruh: v }))}
              min={0} 
              max={totalTonnage} 
              unit="TONS"
            />
            <InputGroup 
              label="DMM Tonnage" 
              value={tonnage.dmm} 
              onChange={(v) => setTonnage(prev => ({ ...prev, dmm: v }))}
              min={0} 
              max={totalTonnage} 
              unit="TONS"
            />
            <InputGroup 
              label="JED Tonnage" 
              value={tonnage.jed} 
              onChange={(v) => setTonnage(prev => ({ ...prev, jed: v }))}
              min={0} 
              max={totalTonnage} 
              unit="TONS"
            />
          </section>

          {/* Productivity Section */}
          <section className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
              <Zap size={16} className="text-zinc-700" />
              <h2 className="text-base font-mono font-bold uppercase tracking-widest text-brand-red">Productivity Targets</h2>
            </div>
            
            <InputGroup 
              label="Saudi Overall Productivity" 
              value={overallProductivity} 
              onChange={handleOverallProductivityChange}
              min={100} 
              max={1000} 
              unit="KG/HR"
              icon={Zap}
            />

            <div className="px-5 py-2.5 bg-zinc-50/50 border-b border-zinc-100">
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Station Breakdown</p>
            </div>

            <InputGroup 
              label="RUH Productivity" 
              value={productivity.ruh} 
              onChange={(v) => setProductivity(prev => ({ ...prev, ruh: v }))}
              min={1} 
              max={overallProductivity} 
              unit="KG/HR"
            />
            <InputGroup 
              label="DMM Productivity" 
              value={productivity.dmm} 
              onChange={(v) => setProductivity(prev => ({ ...prev, dmm: v }))}
              min={1} 
              max={overallProductivity} 
              unit="KG/HR"
            />
            <InputGroup 
              label="JED Productivity" 
              value={productivity.jed} 
              onChange={(v) => setProductivity(prev => ({ ...prev, jed: v }))}
              min={1} 
              max={overallProductivity} 
              unit="KG/HR"
            />
          </section>

          {/* Manpower Planning Mode */}
          <section className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-zinc-700" />
                <h2 className="text-base font-mono font-bold uppercase tracking-widest text-brand-red">Manpower Planning</h2>
              </div>
            </div>
            
            <div className="p-4 border-b border-zinc-100 bg-zinc-50/30">
              <div className="flex items-center gap-2 mb-4 px-1">
                <TrendingUp size={14} className="text-zinc-500" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-900">Current Operations Headcount</h3>
              </div>
              <div className="space-y-6">
                {(['ruh', 'dmm', 'jed'] as const).map((station) => (
                  <div key={station} className="space-y-2 p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                    <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500 mb-2">
                      {station === 'ruh' ? 'Riyadh (RUH)' : station === 'dmm' ? 'Dammam (DMM)' : 'Jeddah (JED)'}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono uppercase text-zinc-500">Current FTE</label>
                        <input 
                          type="number" 
                          value={currentHC[station].fte}
                          onChange={(e) => setCurrentHC(prev => ({ ...prev, [station]: { ...prev[station], fte: Number(e.target.value) } }))}
                          className="w-full bg-white border border-zinc-300 rounded px-2 py-1 text-xs font-mono text-zinc-900 focus:outline-none focus:border-zinc-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono uppercase text-zinc-500">Current SC</label>
                        <input 
                          type="number" 
                          value={currentHC[station].sc}
                          onChange={(e) => setCurrentHC(prev => ({ ...prev, [station]: { ...prev[station], sc: Number(e.target.value) } }))}
                          className="w-full bg-white border border-zinc-300 rounded px-2 py-1 text-xs font-mono text-zinc-900 focus:outline-none focus:border-zinc-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-zinc-100/50 rounded-lg border border-zinc-200">
                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 uppercase">
                  <span>Auto FTE Ratio:</span>
                  <span className="font-bold text-zinc-900">{effectiveMinFtePercent.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-zinc-50/30">
              <div className="flex items-center gap-2 mb-4 px-1">
                <Clock size={14} className="text-zinc-500" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-900">Shift Configuration</h3>
              </div>
              <div className="space-y-4 p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">Daily Shift Capacity</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      value={shiftHours}
                      onChange={(e) => setShiftHours(Number(e.target.value))}
                      min={5} 
                      max={15} 
                      step={0.5} 
                      className="w-16 bg-white border border-zinc-300 rounded px-2 py-1 text-xs font-mono text-zinc-900 focus:outline-none focus:border-zinc-500 transition-colors"
                    />
                    <span className="text-[10px] font-mono font-bold text-brand-red uppercase">HRS</span>
                  </div>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="15" 
                  step="0.5" 
                  value={shiftHours} 
                  onChange={(e) => setShiftHours(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-brand-red"
                />
                <div className="flex justify-between text-[8px] font-mono text-zinc-400 uppercase">
                  <span>5 HRS</span>
                  <span>15 HRS</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-zinc-50/30">
              <div className="flex items-center gap-2 mb-4 px-1">
                <Clock size={14} className="text-zinc-500" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-900">Loading Factor</h3>
              </div>
              <div className="space-y-4 p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">Multiplier</span>
                  <span className="text-xs font-mono font-bold text-brand-red">{loadingFactor.toFixed(2)}x</span>
                </div>
                <input 
                  type="range" 
                  min="1.00" 
                  max="1.50" 
                  step="0.01" 
                  value={loadingFactor} 
                  onChange={(e) => setLoadingFactor(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-brand-red"
                />
                <div className="flex justify-between text-[8px] font-mono text-zinc-400 uppercase">
                  <span>1.00 (Base)</span>
                  <span>1.50 (Max)</span>
                </div>
                <p className="text-[9px] leading-relaxed text-zinc-500 italic">
                  * Accounts for non-productive time (training, meetings, breaks, etc.)
                </p>
              </div>
            </div>

            <div className="p-4 bg-zinc-50/30">
              <div className="flex items-center gap-2 mb-4 px-1">
                <DollarSign size={14} className="text-zinc-500" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-900">Headcount Costs (SGD)</h3>
              </div>
              <div className="space-y-4 p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase text-zinc-500">1 FTE Monthly Cost</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400">$</span>
                    <input 
                      type="number" 
                      value={fteCost}
                      onChange={(e) => setFteCost(e.target.value === "" ? 0 : Number(e.target.value))}
                      className="w-full bg-white border border-zinc-300 rounded pl-5 pr-2 py-1.5 text-xs font-mono text-zinc-900 focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase text-zinc-500">1 SC Monthly Cost</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400">$</span>
                    <input 
                      type="number" 
                      value={scCost}
                      onChange={(e) => setScCost(e.target.value === "" ? 0 : Number(e.target.value))}
                      className="w-full bg-white border border-zinc-300 rounded pl-5 pr-2 py-1.5 text-xs font-mono text-zinc-900 focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Results & Optimization */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              label="Recommended Total Headcount" 
              value={Math.ceil(manpower.totalHC)} 
              subtext={`${Math.round(manpower.totalHours).toLocaleString()} Productive Hours`}
              icon={Users}
            />
            <StatCard 
              label="Recommended FTE Headcount" 
              value={manpower.totalFte} 
              subtext="Full-Time Employees"
              icon={Users}
            />
            <StatCard 
              label="Recommended SC Headcount" 
              value={manpower.totalSc} 
              subtext="Sub-Contractors"
              icon={Users}
            />
            <StatCard 
              label="Est. Monthly Savings" 
              value={`SGD ${costMovement.toLocaleString()}`} 
              subtext={costMovement < 0 ? "Potential Cost Reduction" : "Additional Cost Required"}
              icon={DollarSign}
              valueClassName={costMovement < 0 ? "text-emerald-600" : costMovement > 0 ? "text-rose-600" : "text-zinc-400"}
              subtextClassName={cn("text-sm font-bold", costMovement < 0 ? "text-emerald-600" : costMovement > 0 ? "text-rose-600" : "text-zinc-400")}
            />
          </div>

          {/* Charts & Breakdown */}
          <div className="grid grid-cols-1 gap-8">
            <section className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-mono font-bold uppercase tracking-widest text-brand-red">Headcount Breakdown by Station</h2>
                <Info size={16} className="text-zinc-500" />
              </div>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      stroke="#a1a1aa" 
                      fontSize={11} 
                      fontFamily="monospace"
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#0f172a', fontFamily: 'monospace', fontSize: '11px' }}
                      labelStyle={{ color: '#64748b', fontFamily: 'monospace', fontSize: '11px', marginBottom: '4px' }}
                      formatter={(value: number) => [Math.ceil(value || 0), "Headcount"]}
                    />
                    <Bar dataKey="heads" radius={[0, 4, 4, 0]} barSize={32}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                      <LabelList 
                        dataKey="heads" 
                        position="right" 
                        style={{ fill: '#18181b', fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold' }}
                        formatter={(value: number) => Math.ceil(value || 0)}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          {/* Detailed Table */}
          <section className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden mb-8">
            <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
              <h2 className="text-base font-mono font-bold uppercase tracking-widest text-brand-red">Recommended Productive Hours</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 text-zinc-600 uppercase tracking-tighter">
                    <th className="px-6 py-5 font-medium">Station</th>
                    <th className="px-6 py-5 font-medium">Shift Hours</th>
                    <th className="px-6 py-5 font-medium">Current Hours</th>
                    <th className="px-6 py-5 font-medium">Recommended Hours</th>
                    <th className="px-6 py-5 font-medium">Variance (Hours)</th>
                    <th className="px-6 py-5 font-medium text-right">Variance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {(() => {
                    const MONTHLY_FACTOR = 30; // 30 days

                    return [
                      { 
                        name: 'Riyadh (RUH)', 
                        hours: shiftHours, 
                        reqHours: manpower.ruhHours, 
                        currentHC: currentHC.ruh.fte + currentHC.ruh.sc 
                      },
                      { 
                        name: 'Dammam (DMM)', 
                        hours: shiftHours, 
                        reqHours: manpower.dmmHours, 
                        currentHC: currentHC.dmm.fte + currentHC.dmm.sc 
                      },
                      { 
                        name: 'Jeddah (JED)', 
                        hours: shiftHours, 
                        reqHours: manpower.jedHours, 
                        currentHC: currentHC.jed.fte + currentHC.jed.sc 
                      },
                      { 
                        name: 'Saudi Total', 
                        hours: '-', 
                        reqHours: manpower.totalHours, 
                        currentHC: currentFte + currentSc, 
                        highlight: true 
                      },
                    ].map((row, i) => {
                      const currentHours = typeof row.hours === 'number' 
                        ? row.currentHC * row.hours * MONTHLY_FACTOR 
                        : row.currentHC * shiftHours * MONTHLY_FACTOR; // Fallback for total using current shift settings
                      
                      const variance = row.reqHours - currentHours;
                      const variancePercent = currentHours > 0 ? (variance / currentHours) * 100 : 0;

                      return (
                        <tr key={i} className={cn("hover:bg-zinc-50/50 transition-colors", row.highlight && "bg-zinc-50 font-bold")}>
                          <td className="px-6 py-5 text-zinc-950">{row.name}</td>
                          <td className="px-6 py-5 text-zinc-700">{row.hours}</td>
                          <td className="px-6 py-5 text-zinc-700">{Math.round(currentHours).toLocaleString()}</td>
                          <td className="px-6 py-5 text-zinc-700">{Math.round(row.reqHours).toLocaleString()}</td>
                          <td className={cn(
                            "px-6 py-5 font-bold",
                            variance > 0 ? "text-emerald-600" : variance < 0 ? "text-rose-600" : "text-zinc-400"
                          )}>
                            {variance > 0 ? `+${Math.round(variance).toLocaleString()}` : Math.round(variance).toLocaleString()}
                          </td>
                          <td className={cn(
                            "px-6 py-5 text-right font-bold",
                            variancePercent > 0 ? "text-emerald-600" : variancePercent < 0 ? "text-rose-600" : "text-zinc-400"
                          )}>
                            {variancePercent > 0 ? `+${variancePercent.toFixed(1)}%` : `${variancePercent.toFixed(1)}%`}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </section>

          {/* Comparison Table */}
          <section className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-zinc-700" />
                <h2 className="text-base font-mono font-bold uppercase tracking-widest text-brand-red">Recommended Manpower Plan</h2>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 text-zinc-600 uppercase tracking-tighter">
                    <th className="px-6 py-5 font-medium">Station</th>
                    <th className="px-6 py-5 font-medium">Recommended Total Headcount</th>
                    <th className="px-6 py-5 font-medium">Variance (Headcount)</th>
                    <th className="px-6 py-5 font-medium">Variance %</th>
                    <th className="px-6 py-5 font-medium">Est. Cost Movement</th>
                    <th className="px-6 py-5 font-medium">Recommended Headcount - FTE</th>
                    <th className="px-6 py-5 font-medium text-right">Recommended Headcount - SC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {(() => {
                    const stationData = [
                      { 
                        id: 'ruh', 
                        name: 'RUH', 
                        recFte: manpower.ruhFte, 
                        recSc: manpower.ruhSc, 
                        currentFte: currentHC.ruh.fte, 
                        currentSc: currentHC.ruh.sc 
                      },
                      { 
                        id: 'dmm', 
                        name: 'DMM', 
                        recFte: manpower.dmmFte, 
                        recSc: manpower.dmmSc, 
                        currentFte: currentHC.dmm.fte, 
                        currentSc: currentHC.dmm.sc 
                      },
                      { 
                        id: 'jed', 
                        name: 'JED', 
                        recFte: manpower.jedFte, 
                        recSc: manpower.jedSc, 
                        currentFte: currentHC.jed.fte, 
                        currentSc: currentHC.jed.sc 
                      },
                    ];

                    const rows = stationData.map(s => {
                      const recTotal = s.recFte + s.recSc;
                      const currentTotal = s.currentFte + s.currentSc;
                      const variance = recTotal - currentTotal;
                      const variancePercent = currentTotal > 0 ? (variance / currentTotal) * 100 : 0;
                      const fteVariance = s.recFte - s.currentFte;
                      const scVariance = s.recSc - s.currentSc;
                      const rowSavings = (fteVariance * fteCost) + (scVariance * scCost);

                      return {
                        ...s,
                        recTotal,
                        currentTotal,
                        variance,
                        variancePercent,
                        rowSavings,
                        highlight: false
                      };
                    });

                    const totalRow = {
                      name: 'SATS Saudi',
                      recFte: manpower.totalFte,
                      recSc: manpower.totalSc,
                      recTotal: manpower.totalHC,
                      currentTotal: currentFte + currentSc,
                      variance: manpower.totalHC - (currentFte + currentSc),
                      rowSavings: costMovement,
                      highlight: true
                    };

                    const allRows = [...rows, totalRow];

                    return allRows.map((row, i) => {
                      const vPercent = row.name === 'SATS Saudi' 
                        ? (row.currentTotal > 0 ? (row.variance / row.currentTotal) * 100 : 0)
                        : (row as any).variancePercent;

                      return (
                        <tr key={i} className={cn("hover:bg-zinc-50/50 transition-colors", row.highlight && "bg-zinc-50 font-bold")}>
                          <td className="px-6 py-5 text-zinc-950">{row.name}</td>
                          <td className="px-6 py-5 text-zinc-700">{row.recTotal.toLocaleString()}</td>
                          <td className={cn(
                            "px-6 py-5 font-bold",
                            row.variance < 0 ? "text-emerald-600" : row.variance > 0 ? "text-rose-600" : "text-zinc-400"
                          )}>
                            {row.variance > 0 ? `+${row.variance.toLocaleString()}` : row.variance.toLocaleString()}
                          </td>
                          <td className={cn(
                            "px-6 py-5 font-bold",
                            vPercent < 0 ? "text-emerald-600" : vPercent > 0 ? "text-rose-600" : "text-zinc-400"
                          )}>
                            {vPercent > 0 ? `+${vPercent.toFixed(1)}%` : `${vPercent.toFixed(1)}%`}
                          </td>
                          <td className={cn(
                            "px-6 py-5 font-bold",
                            row.rowSavings < 0 ? "text-emerald-600" : row.rowSavings > 0 ? "text-rose-600" : "text-zinc-400"
                          )}>
                            {`SGD ${(row.rowSavings || 0).toLocaleString()}`}
                          </td>
                          <td className="px-6 py-5 text-zinc-700">{row.recFte.toLocaleString()}</td>
                          <td className="px-6 py-5 text-zinc-700 text-right">{row.recSc.toLocaleString()}</td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-zinc-200 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-30 grayscale">
            <img 
              src="/logo.png" 
              alt="Opti-Ops Logo" 
              className="h-6 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
            <span className="text-xs font-mono uppercase tracking-[0.2em]">Opti-Ops</span>
          </div>
          <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest">
            &copy; 2026 SATS GS APAC Operational Excellence. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
