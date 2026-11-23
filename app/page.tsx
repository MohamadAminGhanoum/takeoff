"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import TakeoffScrollScene from "@/components/TakeoffScrollScene";

const SLACK_URL = "https://app.slack.com/client/E09V59WQY1E/C0BATDA4MEF";
const RSVP_URL = "https://rsvp.hackclub.community/take-off";
const RSVP_COUNT_URL = "/api/rsvp-count";
const RSVP_FALLBACK = 49;
const PX_PER_FRAME = 8;

const projects = [
  {
    title: "RC Plane",
    creator: "Hydrance",
    image: "/RC-plane.webp",
    description:
      "A 3D-printed RC plane from scratch. Lightweight PLA, brushless motors, flight controller, ESC, transmitter, receiver, GPS, and servos.",
  },
  {
    title: "Flight sensor",
    creator: "Limitens",
    image: "/flight-sensor.webp",
    description:
      "A keychain flight sensor that tracks the closest planes overhead using public flight data.",
  },
  {
    title: "Drone controller module",
    creator: "Abohisham",
    image: "/drone-pcb.webp",
    description:
      "A controller for a 4-motor drone, plus an IMU to figure out position and orientation.",
  },
  {
    title: "Rocket flight controller",
    creator: "dash.pt101",
    image: "/rocket-flight-controller.webp",
    description:
      "A rocket flight controller with TVC and active control, plus in-flight speed estimates.",
  },
  {
    title: "Desktop jet engine",
    creator: "Ryan",
    image: "/Desktop-jet-engine.webp",
    description: "A miniature turbojet replica powered by a DC motor.",
  },
  {
    title: "Hover",
    creator: "Shauryac",
    image: "/Hover.webp",
    description:
      "A custom mini racing/stunt drone with ML-assisted balancing, auto stunts, and semi-autonomous flight.",
  },
  {
    title: "RC transmitter",
    creator: "Yarne",
    image: "/RC-transmitter.jpg",
    description:
      "A 2.4GHz transmitter for drones, planes, and cars, built around the RP2040 and nRF24.",
  },
];

const buildIdeas = [
  ["🛩️", "RC planes & drones"],
  ["📡", "Hobby radar / ADS-B"],
  ["📍", "Flight trackers"],
  ["🎮", "Aviation games"],
  ["🚀", "Rockets"],
  ["🎛️", "Instrument panels"],
  ["🕹️", "Flight sims & mods"],
];

const faqs = [
  {
    q: "What is this?",
    a: "A YSWS where you ship aviation-related hardware/software projects for prizes and funding.",
  },
  {
    q: "Is this legit?",
    a: "Hack Club is the world's largest community of teenage makers and a 501(c)(3) nonprofit supported by tech leaders.",
  },
  {
    q: "I don't know any hardware or software!",
    a: "Don't worry! Takeoff is beginner friendly with starter projects and docs to help you learn.",
  },
  {
    q: "Who is eligible?",
    a: "To be eligible for Takeoff, you must be between the ages of 13 and 18 (inclusive).",
  },
  {
    q: "I have more questions!",
    a: "Ask in #takeoff-help on the Hack Club Slack.",
  },
];

