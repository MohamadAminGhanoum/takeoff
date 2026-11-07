import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Check, ShieldAlert, Clock, User, Code2, Link2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { updateShipStatus } from "./actions";
import { getRoles } from "@/lib/roles";

import type { Project, ShipStatus } from "@/lib/sidekick/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function fetchSingleProject(id: string): Promise<Project | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

  try {
    const res = await fetch(`${baseUrl}/api/sidekick`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SIDEKICK_SECRET}`,
      },
      body: JSON.stringify({ action: "GET_PROJECT_BY_ID", input: { id } }),
      next: { revalidate: 0 }
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error(`[Production Detail Fetch Error] Failed for project ${id}:`, error);
    return null;
  }
}

function safeUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export default async function SubmissionDetailPage({ params }: PageProps) {
  const { id } = await params;

  const { session, isReviewer } = await getRoles();
  if (!session) redirect(`/login?callbackUrl=/dashboard/${encodeURIComponent(id)}`);

  const project = await fetchSingleProject(id);
  if (!project) notFound();

  const me = [session.user.id, session.user.slack_id, session.user.email]
    .filter((v): v is string => !!v)
    .map((v) => v.toLowerCase());
  const isOwner = me.includes(String(project.authorId ?? "").toLowerCase());

  if (!isOwner && !isReviewer) notFound();

  const canDecide = isReviewer && !isOwner;

  const currentStatus: ShipStatus = project.ships && project.ships.length > 0
    ? project.ships[project.ships.length - 1].status
    : "pending";

  const codeUrl = safeUrl(project.codeUrl);
  const demoUrl = safeUrl(project.demoUrl);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition">
        <ArrowLeft size={16} /> Back to Control Center
      </Link>

      <div className="grid gap-6 md:grid-cols-3">
        <div className={canDecide ? "md:col-span-2 space-y-6" : "md:col-span-3 space-y-6"}>
          <Card className="bg-white shadow-sm border border-slate-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase bg-slate-100 text-slate-600 px-2 py-1 rounded border">
                  Project ID: {project.id}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border uppercase flex items-center gap-1 ${
                  currentStatus === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  currentStatus === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                  'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  <Clock size={12} /> {currentStatus.replace('_', ' ')}
                </span>
              </div>
              <CardTitle className="text-2xl font-bold mt-4">{project.title}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                <User size={14} /> Author ID: {project.authorId}
              </div>
            </CardHeader>

            <CardContent className="space-y-6 border-t border-slate-100 pt-6">
              <div>
                <h3 className="font-semibold text-sm text-slate-900 mb-2 flex items-center gap-2">
                  <Code2 size={16} /> Project Description
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100 whitespace-pre-wrap">
                  {project.description || "No description provided."}
                </p>
              </div>

              {/* URL resource blocks */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                  <Link2 size={16} /> Submission Context Links
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {codeUrl && (
                    <a href={codeUrl} target="_blank" rel="noopener noreferrer" className="p-3 border rounded-lg text-sm bg-white hover:bg-slate-50 text-blue-600 font-medium truncate block">
                      📦 Source Code Repository
                    </a>
                  )}
                  {demoUrl && (
                    <a href={demoUrl} target="_blank" rel="noopener noreferrer" className="p-3 border rounded-lg text-sm bg-white hover:bg-slate-50 text-emerald-600 font-medium truncate block">
                      🌐 Live Project Demo
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {canDecide && (
          <div className="space-y-6">
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  Fulfillment Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-slate-500 mb-4">
                  Review code layout constraints before executing approval webhooks.
                </p>

                {/* Approval Form Hook */}
                <form action={async () => {
                  "use server";
                  await updateShipStatus(project.id, "approved");
                }}>
                  <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-sm transition">
                    <Check size={16} /> Approve & Ship Grant
                  </button>
                </form>

                {/* Decline Form Hook */}
                <form action={async () => {
                  "use server";
                  await updateShipStatus(project.id, "rejected");
                }}>
                  <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 border-rose-200 bg-white transition">
                    <ShieldAlert size={16} /> Decline Request
                  </button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}