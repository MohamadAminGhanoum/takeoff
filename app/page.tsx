"use client"
import styles from "./page.module.css";
import { Button } from "@/components/ui/button";

const SLACK_URL = "https://app.slack.com/client/E09V59WQY1E/C0BATDA4MEF";
const RSVP_URL = "https://rsvp.hackclub.community/take-off";

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

export default function Home() {
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
      <section id="about" className="max-w-4xl text-center px-6 mt-24">
        <p className="text-sky-400 text-sm md:text-base font-medium tracking-[0.3em] uppercase">
          Hack Club presents
        </p>
        <h1 className="mt-4 text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-300 to-blue-400">
          Takeoff
        </h1>
        <p className="mt-2 text-2xl md:text-3xl text-slate-300 font-medium">
          Coming soon. Cleared for boarding.
        </p>
        <p className="mt-8 text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          A YSWS for aviation nerds. Build a drone, a flight tracker, a desktop jet engine, a
          radar, an aviation game — anything that flies, senses flight, or pretends to. Ship it, and
          we ship you prizes and hardware funding.
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
      </section>

      {/* WHAT COUNTS */}
      <section className="max-w-4xl mx-auto mt-24 px-6 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-sky-300">What counts?</h2>
        <p className="mt-3 text-slate-400">
          If it's aviation-adjacent, it counts. Some ideas:
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
              Step 1
            </div>
            <h3 className="mt-2 text-xl font-semibold">Build</h3>
            <p className="mt-2 text-slate-400 text-sm">
              Pick a project. Grab a friend. Log your hours with{" "}
              <a
                href="https://hackatime.hackclub.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 underline"
              >
                Hackatime
              </a>{" "}
              as you go.
            </p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="text-sky-400 font-bold text-sm tracking-widest uppercase">
              Step 2
            </div>
            <h3 className="mt-2 text-xl font-semibold">Ship</h3>
            <p className="mt-2 text-slate-400 text-sm">
              Publish your project — repo, build log, photos, demo video. Same as any Hack Club
              YSWS.
            </p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="text-sky-400 font-bold text-sm tracking-widest uppercase">
              Step 3
            </div>
            <h3 className="mt-2 text-xl font-semibold">Get prizes</h3>
            <p className="mt-2 text-slate-400 text-sm">
              Aviation-themed swag, gift cards, hardware grants for your next build — funded
              through Hack Club Bank.
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
              <h3 className={styles.cardTitle}>{p.title}</h3>
              <div className={styles.cardCreator}>By {p.creator}</div>
              <p className={styles.cardDescription}>{p.description}</p>
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
          🏳️ Built with love, caffeine, and probably too many servo datasheets.
        </p>
      </footer>
    </main>
  );
}