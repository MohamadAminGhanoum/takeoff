import React from 'react';
import Link from 'next/link';
import { Home, ClipboardList, Shield, ShieldAlert, Terminal } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      
      <aside className="w-64 bg-slate-900/60 border-r border-slate-800 backdrop-blur-xl flex flex-col justify-between shrink-0">
        <div className="p-6">
          <Link href="/dashboard" className="text-lg font-black tracking-wider text-sky-400 flex items-center gap-2">
            TAKEOFF RUNWAY!!! YAWR!
          </Link>
          
          <nav className="mt-8 space-y-2 font-mono text-xs">
            <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition">
              <Home size={16} /> OVERVIEW
            </Link>
            <Link href="/dashboard/reviewer" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition">
              <ClipboardList size={16} /> REVIEWER DASH
            </Link>
            <Link href="/dashboard/org" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition">
              <ShieldAlert size={16} /> ORG DASH
            </Link>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800/60 text-[10px] font-mono tracking-widest text-slate-500 text-center uppercase flex items-center justify-center gap-1">
          <Terminal size={10} /> derpa v1 idk?? COFFEE DATASHEETS!!
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 bg-slate-950 relative">
        {children}
      </main>
    </div>
  );
}
