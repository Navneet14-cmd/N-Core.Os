import React, { useState, useEffect } from 'react';
import { Plus, Play, Trash2, Cpu, Clock, Activity, Settings2, CloudSync } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- FIREBASE & SYNC IMPORTS ---
import { auth } from './lib/firebase';
import { syncProgress } from './lib/syncService';

export default function CPULab() {
  const [processes, setProcesses] = useState([
    { id: 1, burst: 5, arrival: 0, priority: 1, color: '#22d3ee' },
    { id: 2, burst: 3, arrival: 2, priority: 2, color: '#818cf8' },
  ]);
  
  const [algo, setAlgo] = useState('FCFS');
  const [quantum, setQuantum] = useState(2);
  const [ganttChart, setGanttChart] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newP, setNewP] = useState({ arrival: 0, burst: 1, priority: 1 });
  const [isSyncing, setIsSyncing] = useState(false); // Sync visual state

  const calculateSchedule = () => {
    let schedule = [];
    let time = 0;
    let pool = processes.map(p => ({ ...p, remaining: p.burst }));
    let completed = 0;

    if (processes.length === 0) return setGanttChart([]);

    while (completed < processes.length) {
      let available = pool.filter(p => p.arrival <= time && p.remaining > 0);

      if (available.length === 0) {
        time = Math.min(...pool.filter(p => p.remaining > 0).map(p => p.arrival));
        continue;
      }

      let selected;
      if (algo === 'FCFS') selected = available.sort((a, b) => a.arrival - b.arrival)[0];
      else if (algo === 'SJF') selected = available.sort((a, b) => a.burst - b.burst)[0];
      else if (algo === 'SRTF') selected = available.sort((a, b) => a.remaining - b.remaining)[0];
      else if (algo === 'Priority') selected = available.sort((a, b) => a.priority - b.priority)[0];
      else if (algo === 'RR') selected = available[0];
      
      let executeTime = (algo === 'RR') ? Math.min(selected.remaining, quantum) : (algo === 'SRTF' ? 1 : selected.burst);
      
      schedule.push({ ...selected, start: time, end: time + executeTime });
      time += executeTime;
      selected.remaining -= executeTime;

      if (algo === 'RR') {
        pool = [...pool.filter(p => p.id !== selected.id), selected];
      }

      if (selected.remaining === 0) completed++;
    }

    const merged = schedule.reduce((acc, curr) => {
      let prev = acc[acc.length - 1];
      if (prev && prev.id === curr.id) {
        prev.end = curr.end;
        return acc;
      }
      return [...acc, curr];
    }, []);

    setGanttChart(merged);
  };

  useEffect(() => { calculateSchedule(); }, [processes, algo, quantum]);

  const calculateMetrics = () => {
    if (processes.length === 0) return { awt: 0, atat: 0 };
    let totalWT = 0;
    let totalTAT = 0;

    processes.forEach(p => {
      const pBlocks = ganttChart.filter(block => block.id === p.id);
      if(pBlocks.length === 0) return;
      const completionTime = Math.max(...pBlocks.map(b => b.end));
      const tat = completionTime - p.arrival;
      const wt = tat - p.burst;
      totalTAT += tat;
      totalWT += wt;
    });

    return {
      awt: (totalWT / processes.length).toFixed(2),
      atat: (totalTAT / processes.length).toFixed(2)
    };
  };

  const metrics = calculateMetrics();

  // --- MODIFIED HANDLE ADD WITH SYNC ---
  const handleAdd = async (e) => {
    e.preventDefault();
    const id = processes.length > 0 ? Math.max(...processes.map(p => p.id)) + 1 : 1;
    const colors = ['#22d3ee', '#818cf8', '#f472b6', '#fbbf24', '#10b981', '#a855f7'];
    
    setProcesses([...processes, { ...newP, id, color: colors[id % colors.length] }]);
    setShowAddModal(false);
    setNewP({ arrival: 0, burst: 1, priority: 1 });

    // Cloud Sync Logic
    if (auth.currentUser) {
      setIsSyncing(true);
      await syncProgress(auth.currentUser.uid, 'cpu');
      setTimeout(() => setIsSyncing(false), 2000); // Visual delay for the "Sync" effect
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-6">
          <div>
            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-tight">CPU Lab Pro</h2>
            <p className="text-cyan-400/50 font-mono text-xs tracking-[0.3em]">Scheduler Engine v3.0</p>
          </div>
          
          {/* SYNC INDICATOR */}
          <AnimatePresence>
            {isSyncing && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-[8px] font-bold text-cyan-400 uppercase tracking-widest">Cloud Syncing</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="flex flex-wrap gap-2 bg-slate-900/50 p-2 rounded-2xl border border-white/5 backdrop-blur-md">
          {['FCFS', 'SJF', 'SRTF', 'RR', 'Priority'].map((m) => (
            <button key={m} onClick={() => setAlgo(m)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${algo === m ? 'bg-cyan-500 text-black shadow-glow' : 'text-slate-500 hover:text-white'}`}>
              {m}
            </button>
          ))}
        </div>
      </div>

      {algo === 'RR' && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 glass-panel p-4 w-fit">
           <span className="text-[10px] font-bold text-slate-500 uppercase">Time Quantum:</span>
           <input type="number" value={quantum} onChange={(e) => setQuantum(Number(e.target.value))} 
            className="w-16 bg-black/40 border border-white/10 rounded-lg p-2 text-cyan-400 font-mono text-center outline-none" />
        </motion.div>
      )}

      {/* Gantt Chart Container */}
      
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-8 flex items-center gap-2">
          <Clock size={14} className="text-cyan-400" /> Timeline Visualizer
        </h3>
        
        <div className="flex items-end min-h-[140px] pb-10 overflow-x-auto scrollbar-hide gap-1 border-l border-b border-white/10 px-4">
          <AnimatePresence mode='popLayout'>
            {ganttChart.map((p, i) => (
              <motion.div key={`${p.id}-${i}`} initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: (p.end - p.start) * 40 }}
                className="relative group min-w-fit">
                <div style={{ background: `linear-gradient(135deg, ${p.color}aa, ${p.color}33)` }}
                  className="h-20 border border-white/20 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-sm">
                  <span className="text-white font-black text-xs px-2">P{p.id}</span>
                </div>
                <span className="absolute -bottom-10 left-0 text-[10px] font-mono text-cyan-500/50">{p.start}</span>
                {i === ganttChart.length - 1 && <span className="absolute -bottom-10 right-0 text-[10px] font-mono text-cyan-500/50">{p.end}</span>}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/40 border border-white/5 rounded-3xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-white flex items-center gap-2 text-sm"><Settings2 size={18} className="text-cyan-400" /> Process Control</h3>
            <button onClick={() => setShowAddModal(true)} className="bg-cyan-500 text-black px-4 py-2 rounded-xl font-black text-[10px] uppercase shadow-glow">Add New Process</button>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-[10px] uppercase tracking-widest border-b border-white/5">
                <th className="pb-4 px-4">PID</th>
                <th className="pb-4 px-4">Arrival</th>
                <th className="pb-4 px-4">Burst</th>
                {algo === 'Priority' && <th className="pb-4 px-4">Priority</th>}
                <th className="pb-4 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {processes.map((p) => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 px-4 font-mono text-cyan-400">P0{p.id}</td>
                  <td className="py-4 px-4">{p.arrival}ms</td>
                  <td className="py-4 px-4">{p.burst}ms</td>
                  {algo === 'Priority' && <td className="py-4 px-4 font-bold text-amber-400">{p.priority}</td>}
                  <td className="py-4 px-4 text-right"><button onClick={() => setProcesses(processes.filter(i => i.id !== p.id))} className="text-red-500/50 hover:text-red-500"><Trash2 size={16}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-6">
          <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-3xl p-6 space-y-6">
             <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2"><Activity size={14}/> Simulation Metrics</h3>
             <div className="space-y-6">
                <div className="flex justify-between items-end border-b border-white/5 pb-2">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Avg Waiting Time</span>
                  <span className="text-2xl font-black text-white font-mono">{metrics.awt}<small className="text-[10px] ml-1 text-slate-500 tracking-tighter">ms</small></span>
                </div>
                <div className="flex justify-between items-end border-b border-white/5 pb-2">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Avg Turnaround</span>
                  <span className="text-2xl font-black text-white font-mono">{metrics.atat}<small className="text-[10px] ml-1 text-slate-500 tracking-tighter">ms</small></span>
                </div>
             </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#0f172a] border border-cyan-500/30 p-8 rounded-3xl max-w-md w-full space-y-6 shadow-2xl">
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Process Parameters</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Arrival</label>
                  <input type="number" required value={newP.arrival} onChange={(e) => setNewP({...newP, arrival: Number(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Burst</label>
                  <input type="number" required min="1" value={newP.burst} onChange={(e) => setNewP({...newP, burst: Number(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-cyan-500" />
                </div>
              </div>
              {algo === 'Priority' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <label className="text-[10px] text-amber-500 font-bold uppercase mb-1 block">Priority Level</label>
                  <input type="number" required value={newP.priority} onChange={(e) => setNewP({...newP, priority: Number(e.target.value)})} className="w-full bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-white outline-none focus:border-amber-500" />
                </motion.div>
              )}
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors">Abort</button>
                <button type="submit" className="flex-1 bg-cyan-500 text-black py-3 rounded-xl text-[10px] font-black uppercase shadow-glow">Commit Process</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}