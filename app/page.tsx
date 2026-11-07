"use client"
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
const styles = {
  mainContainer: "min-h-screen bg-slate-950",
  header: "w-full max-w-6xl px-6 py-6",
  navbar: "flex items-center justify-between",
  navbarButtons: "text-slate-300 transition-colors hover:text-sky-400",
  showcaseSection: "mt-24 w-full max-w-6xl px-6",
  showcaseHeading: "mb-8 text-center text-2xl font-bold text-sky-300",
  cardStream: "grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
  blueprintCard:   "relative overflow-hidden min-h-72 rounded-xl border border-sky-800 bg-cover bg-center p-6 text-white shadow-lg shadow-sky-950/50",
cardOverlay:
  "absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-900/40 z-0",
cardContent: "relative z-10 flex flex-col h-full",
  cardTitle: "text-xl font-bold",
  cardCreator: "mt-1 text-sm text-sky-300",
  cardDescription: "mt-4 text-sm leading-relaxed text-slate-200",
  FAQ: "mt-24 w-full max-w-3xl px-6",
  FAQstyle: "border-b border-slate-700 py-4",
  FAQlist: "cursor-pointer font-semibold text-slate-200",
  FAQcontent: "mt-3 text-slate-400",
};

const SLACK_URL = "https://app.slack.com/client/E09V59WQY1E/C0BATDA4MEF";
const RSVP_URL = "https://rsvp.hackclub.community/take-off";
const RSVP_COUNT_URL = "/api/rsvp-count";
const RSVP_FALLBACK = 49; //HERE REMEMBER TO CHANGE THE RSVP EVERY TIME TO HAVE NR: DONT DELETE THIS COMMENT PLS;)

