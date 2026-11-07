import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Check, ShieldAlert, Clock, User, Code2, Link2, Eye } from 'lucide-react';
import { NextRequest } from "next/server";


import { POST as sidekickBackendEngine } from "@/lib/sidekick/route";
import { updateShipStatus } from "../../[id]/actions";
import type { Project, ShipStatus } from "@/lib/sidekick/types";
import CheckPanel from "@/components/checker/CheckPanel";
import { aiConfigured } from "@/lib/checker/ai";
import { loadLastCheck } from "@/lib/checker/service";

interface PageProps {
  params: Promise<{ id: string }>;
}

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`rounded-xl border bg-card/30 backdrop-blur-md text-card-foreground shadow-2xl border-border/80 hover:border-primary/20 transition-all duration-300 ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <h3 className={`font-semibold leading-none tracking-tight text-foreground ${className}`}>{children}</h3>
);

const CardContent = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

async function fetchSingleProject(id: string): Promise<Project | null> {
  try {
    const mockReq = new NextRequest("http://localhost:3000/api/sidekick", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SIDEKICK_SECRET || ''}`,
      },
      body: JSON.stringify({ action: "GET_PROJECT_BY_ID", input: { id } }),
    });

    const responseStream = await sidekickBackendEngine(mockReq);
    if (!responseStream.ok) return null;
    return await responseStream.json();
  } catch (error) {
    console.error(`[Reviewer Engine Detail Fetch Error] Project node validation broken for ${id}:`, error);
    return null;
  }
}

export default async function ReviewerWorkstationPage({ params }: PageProps) {
  const { id } = await params; 
  const project = await fetchSingleProject(id);

  if (!project) {
    notFound();
  }

  const currentStatus: ShipStatus = project.ships && project.ships.length > 0 
    ? project.ships[project.ships.length - 1].status 
    : "pending";

  const lastCheck = await loadLastCheck(project.id);
  const lastShip = project.ships?.[project.ships.length - 1];

  return (
    <div className="max-w-5xl mx-auto space-y-6 relative z-10">
      {/* 🚀 FIXED BREADCRUMB IMPORTS LINKING BACK TO REVIEWER LOG */}
      <Link href="/dashboard/reviewer" className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors duration-150">
        <ArrowLeft size={14} /> Back to Evaluation Audit Log
      </Link>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content Workspace Column */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase bg-card/40 text-muted-foreground px-2 py-1 rounded border border-border/40">
                  REF_NODE: {project.id.slice(0, 12)}
                </span>
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider border uppercase flex items-center gap-1 ${
                  currentStatus === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                  currentStatus === 'rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                  'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  <Clock size={12} /> {currentStatus.replace('_', ' ')}
                </span>
              </div>
              <CardTitle className="text-2xl font-black text-foreground mt-4">{project.title}</CardTitle>
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mt-1">
                <User size={12} className="text-primary/70" /> AUTHOR ID reference: {project.authorId}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6 border-t border-border/30 pt-6">
              <div>
                <h3 className="font-bold text-sm text-foreground mb-2 flex items-center gap-2 font-mono uppercase tracking-wider">
                  <Code2 size={16} className="text-primary" /> Submission Specs
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed bg-background/30 p-4 rounded-lg border border-border/40 whitespace-pre-wrap font-sans">
                  {project.description || "No project specs provided by author."}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2 font-mono uppercase tracking-wider">
                  <Link2 size={16} className="text-primary" /> Core Artifact Links
                </h3>
                <div className="grid gap-2 sm:grid-cols-2 font-mono text-xs">
                  <a href={project.codeUrl} target="_blank" rel="noopener noreferrer" className="p-3 border border-border/50 rounded-lg bg-card/20 hover:bg-primary/5 text-primary font-bold truncate block transition-all duration-150">
                    📦 SOURCE REPOSITORY
                  </a>
                  {project.demoUrl && (
                    <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="p-3 border border-border/50 rounded-lg bg-card/20 hover:bg-primary/5 text-emerald-400 font-bold truncate block transition-all duration-150">
                      🌐 DEPLOYED LIVE DEMO
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <CheckPanel
            initial={lastCheck}
            aiAvailable={aiConfigured()}
            defaults={{
              repoUrl: project.codeUrl,
              description: project.description,
              hours: lastShip?.hoursSubmitted,
              projectId: project.id,
            }}
          />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Eye size={14} className="text-primary" /> Auditor Control
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs font-mono text-muted-foreground/80 leading-relaxed mb-2">
                Confirm codebase parameters are verified against compliance rule trees before committing transaction states.
              </p>

              <form action={async () => {
                "use server";
                await updateShipStatus(project.id, "approved");
              }}>
                <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-mono font-bold tracking-wider uppercase shadow-sm border border-emerald-500/20 transition-all duration-150">
                  <Check size={14} /> Approve & Ship Ship
                </button>
              </form>

              <form action={async () => {
                "use server";
                await updateShipStatus(project.id, "rejected");
              }}>
                <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-rose-500/30 bg-background/20 hover:bg-rose-500/10 text-rose-400 rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-all duration-150">
                  <ShieldAlert size={14} /> Decline Node
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