export default function Home() {
  const scrollerRef = useRef<HTMLElement>(null);
  const [rsvpCount, setRsvpCount] = useState<number>(RSVP_FALLBACK);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => setSignedIn(!!data.signedIn))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(RSVP_COUNT_URL, { cache: "no-store" });
        if (!res.ok) throw new Error("no endpoint");
        const json = await res.json();
        if (!cancelled && typeof json.count === "number") setRsvpCount(json.count);
      } catch {
        // keep fallback count
      }
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0a1220] text-white">
      <TakeoffScrollScene scrollerRef={scrollerRef} />

      {/* FIXED GLASS NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-30 flex justify-center px-4 pt-4">
        <nav className="flex w-full max-w-6xl items-center justify-between rounded-2xl border border-white/15 bg-slate-950/75 px-5 py-3 backdrop-blur-md shadow-xl">
          <Link href="/" className="font-mono text-sm font-bold tracking-widest text-amber-300">
            TAKEOFF
          </Link>
          <div className="hidden sm:flex items-center gap-6 text-sm text-slate-200">
            <a href="#about" className="hover:text-amber-300 transition-colors">About</a>
            <a href="#how" className="hover:text-amber-300 transition-colors">How it works</a>
            <a href="#showcase" className="hover:text-amber-300 transition-colors">Projects</a>
            <Link href="/docs" className="hover:text-amber-300 transition-colors">Docs</Link>
            <a href="#faq" className="hover:text-amber-300 transition-colors">FAQ</a>
          </div>
          <Link
            href={signedIn ? "/dashboard" : "/login"}
            className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white hover:border-amber-300 hover:text-amber-300 transition-colors"
          >
            {signedIn ? "Dashboard" : "Sign in"}
          </Link>
        </nav>
      </header>

      {/* SCROLL-SYNCED CONTENT */}
      <main ref={scrollerRef} className="relative z-10">
        {/* INTRO COCKPIT BEAT */}
        <div
          data-from-frame="1"
          data-to-frame="1"
          className="pointer-events-none flex h-screen items-end justify-center pb-[14vh]"
        >
          <p className="animate-bounce font-mono text-xs uppercase tracking-[0.25em] text-white drop-shadow">
            Scroll to take off ↓
          </p>
        </div>

        <div data-from-frame="1" data-to-frame="72" style={{ height: 71 * PX_PER_FRAME }} className="pointer-events-none" />

        {/* SHOT 01: HERO (Cockpit sunrise) */}
        <section
          data-from-frame="72"
          data-to-frame="72"
          className="flex min-h-screen items-center justify-center px-6 py-24"
        >
          <div className="max-w-3xl text-center">
            <span className="inline-block rounded-full border border-amber-400/50 bg-slate-950/60 px-3 py-1 font-mono text-xs uppercase tracking-widest text-amber-300 backdrop-blur">
              Hack Club YSWS · Ages 13–18
            </span>
            <h1 className="mt-4 text-6xl font-bold tracking-wide text-white drop-shadow-[0_6px_40px_rgba(0,0,0,0.65)] sm:text-8xl">
              TAKEOFF
            </h1>
            <p className="mt-4 text-lg text-white/95 drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] sm:text-xl">
              Ship aviation hardware or software. Get hardware funding &amp; aviation prizes.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <a
                href={RSVP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-amber-400 px-8 py-3.5 font-bold text-slate-950 shadow-lg hover:bg-amber-300 transition-transform hover:scale-105"
              >
                RSVP for Takeoff
              </a>
              <Link
                href="/docs"
                className="rounded-full border border-white/30 bg-slate-950/65 px-8 py-3.5 font-semibold text-white backdrop-blur hover:border-amber-300 hover:text-amber-300 transition-colors"
              >
                Read the Flight Manual
              </Link>
            </div>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-950/65 px-4 py-1.5 text-sm text-slate-200 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              <span className="font-semibold text-amber-300">{rsvpCount.toLocaleString()}</span> RSVP&apos;d
            </div>
          </div>
        </section>

        <div data-from-frame="72" data-to-frame="300" style={{ height: 228 * PX_PER_FRAME }} className="pointer-events-none" />

        {/* SHOT 03: ABOUT & WHAT COUNTS (Drone flyby) */}
        <section
          id="about"
          data-from-frame="300"
          data-to-frame="300"
          className="flex min-h-screen items-center px-6 py-24 sm:px-12"
        >
          <div className="w-full max-w-xl rounded-2xl border border-white/15 bg-slate-950/70 p-8 backdrop-blur-md shadow-2xl">
            <span className="inline-block rounded-full border border-amber-400/40 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-amber-300">
              01 // What is Takeoff?
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Build something that flies.</h2>
            <p className="mt-3 text-slate-300 leading-relaxed">
              Drones, RC planes, rockets, ADS-B flight trackers, cockpit panels, or flight sims — design and log it, then get funding to build it IRL.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              {buildIdeas.map(([emoji, label]) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                  <span className="mr-2">{emoji}</span>
                  <span className="text-slate-200">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div data-from-frame="300" data-to-frame="420" style={{ height: 120 * PX_PER_FRAME }} className="pointer-events-none" />

        {/* SHOT 04: HOW IT WORKS (Spitfire + Biplane formation) */}
        <section
          id="how"
          data-from-frame="420"
          data-to-frame="420"
          className="flex min-h-screen items-center justify-end px-6 py-24 sm:px-12"
        >
          <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-slate-950/70 p-8 backdrop-blur-md shadow-2xl">
            <span className="inline-block rounded-full border border-amber-400/40 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-amber-300">
              02 // How it works
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">From blueprint to runway.</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="font-mono text-xs text-amber-300">01 // DESIGN</div>
                <div className="mt-1 font-bold">Build &amp; Log</div>
                <p className="mt-1 text-xs text-slate-300">Journal your progress and track code hours with Hackatime.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="font-mono text-xs text-amber-300">02 // SHIP</div>
                <div className="mt-1 font-bold">Get Funded</div>
                <p className="mt-1 text-xs text-slate-300">Submit your design to get parts funding to build it IRL.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="font-mono text-xs text-amber-300">03 // PRIZES</div>
                <div className="mt-1 font-bold">Earn Gear</div>
                <p className="mt-1 text-xs text-slate-300">Redeem aviation-themed prizes in the Takeoff shop.</p>
              </div>
            </div>
          </div>
        </section>

        <div data-from-frame="420" data-to-frame="580" style={{ height: 160 * PX_PER_FRAME }} className="pointer-events-none" />

        {/* SHOT 05: PREVIOUS SUBMISSIONS (Rocket punching through clouds) */}
        <section
          id="showcase"
          data-from-frame="580"
          data-to-frame="580"
          className="flex min-h-screen items-center px-6 py-24 sm:px-12"
        >
          <div className="mx-auto w-full max-w-5xl rounded-2xl border border-white/15 bg-slate-950/75 p-8 backdrop-blur-md shadow-2xl">
            <span className="inline-block rounded-full border border-amber-400/40 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-amber-300">
              03 // Showcase
            </span>
            <h2 className="mt-3 text-3xl font-bold">Previous Submissions</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <div
                  key={p.title}
                  className="relative min-h-56 overflow-hidden rounded-xl border border-white/15 bg-cover bg-center p-5"
                  style={{ backgroundImage: `url('${p.image}')` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-900/40" />
                  <div className="relative z-10 flex h-full flex-col justify-end">
                    <h3 className="text-lg font-bold text-white">{p.title}</h3>
                    <div className="font-mono text-xs text-amber-300">By {p.creator}</div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-200">{p.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div data-from-frame="580" data-to-frame="700" style={{ height: 120 * PX_PER_FRAME }} className="pointer-events-none" />

        {/* SHOT 06: FAQ + CTA + FOOTER (Space & TAKEOFF logo) */}
        <section
          id="faq"
          data-from-frame="700"
          data-to-frame="700"
          className="flex min-h-screen items-center px-6 py-24 sm:px-12"
        >
          <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-slate-950/80 p-8 backdrop-blur-md shadow-2xl">
            <span className="inline-block rounded-full border border-amber-400/40 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-amber-300">
              04 // Cleared for Takeoff
            </span>
            <h2 className="mt-3 text-3xl font-bold">Ready for takeoff?</h2>
            <div className="mt-6 divide-y divide-white/10">
              {faqs.map((f) => (
                <details key={f.q} className="py-3">
                  <summary className="cursor-pointer font-semibold text-slate-100">{f.q}</summary>
                  <p className="mt-2 text-sm text-slate-300">{f.a}</p>
                </details>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href={RSVP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-amber-400 px-7 py-3 font-bold text-slate-950 hover:bg-amber-300"
              >
                RSVP Now
              </a>
              <a
                href={SLACK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/25 px-7 py-3 font-semibold text-white hover:border-amber-300"
              >
                Ask in #takeoff-help
              </a>
            </div>
            <p className="mt-8 border-t border-white/10 pt-4 text-xs text-slate-400">
              Takeoff is a Hack Club YSWS · 501(c)(3) nonprofit · Built by the Takeoff orgs
            </p>
          </div>
        </section>

        <div data-from-frame="700" data-to-frame="720" style={{ height: 20 * PX_PER_FRAME }} className="pointer-events-none" />
        <div data-from-frame="720" data-to-frame="720" className="pointer-events-none h-[50vh]" />
      </main>
    </div>
  );
}