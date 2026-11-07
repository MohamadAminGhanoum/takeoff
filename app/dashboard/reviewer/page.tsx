import React from 'react';
import Link from 'next/link';
import { NextRequest } from "next/server";
import { ArrowRight, Clock, CheckCircle2, ShieldAlert, Search, SlidersHorizontal, Filter } from 'lucide-react';

import { POST as sidekickBackendEngine } from "@/lib/sidekick/route";
import type { Project, ShipStatus } from "@/lib/sidekick/types";

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`rounded-xl border bg-card/30 backdrop-blur-md text-card-foreground shadow-2xl border-border/80 hover:border-primary/20 transition-all duration-300 ${className}`}>
    {children}
  </div>
);

async function fetchReviewerProjects(): Promise<Project[]> {
  try {
    const mockReq = new NextRequest("http://localhost:3000/api/sidekick", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SIDEKICK_SECRET || ''}`,
      },
      body: JSON.stringify({ action: "GET_ALL_PROJECTS" }),
    });

    const responseStream = await sidekickBackendEngine(mockReq);
    if (!responseStream.ok) throw new Error(`Sidekick Engine status: ${responseStream.status}`);
    
    const data = await responseStream.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[Reviewer Queue Fetch Error] Failed to grab workspace entries:', error);
    return [];
  }
}

interface PageProps {
  searchParams: Promise<{ query?: string; queue?: string }>;
}

export default async function ReviewerDashboardPage({ searchParams }: PageProps) {
  const projects = await fetchReviewerProjects();
  const { query = "", queue = "pending" } = await searchParams;

  const getProjectStatus = (project: Project): ShipStatus => {
    if (!project.ships || project.ships.length === 0) return "pending";
    return project.ships[project.ships.length - 1].status;
  };

  const actionablePending = projects.filter(p => getProjectStatus(p) === "pending" || getProjectStatus(p) === "pending_hq").length;
  const completedApprovals = projects.filter(p => getProjectStatus(p) === "approved").length;

  const auditedQueue = projects.filter((project) => {
    const status = getProjectStatus(project);
    
    const matchesSearch = 
      project.title.toLowerCase().includes(query.toLowerCase()) ||
      project.id.toLowerCase().includes(query.toLowerCase()) ||
      project.authorId.toLowerCase().includes(query.toLowerCase());

    const matchesQueue = 
      queue === "all" ||
      (queue === "pending" && (status === "pending" || status === "pending_hq")) ||
      status === queue;

    return matchesSearch && matchesQueue;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 relative z-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
            <Filter size={24} className="text-primary" /> Evaluation Audit Log
          </h1>
          <p className="text-muted-foreground font-mono text-xs uppercase tracking-wider mt-0.5">
           Hi!
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Actionable Queue Node</p>
            <Clock className="h-4 w-4 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]" />
          </div>
          <div className="text-3xl font-black text-foreground font-mono mt-2">{actionablePending} Open Submissions</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">My Audits Finalized</p>
            <CheckCircle2 className="h-4 w-4 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]" />
          </div>
          <div className="text-3xl font-black text-foreground font-mono mt-2">{completedApprovals} Processed</div>
        </Card>
      </div>

      <Card className="p-4 bg-card/10 border-border/40 flex flex-col md:flex-row gap-4 items-center justify-between">
        <form method="GET" className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
          <input 
            type="text"
            name="query"
            defaultValue={query}
            placeholder="SCAN TARGET PROJECT REF OR TITLE..." 
            className="w-full bg-background/40 border border-border/60 rounded-lg pl-9 pr-4 py-2 text-xs font-mono tracking-wide text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition duration-150 uppercase"
          />
          <input type="hidden" name="queue" value={queue} />
        </form>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <SlidersHorizontal size={14} className="text-muted-foreground/40 mr-1 hidden md:block" />
          {[
            { label: "PENDING AUDITS", value: "pending" },
            { label: "APPROVED SHIPS", value: "approved" },
            { label: "REJECTED LIST", value: "rejected" },
            { label: "ALL METRICS", value: "all" }
          ].map((btn) => (
            <Link
              key={btn.value}
              href={`/dashboard/reviewer?query=${query}&queue=${btn.value}`}
              className={`px-3 py-1.5 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase border transition-all duration-200 ${
                queue === btn.value 
                  ? "bg-primary/20 text-primary border-primary/50 shadow-[0_0_12px_rgba(var(--primary),0.15)]"
                  : "bg-background/20 border-border/40 text-muted-foreground hover:text-foreground hover:border-border/80"
              }`}
            >
              {btn.label}
            </Link>
          ))}
        </div>
      </Card>

      <div className="bg-card/20 backdrop-blur-md rounded-xl border border-border/60 shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-border/40 bg-card/30 flex justify-between items-center">
          <h2 className="text-md font-bold tracking-wide text-foreground">Assigned Audit Queue</h2>
          <span className="text-[10px] font-mono text-muted-foreground/60 uppercase">
            {auditedQueue.length} Active Node Vectors Listed
          </span>
        </div>
        <div className="divide-y divide-border/30">
          {auditedQueue.length === 0 ? (
            <div className="p-12 text-center text-xs font-mono tracking-wider text-muted-foreground/60 uppercase">
              No pending logs assigned to this node instance // pipeline clear
            </div>
          ) : (
            auditedQueue.map((project) => {
              const currentStatus = getProjectStatus(project);
              const totalHours = project.ships?.[0]?.hoursSubmitted || 0;

              return (
                <div key={project.id} className="p-4 flex items-center justify-between hover:bg-primary/5 border-l-2 border-l-transparent hover:border-l-primary/40 transition-all duration-200">
                  <div className="space-y-1">
                    {/* Fixed to point cleanly to your custom nested role workspace */}
                    <Link href={`/dashboard/reviewer/${project.id}`} className="font-bold text-foreground hover:text-primary transition-colors duration-150">
                      {project.title}
                    </Link>
                    <div className="flex gap-2 text-xs font-mono text-muted-foreground">
                      <span>PROJECT_NODE: {project.id.slice(0, 8)}</span>
                      <span>•</span>
                      <span className="text-primary/80">{totalHours} Hours Pending</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider border uppercase ${
                      currentStatus === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                      currentStatus === 'rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {currentStatus.replace('_', ' ')}
                    </span>
                    <Link href={`/dashboard/reviewer/${project.id}`} className="text-muted-foreground hover:text-primary transition-colors duration-150">
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
