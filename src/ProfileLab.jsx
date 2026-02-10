import React, { useState, useEffect } from 'react';
import { Shield, Zap, Target, Award, Clock, LogIn, LogOut, Cloud } from 'lucide-react';
import { motion } from 'framer-motion';
import ProfileCard from './ProfileCard';

// Firebase Imports
import { auth, googleProvider, db } from './lib/firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export default function ProfileLab({ currentUser }) {
  const [cloudData, setCloudData] = useState(null);

  // --- REAL-TIME DATABASE LISTENER ---
  useEffect(() => {
    if (!currentUser) {
      setCloudData(null);
      return;
    }

    const userRef = doc(db, "users", currentUser.uid);
    
    // Listen for changes in Firestore and update UI instantly
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setCloudData(docSnap.data());
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  // --- LOGIN LOGIC ---
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      // Create document if new user
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          displayName: user.displayName,
          level: "Alpha-9",
          stats: { cpu: 0, memory: 0, deadlock: 0, shell: 0, concurrency: 0 },
          analytics: { uptime: 0, tasks: 0 },
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Kernel Auth Error:", error);
    }
  };

  const handleLogout = () => signOut(auth);

  // Dynamic Stats from Cloud or Defaults
  const stats = [
    { label: 'CPU Lab', progress: cloudData?.stats?.cpu || 0, color: 'bg-cyan-500', icon: <Zap size={14}/> },
    { label: 'Memory Lab', progress: cloudData?.stats?.memory || 0, color: 'bg-purple-500', icon: <Target size={14}/> },
    { label: 'Deadlock Lab', progress: cloudData?.stats?.deadlock || 0, color: 'bg-emerald-500', icon: <Shield size={14}/> },
    { label: 'Concurrency Lab', progress: cloudData?.stats?.concurrency || 0, color: 'bg-amber-500', icon: <Award size={14}/> },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-700 max-w-6xl mx-auto pb-20">
      
      {/* --- CLOUD HEADER --- */}
      <div className="flex flex-col xl:flex-row gap-12 items-center p-10 glass-panel border-cyan-500/10 relative overflow-hidden bg-slate-900/20">
        <div className="absolute top-0 left-0 w-64 h-64 bg-cyan-500/5 blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 shrink-0">
          <ProfileCard
            name={currentUser ? currentUser.displayName : "Guest Admin"}
            title={currentUser ? "Verified Architect" : "Guest Mode"}
            handle={currentUser ? currentUser.email.split('@')[0] : "vcore_guest"}
            status={currentUser ? "Online" : "Offline"}
            contactText={currentUser ? "Log Out" : "Link Google"}
            avatarUrl={currentUser ? currentUser.photoURL : "https://api.dicebear.com/7.x/bottts/svg?seed=Guest&backgroundColor=020617"} 
            onContactClick={currentUser ? handleLogout : handleLogin}
            showUserInfo={true}
            enableTilt={true}
            behindGlowEnabled={true}
            behindGlowColor={currentUser ? "rgba(34, 211, 238, 0.4)" : "rgba(100, 116, 139, 0.4)"}
            innerGradient="linear-gradient(145deg, #0f172a 0%, #1e293b 100%)"
          />
        </div>

        <div className="flex-1 space-y-6 text-center xl:text-left">
          <div className="space-y-2">
            <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
              {currentUser ? "Identity" : "Guest" } <span className="text-cyan-500">{currentUser ? "Verified" : "Access" }</span>
            </h2>
            <p className="terminal-text text-lg flex items-center justify-center xl:justify-start gap-3">
              <Cloud size={22} className={currentUser ? "text-cyan-400" : "text-slate-500"} /> 
              {currentUser ? "SYNCING TO N-CORE CLOUD" : "LOCAL CACHE ONLY"}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-1">Authorization</p>
              <p className="text-sm font-bold text-slate-200">{currentUser ? "ALPHA-9 (Level 4)" : "GUEST (Level 0)"}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-1">Last Sync</p>
              <p className="text-sm font-bold text-slate-200">{currentUser ? "Live Now" : "Never"}</p>
            </div>
          </div>
          
          {!currentUser && (
            <button 
              onClick={handleLogin}
              className="flex items-center gap-3 bg-cyan-500 text-black px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-glow hover:scale-105 transition-all mx-auto xl:mx-0"
            >
              <LogIn size={18} /> Authenticate with Google
            </button>
          )}
        </div>
      </div>

      {/* --- STATS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Module Progress Section */}
        <div className="glass-panel p-8 space-y-6 bg-slate-900/40 border-white/5">
          <h3 className="terminal-text text-xs uppercase tracking-widest flex items-center gap-2">
            <Award size={14} className="text-cyan-400" /> Cloud Mastery Log
          </h3>
          <div className="space-y-6">
            {stats.map((stat, i) => (
              <div key={i} className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <span className="flex items-center gap-2">{stat.icon} {stat.label}</span>
                  <span className="text-cyan-400 font-mono">{stat.progress}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.progress}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={`h-full ${stat.color} shadow-[0_0_15px_rgba(34,211,238,0.3)]`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Activity Section */}
        <div className="glass-panel p-8 relative overflow-hidden group bg-slate-900/40 border-white/5">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
            <Clock size={150} />
          </div>
          
          <h3 className="terminal-text text-xs uppercase tracking-widest mb-8 flex items-center gap-2">
             <Zap size={14} className="text-cyan-400" /> Persistent Analytics
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="p-5 bg-white/5 rounded-3xl border border-white/5 space-y-2">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Uptime Index</p>
              <p className="text-3xl font-black text-white font-mono leading-none">
                {cloudData?.analytics?.uptime || 0}<small className="text-xs text-slate-600 ml-1">HRS</small>
              </p>
            </div>
            <div className="p-5 bg-white/5 rounded-3xl border border-white/5 space-y-2">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Global Tasks</p>
              <p className="text-3xl font-black text-white font-mono leading-none">
                {cloudData?.analytics?.tasks || 0}
              </p>
            </div>
            {/* Added dynamic status messages */}
            <div className="col-span-2 p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl flex items-center justify-between">
              <p className="text-[10px] font-bold text-cyan-400 uppercase">Cloud Sync Status</p>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${currentUser ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                <span className="text-[10px] text-white font-mono">{currentUser ? 'ACTIVE' : 'IDLE'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}