"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckSquare,
  Info,
  Radio,
  Square,
} from "lucide-react";
import { DocBlock, DocPage, DOC_SECTIONS, getPrevNext } from "@/lib/docs/content";

function ChecklistBlock({
  title,
  items,
}: {
  title?: string;
  items: string[];
}) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const toggle = (idx: number) =>
    setChecked((prev) => ({ ...prev, [idx]: !prev[idx] }));

  return (
    <div className="my-6 rounded-xl border border-sky-500/25 bg-slate-900/70 p-5">
      {title && (
        <div className="mb-3 font-mono text-xs uppercase tracking-widest text-sky-300">
          {title}
        </div>
      )}
      <ul className="space-y-2.5">
        {items.map((item, idx) => {
          const isDone = !!checked[idx];
          return (
            <li key={item}>
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="flex w-full items-start gap-3 text-left text-sm transition-colors hover:text-white"
              >
                {isDone ? (
                  <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <Square className="mt-0.5 h-4 w-4 shrink-0 text-sky-400/70" />
                )}
                <span
                  className={
                    isDone ? "text-slate-500 line-through" : "text-slate-200"
                  }
                >
                  {item}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function renderBlock(block: DocBlock, idx: number) {
  switch (block.type) {
    case "h2":
      return (
        <h2
          key={idx}
          id={block.id}
          className="mt-10 mb-3 scroll-mt-24 border-b border-slate-800 pb-2 text-2xl font-bold text-sky-200"
        >
          {block.text}
        </h2>
      );

    case "h3":
      return (
        <h3
          key={idx}
          id={block.id}
          className="mt-7 mb-2 scroll-mt-24 text-lg font-semibold text-sky-300"
        >
          {block.text}
        </h3>
      );

    case "p":
      return (
        <p key={idx} className="my-4 leading-relaxed text-slate-300">
          {block.text}
        </p>
      );

    case "ul":
      return (
        <ul key={idx} className="my-4 space-y-2 pl-5 list-disc text-slate-300">
          {block.items.map((item) => (
            <li key={item} className="leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      );

    case "checklist":
      return (
        <ChecklistBlock key={idx} title={block.title} items={block.items} />
      );

    case "callout": {
      const styles = {
        tip: {
          wrap: "border-emerald-500/30 bg-emerald-950/20",
          title: "text-emerald-300",
          Icon: Info,
        },
        warning: {
          wrap: "border-amber-500/30 bg-amber-950/20",
          title: "text-amber-300",
          Icon: AlertTriangle,
        },
        atc: {
          wrap: "border-sky-500/30 bg-sky-950/30",
          title: "text-sky-300",
          Icon: Radio,
        },
      }[block.variant];
      const Icon = styles.Icon;

      return (
        <div key={idx} className={`my-6 rounded-xl border p-4 ${styles.wrap}`}>
          <div
            className={`mb-1 flex items-center gap-2 font-mono text-xs font-semibold tracking-wider uppercase ${styles.title}`}
          >
            <Icon className="h-4 w-4" />
            {block.title}
          </div>
          <p className="text-sm leading-relaxed text-slate-200">{block.text}</p>
        </div>
      );
    }

    case "paths":
      return (
        <div key={idx} className="my-6 grid gap-4 sm:grid-cols-2">
          {block.cards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group rounded-xl border border-slate-800 bg-slate-900/70 p-5 transition-all hover:border-sky-500/60 hover:bg-slate-900"
            >
              <div className="font-mono text-[11px] tracking-widest text-sky-400">
                {card.badge}
              </div>
              <div className="mt-2 text-lg font-bold text-white group-hover:text-sky-300">
                {card.title}
              </div>
              <p className="mt-2 text-sm text-slate-400">{card.description}</p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-sky-400">
                {card.cta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      );

    case "code":
      return (
        <div
          key={idx}
          className="my-6 overflow-hidden rounded-xl border border-slate-800 bg-slate-950"
        >
          {block.label && (
            <div className="border-b border-slate-800 bg-slate-900/80 px-4 py-2 font-mono text-[11px] tracking-widest text-slate-400">
              {block.label}
            </div>
          )}
          <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-sky-200">
            <code>{block.code}</code>
          </pre>
        </div>
      );
  }
}

export default function DocRenderer({ page }: { page: DocPage }) {
  const section = DOC_SECTIONS.find((s) => s.id === page.section);
  const { prev, next } = getPrevNext(page.slug);

  return (
    <article className="mx-auto max-w-3xl">
      <div className="font-mono text-xs uppercase tracking-widest text-sky-400">
        SEC {section?.code} // {section?.label}
      </div>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
        {page.title}
      </h1>
      <p className="mt-3 text-base leading-relaxed text-slate-400">
        {page.description}
      </p>

      <div className="mt-8 border-t border-slate-800/80 pt-4">
        {page.blocks.map((block, idx) => renderBlock(block, idx))}
      </div>

      {/* Prev / Next Navigation */}
      <div className="mt-14 grid gap-4 border-t border-slate-800 pt-8 sm:grid-cols-2">
        {prev ? (
          <Link
            href={prev.slug === "flight-briefing" ? "/docs" : `/docs/${prev.slug}`}
            className="group rounded-xl border border-slate-800 bg-slate-900/50 p-4 transition-colors hover:border-sky-500/50"
          >
            <div className="flex items-center gap-1.5 font-mono text-xs text-slate-400">
              <ArrowLeft className="h-3.5 w-3.5" /> PREVIOUS
            </div>
            <div className="mt-1 font-semibold text-slate-200 group-hover:text-sky-300">
              {prev.title}
            </div>
          </Link>
        ) : (
          <div />
        )}

        {next && (
          <Link
            href={`/docs/${next.slug}`}
            className="group rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-right transition-colors hover:border-sky-500/50"
          >
            <div className="flex items-center justify-end gap-1.5 font-mono text-xs text-slate-400">
              NEXT <ArrowRight className="h-3.5 w-3.5" />
            </div>
            <div className="mt-1 font-semibold text-slate-200 group-hover:text-sky-300">
              {next.title}
            </div>
          </Link>
        )}
      </div>
    </article>
  );
}