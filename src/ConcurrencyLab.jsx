import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, Play, RotateCcw, Box, Plus, AlertCircle, 
  ShieldCheck, LayoutDashboard, Coffee, User as UserIcon, 
  Terminal as TerminalIcon 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- FIREBASE & SYNC IMPORTS ---
import { auth } from './lib/firebase';
import { syncProgress } from './lib/syncService';

export default function ConcurrencyLab() {
  const [activeModule, setActiveModule] = useState('producer-consumer');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([{ msg: "System: Concurrency Engine Standby", type: "system", id: 1 }]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Producer-Consumer State
  const [buffer, setBuffer] = useState([]);
  const bufferRef = useRef([]);

  // Dining Philosophers State
  const [philosophers, setPhilosophers] = useState([
    { id: 1, state: 'thinking' },
    { id: 2, state: 'thinking' },
    { id: 3, state: 'thinking' },
    { id: 4, state: 'thinking' },
    { id: 5, state: 'thinking' },
  ]);

  const addLog = (msg, type) => {
    setLogs(prev => [{ msg, type, id: Date.now() }, ...prev].slice(0, 6));
  };

  // --- CLOUD SYNC TRIGGER ---
  const triggerSync = async () => {
    if (auth.currentUser && !isSyncing) {
      setIsSyncing(true);
      await syncProgress(auth.currentUser.uid, 'concurrency');
      setTimeout(() => setIsSyncing(false), 2000);
    }
  };

  // --- LOGIC: PRODUCER CONSUMER ---
  const produce = () => {
    if (bufferRef.current.length >= 5) {
      addLog("Producer: Buffer Overflow! Mutex Blocked", "error");
      return;
    }
    const item = Math.floor(Math.random() * 99);
    bufferRef.current = [...bufferRef.current, item];
    setBuffer(bufferRef.current);
    addLog(`Thread-1: Produced Item #${item}`, "producer");
    triggerSync(); // Sync on manual action
  };

  const consume = () => {
    if (bufferRef.current.length === 0) {
      addLog("Consumer: Buffer Underflow! Sem_Wait...", "error");
      return;
    }
    const item = bufferRef.current[0];
    bufferRef.current = bufferRef.current.slice(1);
    setBuffer(bufferRef.current);
    addLog(`Thread-2: Consumed Item #${item}`, "consumer");
    triggerSync(); // Sync on manual action
  };

  // --- LOGIC: DINING PHILOSOPHERS ---
  const simulatePhilosophers = () => {
    setPhilosophers(prev => prev.map(p => {
      const rand = Math.random();
      if (p.state === 'thinking' && rand > 0.7) return { ...p, state: 'hungry' };
      if (p.state === 'hungry' && rand > 0.5) return { ...p, state: 'eating' };
      if (p.state === 'eating' && rand > 0.6) return { ...p, state: 'thinking' };
      return p;
    }));
  };

  useEffect(() => {
    let interval;
    if (isRunning) {
      triggerSync(); // Sync when auto-pilot starts
      interval = setInterval(() => {
        if (activeModule === 'producer-consumer') {
          Math.random() > 0.5 ? produce() : consume();
        } else {
          simulatePhilosophers();
        }
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isRunning, activeModule]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      
      {/* Dashboard Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 glass-panel p-8 border-cyan-500/10">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20 shadow-glow">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Activity Dashboard</h2>
            <div className="flex items-center gap-2">
                <p className="text-[10px] text-cyan-400/50 font-mono tracking-[0.3em]">Select Sync Scenario</p>
                {isSyncing && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[8px] text-amber-500 font-bold animate-pulse">
                        [ CLOUD UPLOAD ]
                    </motion.span>
                )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {['producer-consumer', 'philosophers'].map((mod) => (
            <button 
              key={mod}
              onClick={() => {setActiveModule(mod); setIsRunning(false);}}
              className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase ${activeModule === mod ? 'bg-cyan-500 text-black' : 'bg-white/5 text-slate-500 hover:text-white'}`}
            >
              {mod.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="glass-panel p-10 bg-slate-900/40 border-white/5 min-h-[400px] flex flex-col items-center justify-center relative">
            
            {activeModule === 'producer-consumer' ? (
              <div className="w-full space-y-12">
                 {/* Bounded Buffer Visual */}
                <div className="flex justify-center gap-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-16 h-20 border-2 border-dashed border-white/5 rounded-2xl flex items-center justify-center bg-black/20">
                      <AnimatePresence>
                        {buffer[i] !== undefined && (
                          <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}
                            className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-glow border border-white/20">
                            <Box size={20} className="text-slate-900" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-center gap-4">
                  <button onClick={produce} className="px-6 py-3 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-xl text-[10px] font-black uppercase hover:bg-cyan-500 hover:text-black transition-all">Manual Produce</button>
                  <button onClick={consume} className="px-6 py-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl text-[10px] font-black uppercase hover:bg-amber-500 hover:text-black transition-all">Manual Consume</button>
                </div>
              </div>
            ) : (
              <div className="relative w-80 h-80 flex items-center justify-center">
                <div className="absolute inset-0 border-4 border-dashed border-white/5 rounded-full" />
                {philosophers.map((p, i) => {
                  const angle = (i * 360) / 5;
                  return (
                    <motion.div 
                      key={p.id} 
                      className="absolute flex flex-col items-center gap-2"
                      style={{ transform: `rotate(${angle}deg) translateY(-120px) rotate(-${angle}deg)` }}
                    >
                      <div className={`h-12 w-12 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                        p.state === 'eating' ? 'bg-emerald-500 border-white shadow-[0_0_15px_#10b981]' : 
                        p.state === 'hungry' ? 'bg-rose-500 border-white animate-pulse' : 'bg-slate-900 border-white/20'
                      }`}>
                        <UserIcon size={20} className={p.state === 'thinking' ? 'text-slate-500' : 'text-white'} />
                      </div>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${p.state === 'eating' ? 'text-emerald-400' : 'text-white'}`}>{p.state}</span>
                    </motion.div>
                  );
                })}
                



              </div>
            )}
          </div>
        </div>

        {/* Real-time Interaction Console */}
        <div className="space-y-6">
          <div className="glass-panel p-6 bg-black/60 border-white/5 h-[300px] flex flex-col">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <TerminalIcon size={12} className="text-cyan-400" /> Kernel Output
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2 font-mono text-[10px] custom-scrollbar">
              {logs.map((log) => (
                <div key={log.id} className="p-2 rounded border border-white/5 bg-white/5 text-slate-400">
                  <span className="opacity-30 mr-2">{new Date().toLocaleTimeString([], { hour12: false })}</span>
                  {log.msg}
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => setIsRunning(!isRunning)}
            className={`w-full py-6 rounded-3xl flex flex-col items-center justify-center gap-2 transition-all duration-500 border ${
              isRunning ? 'bg-rose-500/20 border-rose-500 text-rose-500' : 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-glow hover:bg-cyan-500 hover:text-black'
            }`}
          >
            {isRunning ? <RotateCcw size={24}/> : <Play size={24} fill="currentColor"/>}
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{isRunning ? 'Terminate Simulation' : 'Initialize Auto-Pilot'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}