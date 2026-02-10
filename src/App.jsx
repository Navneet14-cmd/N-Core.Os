import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Layers, 
  ShieldAlert, 
  Terminal, 
  Activity, 
  Info, 
  RefreshCcw, 
  Trash2, 
  Download, 
  Zap,
  User,
  Cloud,
  CloudOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Firebase Imports
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Shadcn UI Components
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@/components/ui/context-menu";

// Lab Module Imports
import CPULab from './CPULab';
import MemoryLab from './MemoryLab';
import BankersLab from './BankersLab';
import ConcurrencyLab from './ConcurrencyLab';
import ShellLab from './ShellLab';
import ProfileLab from './ProfileLab';

export default function App() {
  const [activeTab, setActiveTab] = useState('cpu');
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- KERNEL AUTH LISTENER ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        console.log("Kernel: User Session Verified -", user.displayName);
      } else {
        setCurrentUser(null);
        console.log("Kernel: Operating in Guest Mode");
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const menu = [
    { id: 'cpu', name: 'CPU Scheduling', icon: <Cpu size={20}/> },
    { id: 'memory', name: 'Memory Management', icon: <Layers size={20}/> },
    { id: 'deadlock', name: 'Banker’s Algorithm', icon: <ShieldAlert size={20}/> },
    { id: 'concurrency', name: 'Concurrency Lab', icon: <Activity size={20}/> },
    { id: 'shell', name: 'Mini Shell', icon: <Terminal size={20}/> },
    { id: 'profile', name: 'System Profile', icon: <User size={20}/> },
  ];

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-cyan-500 font-mono text-xs animate-pulse uppercase tracking-[0.3em]">Booting Kernel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#020617] text-slate-200 font-sans overflow-hidden relative">
      
      {/* SIDEBAR: Cyber-Industrial Glass Panel */}
      <nav className="w-80 border-r border-white/5 p-8 flex flex-col gap-10 bg-black/40 backdrop-blur-3xl relative z-20">
        
        {/* Branding */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_15px_#22d3ee]" />
            <h1 className="text-2xl font-black text-white tracking-tighter italic">N-CORE.OS</h1>
          </div>
          <p className="text-[10px] font-mono text-cyan-400/50 pl-7 uppercase tracking-[0.3em]">Virtual Lab v1.0</p>
        </div>

        {/* --- CLOUD STATUS BADGE --- */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <img 
                src={currentUser.photoURL} 
                alt="User" 
                className="h-10 w-10 rounded-xl border border-cyan-500/50 object-cover" 
              />
              <div className="overflow-hidden">
                <p className="text-[10px] font-black text-white truncate uppercase">{currentUser.displayName}</p>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[8px] font-mono text-emerald-500 uppercase tracking-widest">Cloud Linked</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 opacity-50">
              <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 border border-white/5">
                <CloudOff size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Guest Mode</p>
                <p className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">Sync Disabled</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col gap-3">
          {menu.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center justify-between group px-5 py-4 rounded-2xl transition-all duration-500 border ${
                activeTab === item.id 
                ? 'bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.1)] text-cyan-400' 
                : 'text-slate-500 border-transparent hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className={activeTab === item.id ? 'text-cyan-400' : 'group-hover:text-cyan-400 transition-colors'}>
                  {item.icon}
                </span>
                <span className="text-sm font-bold tracking-wide">{item.name}</span>
              </div>
              {activeTab === item.id && (
                <motion.div layoutId="activeGlow" className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
              )}
            </button>
          ))}
        </div>

        {/* System Vitals Widget */}
        <div className="mt-auto p-6 bg-slate-900/40 border border-white/5 rounded-3xl backdrop-blur-2xl space-y-4">
          <div className="flex justify-between items-end text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <span>Kernel Load</span>
            <span className="text-cyan-400 font-mono">14.2%</span>
          </div>
          <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              animate={{ width: ["10%", "45%", "20%"] }} 
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="h-full bg-cyan-500 shadow-[0_0_10px_#22d3ee]" 
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
            <span className="flex items-center gap-2"><Info size={12}/> System Active</span>
            <span className="text-emerald-500">Stable</span>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto relative p-12 custom-scrollbar">
        
        {/* Visual Decoration */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 blur-[100px] rounded-full -ml-32 -mb-32 pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <ContextMenu>
            <ContextMenuTrigger className="block min-h-[85vh] w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  {/* Each component can now check auth.currentUser if needed */}
                  {activeTab === 'cpu' && <CPULab />}
                  {activeTab === 'memory' && <MemoryLab />}
                  {activeTab === 'deadlock' && <BankersLab />}
                  {activeTab === 'concurrency' && <ConcurrencyLab />}
                  {activeTab === 'shell' && <ShellLab />}
                  {activeTab === 'profile' && <ProfileLab currentUser={currentUser} />}
                </motion.div>
              </AnimatePresence>
            </ContextMenuTrigger>

            <ContextMenuContent className="w-64 bg-slate-900/90 border-white/10 backdrop-blur-xl rounded-xl text-slate-300 p-1.5 shadow-2xl z-[100]">
              <ContextMenuItem 
                onClick={() => window.location.reload()}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors cursor-pointer outline-none focus:bg-cyan-500/10 focus:text-cyan-400"
              >
                <RefreshCcw size={14} />
                <span className="text-xs font-bold uppercase tracking-wider">Restart System</span>
                <ContextMenuShortcut className="text-[10px] opacity-30 tracking-tighter">CTRL+R</ContextMenuShortcut>
              </ContextMenuItem>

              <ContextMenuItem className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors cursor-pointer outline-none focus:bg-cyan-500/10 focus:text-cyan-400">
                <Download size={14} />
                <span className="text-xs font-bold uppercase tracking-wider">Export Log</span>
              </ContextMenuItem>

              <ContextMenuSeparator className="bg-white/5 my-1" />

              <ContextMenuItem className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors cursor-pointer outline-none focus:bg-cyan-500/10 focus:text-cyan-400">
                <Zap size={14} />
                <span className="text-xs font-bold uppercase tracking-wider">Kernel Check</span>
              </ContextMenuItem>

              <ContextMenuSeparator className="bg-white/5 my-1" />

              <ContextMenuItem 
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer outline-none focus:bg-red-500/10 focus:text-red-400"
              >
                <Trash2 size={14} />
                <span className="text-xs font-bold uppercase tracking-wider text-red-400">Flush Memory</span>
                <ContextMenuShortcut className="text-[10px] opacity-30">DEL</ContextMenuShortcut>
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </div>
      </main>

      {/* Visual Polish: CRT Scanlines Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,255,0,0.06))] bg-[length:100%_4px,3px_100%]" />
    </div>
  );
}