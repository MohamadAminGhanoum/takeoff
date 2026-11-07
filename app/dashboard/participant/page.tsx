import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default async function ParticipantDashboard() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 relative z-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">NONO BOSS derpa!</h1>
          <p className="text-muted-foreground font-mono text-xs uppercase tracking-wider">Track your ongoing project ships and hardware grants</p>
        </div>
        <Link href="/dashboard/participant/submit" className="flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 text-xs font-mono font-bold rounded-lg uppercase tracking-wider transition">
          <Plus size={14} /> Ship New Project
        </Link>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/20 backdrop-blur-md p-12 text-center text-xs font-mono tracking-wide text-muted-foreground/60 uppercase">
        No active personal submissions found // deploy your first node above
      </div>
    </div>
  );
}