const projects = [
  {
    title: "RC PLANE",
    creator: "Hydrance",
    image: "/RC-plane.webp",
    description:
      "A 3D-printed RC plane from scratch. Lightweight PLA, brushless motors, flight controller, ESC, transmitter, receiver, GPS, and a handful of servos.",
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
  ["🛩️", "Hobby radar / ADS-B"],
  ["🛩️", "Flight trackers"],
  ["🛩️", "Aviation games"],
  ["🛩️", "Rockets"],
  ["🛩️", "Instrument panel"],
  ["🛩️", "Flight sims & mods"],
];

const faqs = [
  {
    q: "What actually is Takeoff?",
    a: "Takeoff is a Hack Club YSWS — You Ship, We Ship. You build something aviation-related, hardware or software, and we send you prizes and fund your hardware builds.",
  },
  {
    q: "Is this legit?",
    a: "Yes. Hack Club is the world's largest community of teenage makers and a 501(c)(3) nonprofit. We're funded by folks like GitHub and Michael Dell, and our books are public.",
  },
  {
    q: "I've never touched hardware or code before.",
    a: "Perfect. Takeoff is beginner-friendly. We'll have starter projects, mentors in Slack, and you'll be surprised what you can pick up in a weekend.",
  },
  {
    q: "How old do I have to be?",
    a: "13 to 18, inclusive. That's the Hack Club range.",
  },
  {
    q: "Do I need to log hours?",
    a: "Yep — like every Hack Club YSWS, you'll log build time with Hackatime. It's how we keep things fair and how you unlock bigger prizes.",
  },
  {
    q: "Where do I ask questions?",
    a: "Hop into #takeoff-help on the Hack Club Slack. Real humans, usually within a few minutes.",
  },
];

const footerLinks = [
  {
    title: "Resources",
    links: [
      { label: "Code of Conduct", href: "https://hackclub.com/conduct" },
      { label: "Hackatime", href: "https://hackatime.hackclub.com" },
      { label: "Hack Club Bank", href: "https://hackclub.com/bank" },
      { label: "Privacy & Terms", href: "https://hackclub.com/privacy-and-terms#hack-club-privacy-notice" },
    ],
  },
  {
    title: "Hack Club",
    links: [
      { label: "Hack Club Home", href: "https://hackclub.com" },
      { label: "Hackclub team", href: "https://hackclub.com/team" },
      { label: "YSWS Directory", href: "https://ysws.hackclub.com" },
      { label: "Donate", href: "https://hackclub.com/philanthropy" },
    ],
  },
  {
    title: "Takeoff",
    links: [

    ],
  },
];

const timeline = [
  { label: "RSVP NOW", date: "Now", state: "active" },
  { label: "Sponsored", date: "...", state: "upcoming" },
  { label: "Takeoff begins", date: "...", state: "upcoming" },
];

export default function Home() {
    const [rsvpCount, setRsvpCount] = useState<number>(RSVP_FALLBACK);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(RSVP_COUNT_URL, { cache: "no-store" });
        if (!res.ok) throw new Error("no endpoint");
        const json = await res.json();
        if (!cancelled && typeof json.count === "number") setRsvpCount(json.count);
      } catch {
      }
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);
  const submissions = [
    { title: "RC PLANE", author: "Hydrance", desc: "A 3D printed RC plane from scratch using lightweight PLA, brushless motors, and flight hardware.", bg: "/RC-plane.webp" },
    { title: "Flightsensor", author: "Limitens", desc: "A keychain flight sensor tracking nearby planes using public flight data.", bg: "/flight-sensor.webp" },
    { title: "Drone controller module", author: "Abohisham", desc: "A 4-motor drone controller with an IMU for position and orientation tracking.", bg: "/drone-pcb.webp" },
    { title: "Rocket flight controller", author: "dash.pt101", desc: "Rocket flight controller with TVC and active control for flight estimates.", bg: "/rocket-flight-controller.webp" },
    { title: "Desktop Jet engine", author: "Ryan", desc: "A miniature turbojet replica powered by a DC motor.", bg: "/Desktop-jet-engine.webp" },
    { title: "Hover", author: "Shauryac", desc: "A custom mini racing/stunt drone with ML-assisted balancing and autonomous operation.", bg: "/Hover.webp" },
    { title: "RC-transmitter", author: "Yarne", desc: "A 2.4GHz transmitter for drones and vehicles built around the RP2040 and nRF24.", bg: "/RC-transmitter.jpg", span: "md:col-span-2 lg:col-span-1 lg:col-start-2" }
  ];

  const faqs = [
    { q: "what is this?", a: "A YSWS where you ship aviation-related hardware/software projects for prizes and funding." },
    { q: "Is this legit?", a: "Hack Club is the world's largest community of teenage makers and a 501(c)(3) nonprofit supported by tech leaders." },
    { q: "I don't know any hardware or software!", a: "Don't worry! Takeoff is beginner friendly with starter projects to help you learn." },
    { q: "Who is eligible?", a: "To be eligible for Takeoff, you must be between the ages of 13 and 18 (inclusive)." },
    { q: "I have more questions!", a: "Ask in #takeoff-help on the Hack Club Slack." }
  ];

  return (
    <main
      className={`${styles.mainContainer} w-screen overflow-x-hidden flex flex-col items-center text-white relative`}
    >
      <header className={styles.header}>
        <div className={styles.navbar}>
          <a href="/" className="font-bold tracking-widest">
            TAKEOFF
          </a>
          <div className="flex gap-6 items-center">
            <a href="#about" className={styles.navbarButtons}>
              About
            </a>
            <a href="#showcase" className={styles.navbarButtons}>
              Some Projects
            </a>
            <a href="#faq" className={styles.navbarButtons}>
              FAQ
            </a>
            <a
              href={SLACK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.navbarButtons}
            >
              Slack
            </a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section id="about" className="max-w-4xl text-center px-6 mt-12">
        <h1 className="mt-4 text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-300 to-blue-400">
          Takeoff
        </h1>
        <p className="mt-2 text-2xl md:text-3xl text-slate-300 font-medium">
          Coming soon...
        </p>
        <p className="mt-8 text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          A YSWS where you ship aviation-related hardware and/or software projects (drones, hobby radars, flight trackers, aviation games, etc.), and we ship aviation-related prizes and funding for your hardware projects!


        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            size="lg"
            className="bg-sky-500 hover:bg-sky-400 text-white font-semibold px-8 transition-all duration-300 hover:scale-105"
          >
            <a href={RSVP_URL} target="_blank" rel="noopener noreferrer">
              RSVP for Takeoff
            </a>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="bg-transparent border-2 border-slate-500 text-slate-200 hover:bg-slate-700 hover:text-white transition-all duration-300"
          >
            <a href={SLACK_URL} target="_blank" rel="noopener noreferrer">
              Join the Slack
            </a>
          </Button>
        </div>
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
          </span>
          <span>
            <span className="text-sky-300 font-semibold">{rsvpCount.toLocaleString()}</span>RSVP&apos;d
          </span>
        </div>

      </section>

      {/* TIMELINE STEPPER */}
      <section className="max-w-4xl w-full mx-auto mt-24 px-6">
        <h2 className="text-2xl md:text-3xl font-bold text-sky-300 text-center">Takeoff right now:</h2>
        <p className="mt-3 text-slate-400 text-center text-sm">Where we are so far.</p>
        <div className="relative mt-12">
          <div className="hidden md:block absolute top-2 left-8 right-8 h-0.5 bg-slate-700" />
          <div className="flex flex-col md:flex-row justify-between gap-8 md:gap-0 relative">
            {timeline.map((step) => (
              <div key={step.label} className="flex md:flex-col items-center md:items-center gap-3 md:gap-2 md:flex-1">
                <div
                  className={`w-4 h-4 rounded-full shrink-0 z-10 ${
                    step.state === "active"
                      ? "bg-sky-400 ring-4 ring-sky-400/30 animate-pulse"
                      : step.state === "done"
                      ? "bg-sky-600"
                      : "bg-slate-600"
                  }`}
                />
                <div className="md:text-center">
                  <div
                    className={`font-semibold text-sm ${
                      step.state === "active" ? "text-sky-300" : "text-slate-200"
                    }`}
                  >
                    {step.label}
                  </div>
                  <div className="text-xs text-slate-500">{step.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT COUNTS */}
      <section className="max-w-4xl mx-auto mt-24 px-6 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-sky-300">What counts?</h2>
        <p className="mt-3 text-slate-400">
          (You can always ask in #takeoff-help if you aren't sure if your project counts.):
        </p>
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {buildIdeas.map(([emoji, label]) => (
            <div
              key={label}
              className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-sky-500 transition-colors"
            >
              <div className="text-2xl">{emoji}</div>
              <div className="mt-2 text-slate-200">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-4xl mx-auto mt-24 px-6 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-sky-300">How it works</h2>
        <div className="mt-8 grid md:grid-cols-3 gap-6 text-left">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="text-sky-400 font-bold text-sm tracking-widest uppercase">
            </div>
            <h3 className="mt-2 text-xl font-semibold">Design</h3>
            <p className="mt-2 text-slate-400 text-sm">
              Design your project and journal your progress, while tracking your time using{" "}
              <a
                href="https://hackatime.hackclub.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 underline"
              >
                Hackatime
              </a>{" "}
              as evidence.
            </p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="text-sky-400 font-bold text-sm tracking-widest uppercase">
            </div>
            <h3 className="mt-2 text-xl font-semibold">Ship</h3>
            <p className="mt-2 text-slate-400 text-sm">
              Ship your project to takeoff, and get funding to build your project IRL!
            </p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="text-sky-400 font-bold text-sm tracking-widest uppercase">
            </div>
            <h3 className="mt-2 text-xl font-semibold">Get prizes</h3>
            <p className="mt-2 text-slate-400 text-sm">
              You can get aviation-themed prices in the shop to buy whatever you want for your future projects:-)
            </p>
          </div>
        </div>
      </section>

      {/* SHOWCASE */}
<section id="showcase" className={styles.showcaseSection}>
  <h2 className={styles.showcaseHeading}>[Previous submissions]</h2>
  <div className={styles.cardStream}>
    {projects.map((p) => (
      <div
        key={p.title}
        className={styles.blueprintCard}
        style={{ backgroundImage: `url('${p.image}')` }}
      >
        {/* dark overlay so text stays readable on the img */}
        <div className={styles.cardOverlay} />
        <div className={styles.cardContent}>
          <h3 className={styles.cardTitle}>{p.title}</h3>
          <div className={styles.cardCreator}>By {p.creator}</div>
          <p className={styles.cardDescription}>{p.description}</p>
        </div>
      </div>
    ))}
  </div>
</section>

      {/* FAQ */}
      <section id="faq" className={styles.FAQ}>
        <h2 className="text-3xl font-bold mb-6 text-center mt-8">FAQ</h2>
        {faqs.map((f) => (
          <details key={f.q} name="faq" className={styles.FAQstyle}>
            <summary className={styles.FAQlist}>{f.q}</summary>
            <p className={styles.FAQcontent}>{f.a}</p>
          </details>
        ))}
      </section>

      {/* RESOURCES FOOTER */}
      <section className="w-full max-w-6xl mx-auto mt-24 px-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-left border-t border-slate-800 pt-12">
          {footerLinks.map((col) => (
            <div key={col.title}>
              <h3 className="text-sky-300 font-bold text-sm uppercase tracking-widest mb-4">
                {col.title}
              </h3>
              <ul className="space-y-2 text-sm">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={link.href.startsWith("#") ? undefined : "_blank"}
                      rel={link.href.startsWith("#") ? undefined : "noopener noreferrer"}
                      className="text-slate-400 hover:text-sky-400 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full max-w-4xl mx-auto mt-24 mb-12 px-6 text-center text-slate-500 text-sm">
        <p>
          Takeoff is a{" "}
          <a
            href="https://hackclub.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-400 hover:underline"
          >
            Hack Club
          </a>{" "}
          YSWS. Hack Club is a 501(c)(3) nonprofit run by teenagers, for teenagers.
        </p>
        <p className="mt-2">
          Questions? Ping <span className="text-slate-300">#takeoff-help</span> on{" "}
          <a
            href={SLACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-400 hover:underline"
          >
            the Slack
          </a>
          .
        </p>
        <p className="mt-4 text-xs text-slate-600">
          🏳️ Built with love, (Abohisham and Java Junkie orgs...)
        </p>
      </footer>
    </main>
  );
}
