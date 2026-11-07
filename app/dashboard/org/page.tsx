import React from 'react';

export default async function OrgDashboard() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 relative z-10">
      <div>
        <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">NONO BOSS derpa!</h1>
        <p className="text-muted-foreground font-mono text-xs uppercase tracking-wider">DERPA BOSSSSSS</p>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border/80 bg-card/30 backdrop-blur-md p-6">
          <p className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">Active Grant Budgets</p>
          <p className="text-2xl font-black font-mono mt-2 text-amber-400">$45,200.00</p>
        </div>
        <div className="rounded-xl border border-border/80 bg-card/30 backdrop-blur-md p-6">
          <p className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">Onboarded Reviewers</p>
          <p className="text-2xl font-black font-mono mt-2 text-primary">IDK!!Derpa!</p>
        </div>
      </div>
    </div>
  );
}
