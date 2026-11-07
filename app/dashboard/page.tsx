import React from 'react';
import Link from "next/link";
import { Terminal, Shield, Wrench, Coins, Plane } from 'lucide-react';

// Custom inline blueprint card overrides
const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`rounded-xl border bg-card/30 backdrop-blur-md text-card-foreground shadow-2xl border-border/80 hover:border-primary/20 transition-all duration-300 ${className}`}>
    {children}
  </div>
);

export default async function DashboardHome() {
  const firstName = "hacker";

  return (
    <div className="max-w-5xl mx-auto space-y-8 relative z-10">

      <div>
        <h1 className="text-3xl font-black tracking-tight text-foreground drop-shadow-[0_0_15px_rgba(var(--primary),0.2)]">
          Welcome back, {firstName} 
        </h1>
        <p className="text-muted-foreground mt-1 font-mono text-xs uppercase tracking-wider">
          Node Status: Active // Systems Synchronized
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <Card className="p-6">
          <div className="text-[10px] uppercase tracking-widest text-primary font-bold flex items-center gap-1.5">
            <Terminal size={12} /> Design hours
          </div>
          <div className="mt-2 text-3xl font-black text-foreground">0</div>
          <p className="text-[10px] text-muted-foreground/60 mt-1 uppercase">via Hackatime</p>
        </Card>

        <Card className="p-6">
          <div className="text-[10px] uppercase tracking-widest text-primary font-bold flex items-center gap-1.5">
            <Wrench size={12} /> Build hours
          </div>
          <div className="mt-2 text-3xl font-black text-foreground">0</div>
          <p className="text-[10px] text-muted-foreground/60 mt-1 uppercase">from journals</p>
        </Card>

        <Card className="p-6">
          <div className="text-[10px] uppercase tracking-widest text-primary font-bold flex items-center gap-1.5">
            <Shield size={12} /> Projects
          </div>
          <div className="mt-2 text-3xl font-black text-foreground">0</div>
          <p className="text-[10px] text-muted-foreground/60 mt-1 uppercase">shipped</p>
        </Card>

        <Card className="p-6">
          <div className="text-[10px] uppercase tracking-widest text-primary font-bold flex items-center gap-1.5">
            <Coins size={12} /> Coins
          </div>
          <div className="mt-2 text-3xl font-black text-foreground">0</div>
          <p className="text-[10px] text-muted-foreground/60 mt-1 uppercase">shop allocation</p>
        </Card>
      </div>

      {/* 🛠️ Action Links Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-primary font-mono flex items-center gap-2">
          <Plane size={14} /> System Initializations
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/dashboard/projects">
            <Card className="p-6 border-dashed border-border/60 hover:border-primary/50 transition-all duration-300 block">
              <div className="text-2xl drop-shadow-[0_0_8px_rgba(var(--primary),0.3)]">🛩️</div>
              <h3 className="mt-2 font-bold text-foreground uppercase tracking-wide text-sm">Start a project</h3>
              <p className="mt-1 text-xs text-muted-foreground font-sans">
                Deploy a new custom project workspace onto the platform grid ledger.
              </p>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
