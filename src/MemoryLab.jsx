import React, { useState, useEffect } from 'react';
import { Database, Zap, AlertCircle, Play, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- FIREBASE & SYNC IMPORTS ---
import { auth } from './lib/firebase';
import { syncProgress } from './lib/syncService';

export default function MemoryLab() {
  const [pages, setPages] = useState("7,0,1,2,0,3,0,4,2,3");
  const [framesCount, setFramesCount] = useState(3);
  const [history, setHistory] = useState([]);
  const [algo, setAlgo] = useState('FIFO');
  const [isSyncing, setIsSyncing] = useState(false);

  const runSimulation = () => {
    const pageRefs = pages.split(',').map(s => s.trim()).filter(s => s !== "").map(Number);
    let frames = Array(framesCount).fill(null);
    let tempHistory = [];
    let pageFaults = 0;
    
    let fifoQueue = [];
    let recentUsage = [];

    pageRefs.forEach((page, index) => {
      let isHit = frames.includes(page);
      let replacedIndex = -1;

      if (!isHit) {
        pageFaults++;
        if (frames.includes(null)) {
          replacedIndex = frames.indexOf(null);
        } else {
          if (algo === 'FIFO') {
            const oldestPage = fifoQueue.shift();
            replacedIndex = frames.indexOf(oldestPage);
          } 
          else if (algo === 'LRU') {
            const lruPage = recentUsage.find(p => frames.includes(p));
            replacedIndex = frames.indexOf(lruPage);
          } 
          else if (algo === 'MRU') {
            const mruPage = recentUsage[recentUsage.length - 1];
            replacedIndex = frames.indexOf(mruPage);
          }
          else if (algo === 'OPTIMAL') {
            let farthest = -1;
            let indexToReplace = -1;
            
            for (let i = 0; i < frames.length; i++) {
              let nextUse = pageRefs.slice(index + 1).indexOf(frames[i]);
              if (nextUse === -1) {
                indexToReplace = i;
                break;
              }
              if (nextUse > farthest) {
                farthest = nextUse;
                indexToReplace = i;
              }
            }
            replacedIndex = indexToReplace;
          }
        }
        frames[replacedIndex] = page;
        if (algo === 'FIFO') fifoQueue.push(page);
      }

      recentUsage = recentUsage.filter(p => p !== page);
      recentUsage.push(page);

      tempHistory.push({
        page,
        frames: [...frames],
        isHit,
        faults: pageFaults,
        replacedIdx: replacedIndex // Track which frame changed
      });
    });

    setHistory(tempHistory);

    // --- TRIGGER CLOUD SYNC ---
    if (auth.currentUser) {
      setIsSyncing(true);
      // We use a small timeout so the sync badge doesn't flicker too fast
      syncProgress(auth.currentUser.uid, 'memory');
      setTimeout(() => setIsSyncing(false), 1500);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [pages, algo, framesCount]);

  const pageHits = history.filter(h => h.isHit).length;
  const totalFaults = history.length > 0 ? history[history.length - 1].faults : 0;
  const hitRatio = history.length > 0 ? ((pageHits / history.length) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-tight">Memory Lab Pro</h2>
            <p className="text-purple-400/50 font-mono text-xs tracking-[0.3em]">Virtual Memory Management</p>
          </div>
          
          {/* Cloud Sync Status */}
          <AnimatePresence>
            {isSyncing && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-ping" />
                <span className="text-[8px] font-bold text-purple-400 uppercase tracking-widest">Syncing Pages</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-wrap gap-2 bg-slate-900/50 p-2 rounded-2xl border border-white/5 backdrop-blur-md">
          {['FIFO', 'LRU', 'MRU', 'OPTIMAL'].map((m) => (
            <button key={m} onClick={() => setAlgo(m)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${algo === m ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'text-slate-500 hover:text-white'}`}>
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-panel p-6 space-y-6">
            <div>
              <label className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-3 block">Reference String</label>
              <input 
                value={pages}
                onChange={(e) => setPages(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-purple-500 outline-none font-mono text-white"
                placeholder="7,0,1,2..."
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-3 block">Frame Slots: {framesCount}</label>
              <input 
                type="range" min="2" max="5" value={framesCount}
                onChange={(e) => setFramesCount(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>
          </div>
          
          <div className="glass-panel p-6 bg-purple-500/5 border-purple-500/20 text-center">
             <h4 className="text-[10px] font-bold text-purple-400 uppercase mb-2 flex items-center justify-center gap-2"><Info size={12}/> Analysis</h4>
             <p className="text-[10px] text-slate-500 leading-relaxed italic">
                A Page Hit ratio of <span className="text-white font-bold">{hitRatio}%</span> indicates {parseFloat(hitRatio) > 50 ? 'efficient' : 'heavy'} memory pressure for the <span className="text-purple-400">{algo}</span> algorithm.
             </p>
          </div>
        </div>

        {/* Visualizer Panel */}
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-panel p-8 overflow-x-auto custom-scrollbar relative bg-slate-950/50">
            <div className="flex gap-6 min-w-max pb-4">
              {history.map((step, i) => (
                <div key={i} className="flex-shrink-0 flex flex-col items-center">
                  <div className={`mb-6 w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg border-2 transition-all ${step.isHit ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' : 'border-rose-500/50 text-rose-400 bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.1)]'}`}>
                    {step.page}
                  </div>
                  <div className="space-y-3">
                    {step.frames.map((f, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        key={idx} 
                        className={`w-12 h-12 border rounded-lg flex items-center justify-center text-xs font-mono transition-colors ${idx === step.replacedIdx ? 'bg-purple-500/40 border-purple-400 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]' : f === step.page && step.isHit ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'border-white/5 text-slate-500'}`}
                      >
                        {f !== null ? f : '-'}
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-6">
                    {step.isHit ? <Zap size={16} className="text-emerald-500 animate-pulse" /> : <div className="h-4 w-4 rounded-full border-2 border-rose-500/30 flex items-center justify-center text-[8px] font-bold text-rose-500">F</div>}
                  </div>
                </div>
              ))}
            </div>
            
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-panel p-5 bg-emerald-500/5 border-emerald-500/20 text-center">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Total Hits</p>
              <p className="text-3xl font-black text-emerald-500 font-mono">{pageHits}</p>
            </div>
            <div className="glass-panel p-5 bg-rose-500/5 border-rose-500/20 text-center">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Page Faults</p>
              <p className="text-3xl font-black text-rose-500 font-mono">{totalFaults}</p>
            </div>
            <div className="glass-panel p-5 bg-cyan-500/5 border-cyan-500/20 text-center">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Hit Ratio</p>
              <p className="text-3xl font-black text-cyan-400 font-mono">{hitRatio}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}