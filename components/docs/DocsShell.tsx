"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Menu,
  Plane,
  Search,
  X,
} from "lucide-react";
import {
  DOC_PAGES,
  DOC_SECTIONS,
  getDocBySlug,
  getHeadings,
} from "@/lib/docs/content";

export default function DocsShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const currentSlug =
    pathname === "/docs" || pathname === "/docs/"
      ? "flight-briefing"
      : pathname.replace(/^\/docs\/?/, "").split("/")[0];

  const activePage = useMemo(() => getDocBySlug(currentSlug), [currentSlug]);
  const headings = useMemo(() => getHeadings(activePage), [activePage]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((open) => !open);
      } else if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DOC_PAGES;
    return DOC_PAGES.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        getHeadings(p).some((h) => h.text.toLowerCase().includes(q))
    );
  }, [query]);

  const toggleSection = (id: string) =>
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  const navContent = (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-800/80 p-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-xs text-slate-400 transition-colors hover:text-sky-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Runway
        </Link>

        <div className="mt-3 flex items-center gap-2 text-base font-bold tracking-wide text-white">
          <Plane className="h-4 w-4 text-sky-400" />
          TAKEOFF MANUAL
        </div>

        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="mt-3 flex w-full items-center justify-between rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-slate-400 transition-colors hover:border-sky-500/50 hover:text-slate-200"
        >
          <span className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5" />
            Search docs...
          </span>
          <kbd className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
            Ctrl K
          </kbd>
        </button>
      </div>

      <nav className="flex-1 space-y-3 overflow-y-auto p-4">
        {DOC_SECTIONS.map((sec) => {
          const pages = DOC_PAGES.filter((p) => p.section === sec.id);
          const isCollapsed = !!collapsed[sec.id];

          return (
            <div key={sec.id}>
              <button
                type="button"
                onClick={() => toggleSection(sec.id)}
                className="flex w-full items-center justify-between py-1 font-mono text-[11px] uppercase tracking-wider text-slate-400 hover:text-sky-300"
              >
                <span className="flex items-center gap-1.5">
                  {isCollapsed ? (
                    <ChevronRight className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                  {sec.code} · {sec.label}
                </span>
                <span className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[10px] text-slate-400">
                  {pages.length}
                </span>
              </button>

              {!isCollapsed && (
                <ul className="mt-1 space-y-0.5 border-l border-slate-800 pl-3 ml-1.5">
                  {pages.map((p) => {
                    const href =
                      p.slug === "flight-briefing" ? "/docs" : `/docs/${p.slug}`;
                    const isActive = activePage.slug === p.slug;
                    return (
                      <li key={p.slug}>
                        <Link
                          href={href}
                          onClick={() => setMobileOpen(false)}
                          className={`block rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                            isActive
                              ? "bg-sky-500/15 font-medium text-sky-300"
                              : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
                          }`}
                        >
                          {p.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div className="blueprint-grid-canvas min-h-screen text-slate-100">
      {/* Mobile Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-4 py-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-200"
        >
          <Menu className="h-5 w-5 text-sky-400" />
          Flight Manual
        </button>
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-300"
        >
          <Search className="h-4 w-4" />
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/70"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-50 h-full w-72 border-r border-slate-800 bg-slate-950">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
              className="absolute top-3 right-3 rounded p-1 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            {navContent}
          </aside>
        </div>
      )}

      {/* 3-Column Desktop Layout */}
      <div className="mx-auto flex max-w-7xl">
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-slate-800/80 bg-slate-950/70 backdrop-blur lg:block">
          {navContent}
        </aside>

        <main className="min-w-0 flex-1 px-6 py-10 sm:px-10 lg:py-12">
          {children}
        </main>

        {/* Right Table of Contents */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 px-5 py-12 xl:block">
          <div className="font-mono text-[11px] uppercase tracking-widest text-slate-500">
            On this page
          </div>
          <ul className="mt-3 space-y-2 border-l border-slate-800 pl-3 text-xs">
            {headings.map((h) => (
              <li key={h.id}>
                <a
                  href={`#${h.id}`}
                  className="block text-slate-400 transition-colors hover:text-sky-300"
                >
                  {h.text}
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-8 rounded-lg border border-slate-800 bg-slate-900/60 p-3.5 text-xs">
            <div className="font-mono text-[10px] uppercase tracking-widest text-sky-400">
              ATC HELP DESK
            </div>
            <p className="mt-1.5 text-slate-400">
              Stuck on CAD, KiCad, or eligibility? Ask in{" "}
              <span className="text-slate-200">#takeoff-help</span>.
            </p>
          </div>
        </aside>
      </div>

      {/* Ctrl+K Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 px-4 pt-24 backdrop-blur-sm">
          <div
            className="fixed inset-0"
            onClick={() => setSearchOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3">
              <Search className="h-4 w-4 text-sky-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search flight manual..."
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="rounded px-1.5 py-0.5 font-mono text-[10px] text-slate-400 hover:bg-slate-800"
              >
                ESC
              </button>
            </div>
            <ul className="max-h-80 overflow-y-auto p-2">
              {searchResults.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-slate-500">
                  No matching pages found.
                </li>
              ) : (
                searchResults.map((p) => {
                  const href =
                    p.slug === "flight-briefing" ? "/docs" : `/docs/${p.slug}`;
                  return (
                    <li key={p.slug}>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchOpen(false);
                          setQuery("");
                          router.push(href);
                        }}
                        className="w-full rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-slate-900"
                      >
                        <div className="text-sm font-medium text-sky-300">
                          {p.title}
                        </div>
                        <div className="mt-0.5 line-clamp-1 text-xs text-slate-400">
                          {p.description}
                        </div>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}