import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Cpu, HardDrive, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ShellLab() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([
    { type: 'output', content: 'ResQ OS [Version 1.0.42]' },
    { type: 'output', content: 'Type "help" to see available system calls.' },
  ]);
  const [processes, setProcesses] = useState([{ pid: 101, name: 'init', ppid: 0 }]);
  const scrollRef = useRef(null);

  // Auto-scroll terminal
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history]);

  const executeCommand = (e) => {
    if (e.key !== 'Enter') return;

    const cmd = input.trim().toLowerCase();
    const newHistory = [...history, { type: 'input', content: `root@vlab:~# ${input}` }];

    switch (cmd) {
      case 'help':
        newHistory.push({ type: 'output', content: 'Available: ls, fork, ps, clear, whoami' });
        break;
      case 'ls':
        newHistory.push({ type: 'output', content: 'bin/  boot/  dev/  etc/  home/  proc/  root/' });
        break;
      case 'whoami':
        newHistory.push({ type: 'output', content: 'root (System Administrator)' });
        break;
      case 'ps':
        newHistory.push({ type: 'output', content: 'PID\tPPID\tCMD' });
        processes.forEach(p => {
          newHistory.push({ type: 'output', content: `${p.pid}\t${p.ppid}\t${p.name}` });
        });
        break;
      case 'fork':
        const lastPid = processes[processes.length - 1].pid;
        const newPid = lastPid + Math.floor(Math.random() * 10) + 1;
        setProcesses([...processes, { pid: newPid, name: 'child_proc', ppid: 101 }]);
        newHistory.push({ type: 'output', content: `[SYSCALL] fork() successful. New Child PID: ${newPid}` });
        break;
      case 'clear':
        setHistory([]);
        setInput("");
        return;
      default:
        newHistory.push({ type: 'output', content: `sh: command not found: ${cmd}` });
    }

    setHistory(newHistory);
    setInput("");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div>
        <h2 className="text-4xl font-black text-white mb-2 uppercase italic tracking-tighter">Mini Shell</h2>
        <p className="text-slate-400 font-mono text-xs text-sys-accent tracking-[0.2em]">Visual Process & Command Emulator</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[60vh]">
        {/* Terminal Window */}
        <div className="lg:col-span-2 glass-card bg-black/80 flex flex-col overflow-hidden border-slate-700 shadow-2xl">
          <div className="bg-slate-800/50 p-3 flex items-center gap-2 border-b border-slate-700">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-amber-500/50" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
            </div>
            <span className="text-[10px] font-mono text-slate-500 ml-4 tracking-widest uppercase">bash — 80x24</span>
          </div>

          <div ref={scrollRef} className="flex-1 p-6 font-mono text-sm overflow-y-auto space-y-1">
            {history.map((line, i) => (
              <div key={i} className={line.type === 'input' ? 'text-sys-accent mt-2' : 'text-slate-400'}>
                {line.content}
              </div>
            ))}
            <div className="flex items-center gap-2 text-sys-accent pt-2">
              <span>root@vlab:~#</span>
              <input 
                autoFocus
                className="flex-1 bg-transparent outline-none border-none text-white caret-sys-accent"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={executeCommand}
              />
            </div>
          </div>
        </div>

        {/* Process Visualizer Sidebar */}
        <div className="glass-card p-6 flex flex-col">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Cpu size={14} className="text-sys-accent" /> Active Process Tree
          </h3>
          
          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            <AnimatePresence>
              {processes.map((p) => (
                <motion.div 
                  key={p.pid}
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className={`p-3 rounded-lg border flex items-center justify-between ${p.ppid === 0 ? 'bg-sys-accent/10 border-sys-accent/30' : 'bg-slate-900 border-slate-800 ml-6'}`}
                >
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">PID: {p.pid}</p>
                    <p className="text-xs font-mono text-white">{p.name}</p>
                  </div>
                  <div className="text-[10px] font-mono text-slate-600">PPID: {p.ppid}</div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <p className="text-[10px] text-slate-500 italic leading-relaxed">
              * Hint: Typing <span className="text-sys-accent font-bold">fork</span> simulates the process creation system call.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}