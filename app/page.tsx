"use client"

import Image from 'next/image';
import Link from 'next/link';
import styles from "./page.module.css";
import { Button } from "@/components/ui/button";

const SUBMISSIONS = [
  {
    title: "RC PLANE",
    creator: "By Hydrance",
    desc: "a 3d printed RC plane from scratch. Using lightweight PLA, brushless motors, flight controller, ESC, transmitter, receiver, GPS, and some servos.",
    img: "/RC-plane.webp"
  },
  {
    title: "Flightsensor",
    creator: "By Limitens",
    desc: "A Keychain flight sensor that can track the closest planes to the user using public flight data.",
    img: "/flight-sensor.webp"
  },
  {
    title: "Drone controller module",
    creator: "By Abohisham",
    desc: "A controller used to control a drone with 4 motors, plus an IMU controller to determine position of drone and orientation.",
    img: "/drone-pcb.webp"
  },
  {
    title: "Rocket flight controller",
    creator: "By dash.pt101",
    desc: "Rocket Flight Controller, designed with TVC and Active Control, while allowing estimates for e.g speeds in flight controls.",
    img: "/rocket-flight-controller.webp"
  },
  {
    title: "Desktop Jet engine",
    creator: "By Ryan",
    desc: "A miniature turbojet replica powered by a dc motor",
    img: "/Desktop-jet-engine.webp"
  },
  {
    title: "Hover",
    creator: "By Shauryac",
    desc: "A fully custom mini racing/stunt drone with ML-assisted balancing, automatic stunts, and some level of autonomous operation.",
    img: "/Hover.webp"
  },
  {
    title: "RC-transmitter",
    creator: "By Yarne",
    desc: "A 2.4GHz transmitter for controlling drones, planes, cars. Based around the RP2040 and nRF24.",
    img: "/RC-transmitter.jpg"
  }
];

