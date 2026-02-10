import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, Plus, Trash2, Cpu, Database, Play, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- FIREBASE & SYNC IMPORTS ---
import { auth } from './lib/firebase';
import { syncProgress } from './lib/syncService';

export default function BankersLab() {
  // Resources: A (CPU), B (RAM), C (I/O)
  const [totalResources, setTotalResources] = useState({ a: 10, b: 5, c: 7 });
  const [processes, setProcesses] = useState([
    { id: 0, alloc: { a: 0, b: 1, c: 0 }, max: { a: 7, b: 5, c: 3 } },
    { id: 1, alloc: { a: 2, b: 0, c: 0 }, max: { a: 3, b: 2, c: 2 } },
    { id: 2, alloc: { a: 3, b: 0, c: 2 }, max: { a: 9, b: 0, c: 2 } },
  ]);

  const [safeSequence, setSafeSequence] = useState([]);
  const [isSafe, setIsSafe] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [newP, setNewP] = useState({ 
    alloc: { a: 0, b: 0, c: 0 }, 
    max: { a: 0, b: 0, c: 0 } 
  });

  // 1. Calculate Available Resources (Total - Sum of Allocations)
  const calculateAvailable = () => {
    const currentAlloc = processes.reduce((acc, p) => ({
      a: acc.a + p.alloc.a,
      b: acc.b + p.alloc.b,
      c: acc.c + p.alloc.c
    }), { a: 0, b: 0, c: 0 });

    return {
      a: totalResources.a - currentAlloc.a,
      b: totalResources.b - currentAlloc.b,
      c: totalResources.c - currentAlloc.c
    };
  };

  const available = calculateAvailable();

  // 2. Find Safe Sequence (The Algorithm)
  const findSafeSequence = async () => {
    let work = { ...available };
    let finish = new Array(processes.length).fill(false);
    let sequence = [];
    let possible = true;

    while (sequence.length < processes.length && possible) {
      possible = false;
      for (let i = 0; i < processes.length; i++) {
        if (!finish[i]) {
          const need = {
            a: processes[i].max.a - processes[i].alloc.a,
            b: processes[i].max.b - processes[i].alloc.b,
            c: processes[i].max.c - processes[i].alloc.c
          };

          if (need.a <= work.a && need.b <= work.b && need.c <= work.c) {
            work.a += processes[i].alloc.a;
            work.b += processes[i].alloc.b;
            work.c += processes[i].alloc.c;
            finish[i] = true;
            sequence.push(processes[i].id);
            possible = true;
          }
        }
      }
    }

    if (sequence.length === processes.length) {
      setSafeSequence(sequence);
      setIsSafe(true);
    } else {
      setSafeSequence([]);
      setIsSafe(false);
    }

    // --- TRIGGER CLOUD SYNC ---
    if (auth.currentUser) {
      setIsSyncing(true);
      await syncProgress(auth.currentUser.uid, 'deadlock');
      setTimeout(() => setIsSyncing(false), 1500);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      {/* Header & Sync Badge */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-tight">Banker's Algorithm</h2>
            <p className="text-emerald-400/50 font-mono text-xs tracking-[0.3em]">Deadlock Avoidance Engine</p>
          </div>
          <AnimatePresence>
            {isSyncing && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">Cloud Saved</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <button 
          onClick={findSafeSequence}
          className="flex items-center gap-3 bg-emerald-500 text-black px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-95 transition-all"
        >
          <Play size={16} fill="currentColor" /> Compute Safe State
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* System Configuration */}
        <div className="glass-panel p-6 space-y-6 bg-slate-900/40 border-white/5">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Database size={14} className="text-emerald-400" /> Total Resources
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {['a', 'b', 'c'].map((r) => (
              <div key={r} className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase text-center block">Res {r.toUpperCase()}</label>
                <input 
                  type="number" value={totalResources[r]} 
                  onChange={(e) => setTotalResources({...totalResources, [r]: Number(e.target.value)})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-emerald-400 font-mono text-center outline-none focus:border-emerald-500"
                />
              </div>
            ))}
          </div>
          
          <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
            <p className="text-[10px] text-emerald-400 font-bold uppercase mb-3 text-center tracking-widest">Available Pool</p>
            <div className="flex justify-around text-xl font-black text-white font-mono">
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-600">A</span>
                {available.a}
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-600">B</span>
                {available.b}
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-600">C</span>
                {available.c}
              </div>
            </div>
          </div>
        </div>

        {/* Process Entry Table */}
        <div className="xl:col-span-2 glass-panel p-6 bg-slate-900/40 border-white/5">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Cpu size={14} className="text-emerald-400" /> Allocation & Max Matrix
          </h3>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[10px] text-slate-500 uppercase font-black">
                  <th className="px-4">PID</th>
                  <th className="px-4">Allocation (A B C)</th>
                  <th className="px-4">Max Need (A B C)</th>
                  <th className="px-4 text-emerald-400">Remaining Need</th>
                  <th className="px-4"></th>
                </tr>
              </thead>
              <tbody>
                {processes.map((p) => (
                  <tr key={p.id} className="bg-white/5 rounded-xl group hover:bg-white/10 transition-colors">
                    <td className="p-4 font-mono text-emerald-400">P0{p.id}</td>
                    <td className="p-4 font-mono text-slate-300">
                      {p.alloc.a} {p.alloc.b} {p.alloc.c}
                    </td>
                    <td className="p-4 font-mono text-slate-300">
                      {p.max.a} {p.max.b} {p.max.c}
                    </td>
                    <td className="p-4 font-mono text-emerald-500 font-bold">
                      {p.max.a - p.alloc.a} {p.max.b - p.alloc.b} {p.max.c - p.alloc.c}
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => setProcesses(processes.filter(i => i.id !== p.id))} className="text-rose-500/30 hover:text-rose-500">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Quick Add Form */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end border-t border-white/5 pt-6">
            <div className="space-y-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Set Allocation</span>
              <div className="flex gap-2">
                <input placeholder="A" type="number" className="w-full bg-black/20 border border-white/10 p-2 rounded-lg text-xs" onChange={e => setNewP({...newP, alloc: {...newP.alloc, a: Number(e.target.value)}})} />
                <input placeholder="B" type="number" className="w-full bg-black/20 border border-white/10 p-2 rounded-lg text-xs" onChange={e => setNewP({...newP, alloc: {...newP.alloc, b: Number(e.target.value)}})} />
                <input placeholder="C" type="number" className="w-full bg-black/20 border border-white/10 p-2 rounded-lg text-xs" onChange={e => setNewP({...newP, alloc: {...newP.alloc, c: Number(e.target.value)}})} />
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Set Max Need</span>
              <div className="flex gap-2">
                <input placeholder="A" type="number" className="w-full bg-black/20 border border-white/10 p-2 rounded-lg text-xs" onChange={e => setNewP({...newP, max: {...newP.max, a: Number(e.target.value)}})} />
                <input placeholder="B" type="number" className="w-full bg-black/20 border border-white/10 p-2 rounded-lg text-xs" onChange={e => setNewP({...newP, max: {...newP.max, b: Number(e.target.value)}})} />
                <input placeholder="C" type="number" className="w-full bg-black/20 border border-white/10 p-2 rounded-lg text-xs" onChange={e => setNewP({...newP, max: {...newP.max, c: Number(e.target.value)}})} />
              </div>
            </div>
            <button 
              onClick={() => setProcesses([...processes, { ...newP, id: processes.length }])}
              className="bg-white/10 hover:bg-emerald-500 hover:text-black py-3 rounded-xl text-[10px] font-black uppercase transition-all"
            >
              Add Process
            </button>
          </div>
        </div>
      </div>

      {/* Result Display */}
      
      <AnimatePresence>
        {isSafe !== null && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className={`p-8 rounded-3xl border-2 flex flex-col md:flex-row items-center gap-8 ${isSafe ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}
          >
            <div className={`h-16 w-16 rounded-2xl flex items-center justify-center ${isSafe ? 'bg-emerald-500 text-black shadow-[0_0_20px_#10b981]' : 'bg-rose-500 text-white'}`}>
              {isSafe ? <ShieldCheck size={32} /> : <AlertTriangle size={32} />}
            </div>
            <div className="flex-1 space-y-2 text-center md:text-left">
              <h4 className={`text-2xl font-black uppercase italic tracking-tighter ${isSafe ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isSafe ? 'System State: SAFE' : 'System State: UNSAFE'}
              </h4>
              {isSafe && (
                <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                  {safeSequence.map((pid, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="bg-emerald-500/20 border border-emerald-500/30 px-4 py-2 rounded-lg font-mono text-emerald-400 text-sm">P{pid}</span>
                      {i < safeSequence.length - 1 && <span className="text-slate-700">→</span>}
                    </div>
                  ))}
                </div>
              )}
              {!isSafe && <p className="text-xs text-rose-500/70 font-mono tracking-tighter">! Deadlock detected. Insufficient resources to fulfill process requirements sequentially.</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}