export default function Home() {
  return (
    <main className={`${styles.mainContainer} w-screen overflow-x-hidden flex flex-col items-center text-white relative font-sans`}>
      
      {/* Heads-Up-Display HUD Overlay (Grid and Flight Tapes) */}
      <div className={styles.hudOverlay}>
        <div className={styles.hudAltitudeTape}>ALT 32000</div>
        <div className={styles.hudAirspeedTape}>SPD 240KT</div>
        <div className={styles.hudPitchLadder}>
          <div className="border-t border-[#00ff66]/20 w-12 text-center text-[8px] text-[#00ff66]/40 mb-12">- 10 -</div>
          <div className="border-t border-[#00ff66]/30 w-16 text-center text-[8px] text-[#00ff66]/60 mb-12">- 05 -</div>
          <div className="border-t-2 border-[#00ff66]/50 w-24 text-center text-[10px] text-[#00ff66]/90 mb-12">[ 00 ]</div>
          <div className="border-t border-[#00ff66]/30 w-16 text-center text-[8px] text-[#00ff66]/60 mb-12">+ 05 +</div>
          <div className="border-t border-[#00ff66]/20 w-12 text-center text-[8px] text-[#00ff66]/40">+ 10 +</div>
        </div>
      </div>

      {/* Cockpit Glass Header */}
      <header className={styles.header}>
        <div className={styles.navbar}>
          <div className="flex items-center gap-3 font-mono">
            <Image 
              src="/TakeoffLogo.png" 
              alt="Takeoff logo" 
              width={22} 
              height={22} 
              className="object-contain animate-pulse"
            />
            <span className="font-bold tracking-widest text-xs">TAKEOFF_SYSTEM_v0.1</span>
          </div>
          
          <div className="flex items-center gap-6 font-mono text-[10px]">
            <span className="flex items-center gap-1.5 text-[#00ff66] bg-[#00ff66]/5 px-2.5 py-1 rounded border border-[#00ff66]/20">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00ff66] animate-ping" />
              STATUS: PRE-FLIGHT
            </span>
            <a href="#faq" className={styles.navbarButtons}>ABOUT</a>
          </div>
        </div>
      </header>

      {/* Hero Primary Flight Display Card */}
      <div className="max-w-xl w-full px-6 relative z-10 flex flex-col items-center mt-12">
        
        {/* Glassmorphic Tactical telemetry Card */}
        <div className={styles.pfdPanel}>
          
          {/* Telemetry Header */}
          <div className="w-full flex justify-between border-b border-[#00bdff]/20 pb-2 mb-4 font-mono text-[9px] text-[#00bdff]">
            <span>[ HDG: 090° ]</span>
            <span>[ SQ: 7000 ]</span>
            <span>[ AP: DISENGAGED ]</span>
          </div>

          <p className="text-sky-400 text-lg font-mono tracking-widest uppercase">
            TAKEOFF
          </p>

          <h1 className="text-4xl font-extrabold tracking-wide mt-2 text-white font-mono">
            COMING SOON_
          </h1>

          <p className="mt-4 text-slate-300 text-sm leading-relaxed text-left">
            A YSWS where you ship aviation-related hardware and/or software projects (drones, hobby radars,
            flight trackers, aviation games, etc.), and we ship aviation-related prizes and funding for your
            hardware projects!
          </p>

          {/* Pre-Flight Checklist */}
          <div className="w-full mt-6 bg-[#020617]/60 border border-slate-800 rounded p-4 text-left font-mono text-xs">
            <div className="text-slate-500 mb-2 border-b border-slate-800 pb-1">[ PILOT_CHECKLIST ]</div>
            <div className="flex items-center gap-2 text-emerald-400 mb-1">
              <span>[✓]</span> <span>AGE BOUNDS: 13-18 (ELIGIBLE)</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400 mb-1">
              <span>[✓]</span> <span>REGISTRATION: RSVP PORTAL OPEN</span>
            </div>
            <div className="flex items-center gap-2 text-amber-500">
              <span>[ ]</span> <span>MISSION DEPARTURE: STBY (WAITING LAUNCH)</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center">
            <p className="text-xs text-slate-400 font-mono">
              Initialize RSVP to receive system launch notification emails.
            </p>
            
            <Link 
              href="https://rsvp.hackclub.community/takeoff" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block mt-4 w-full"
            >
              <Button
                variant="outline"
                size="lg"
                className="w-full border-[#00bdff]/40 text-[#00bdff] hover:bg-[#00bdff]/10 hover:text-white transition-all shadow-[0_0_15px_rgba(0,189,255,0.15)] font-mono text-xs rounded"
              >
                EXECUTE RSVP_PROCEDURE
              </Button>
            </Link>
          </div>
        </div>

      </div>

      {/* Blueprint Hangar Gallery */}
      <section className={styles.showcaseSection}>
        <div className="max-w-[1200px] mx-auto">
          <h2 className={styles.showcaseHeading}>[Previous submissions]</h2>
        </div>

        <div className="overflow-hidden w-full relative">
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#030712] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#030712] to-transparent z-10 pointer-events-none" />

          {/* Endless looped stream */}
          <div className={styles.cardStream}>
            {[...SUBMISSIONS, ...SUBMISSIONS].map((item, index) => (
              <div 
                key={index} 
                className={styles.blueprintCard} 
                style={{ backgroundImage: `url('${item.img}')` }}
              >
                <div className={styles.cardTitle}>{item.title}</div>
                <div className={styles.cardCreator}>{item.creator}</div>
                <p className={styles.cardDescription}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Flight Brief FAQ Area */}
      <div id="faq" className={styles.FAQ}>
        <div className="flex items-center justify-between border-b border-[#4b65bd]/20 pb-3 mb-4">
          <span className="text-[10px] font-mono text-[#00bdff]">[ DATA_ENTRY: FAQ_SYSTEM ]</span>
          <h2 className="text-xl font-bold font-mono text-white">FAQ</h2>
        </div>
        
        <details className={styles.FAQstyle}>
          <summary className={styles.FAQlist}>what is this?</summary>
          <p className={styles.FAQcontent}>
            A YSWS where you ship aviation-related hardware and/or software projects (drones, hobby radars, flight trackers, aviation games, etc.), and we ship aviation-related prizes and funding for your hardware projects!
          </p>
        </details>
        
        <details className={styles.FAQstyle}>
          <summary className={styles.FAQlist}>Is this legit?</summary>
          <p className={styles.FAQcontent}>
            Hack Club is the world's largest community of teenage makers, and a 501(c)(3) nonprofit. Hack Club is supported by donations from tech companies like GitHub and individuals like Michael Dell. Hack Club is fiscally transparent.
          </p>
        </details>

        <details className={styles.FAQstyle}>
          <summary className={styles.FAQlist}>I dont know any hardware or software!</summary>
          <p className={styles.FAQcontent}>
            Don't worry! Takeoff is beginner friendly, we have some starter projects for you to start learning skills!
          </p>
        </details>

        <details className={styles.FAQstyle}>
          <summary className={styles.FAQlist}>Who is eligible?</summary>
          <p className={styles.FAQcontent}>
            To be eligible for Takeoff, you must be between the ages of 13 and 18 (inclusive).
          </p>
        </details>
        
        <details className={styles.FAQstyle}>
          <summary className={styles.FAQlist}>I have more questions!</summary>
          <p className={styles.FAQcontent}>
            Ask in #takeoff-help on the Hack Club Slack
          </p>
        </details>
      </div>
    </main>
  );
}