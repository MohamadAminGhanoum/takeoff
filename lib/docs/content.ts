export type DocSectionId =
  | "preflight"
  | "flight-plan"
  | "avionics"
  | "airframe"
  | "flight-school"
  | "shipping"
  | "hangar"
  | "atc";

export type DocBlock =
  | { type: "h2"; id: string; text: string }
  | { type: "h3"; id: string; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "checklist"; title?: string; items: string[] }
  | {
      type: "callout";
      variant: "tip" | "warning" | "atc";
      title: string;
      text: string;
    }
  | {
      type: "paths";
      cards: {
        badge: string;
        title: string;
        description: string;
        href: string;
        cta: string;
      }[];
    }
  | { type: "code"; label?: string; code: string };

export interface DocPage {
  slug: string;
  section: DocSectionId;
  title: string;
  description: string;
  blocks: DocBlock[];
}

export interface DocSectionMeta {
  id: DocSectionId;
  code: string;
  label: string;
}

export const DOC_SECTIONS: DocSectionMeta[] = [
  { id: "preflight", code: "01", label: "Preflight" },
  { id: "flight-plan", code: "02", label: "Flight Plan" },
  { id: "avionics", code: "03", label: "Avionics & Code" },
  { id: "airframe", code: "04", label: "Airframe & Hardware" },
  { id: "flight-school", code: "05", label: "Flight School" },
  { id: "shipping", code: "06", label: "Cleared for Takeoff" },
  { id: "hangar", code: "07", label: "Hangar & Shop" },
  { id: "atc", code: "08", label: "Control Tower (ATC)" },
];

export const DOC_PAGES: DocPage[] = [
  {
    slug: "flight-briefing",
    section: "preflight",
    title: "Flight Briefing",
    description:
      "Welcome to Takeoff — Hack Club's aviation YSWS where you design and ship aviation projects for real hardware funding and prizes.",
    blocks: [
      {
        type: "callout",
        variant: "atc",
        title: "PREFLIGHT STATUS: RSVP OPEN",
        text: "Takeoff is currently in preflight! RSVP on the home page and hop into #takeoff-help on the Hack Club Slack so you're cleared the moment submissions open.",
      },
      { type: "h2", id: "what-is-takeoff", text: "What is Takeoff?" },
      {
        type: "p",
        text: "Takeoff is a Hack Club YSWS (You Ship, We Ship) for teenagers aged 13–18. You design, build, and document an aviation-related hardware or software project — and we ship funding to build your hardware IRL plus aviation-themed prizes from our shop.",
      },
      { type: "h2", id: "pick-your-flight-path", text: "Pick Your Flight Path" },
      {
        type: "paths",
        cards: [
          {
            badge: "TRACK A // HARDWARE",
            title: "Airframe, PCBs & Avionics",
            description:
              "Build RC planes, custom drone PCBs, flight controllers, rockets, ADS-B receivers, or cockpit instrument panels.",
            href: "/docs/flight-log",
            cta: "Read Hardware Guide",
          },
          {
            badge: "TRACK B // SOFTWARE",
            title: "Flight Trackers, Sims & Games",
            description:
              "Build radar visualizers, flight tracker dashboards, telemetry ground stations, aviation games, or flight-sim mods.",
            href: "/docs/software-setup",
            cta: "Read Software Guide",
          },
        ],
      },
      { type: "h2", id: "quick-checklist", text: "Pre-Flight Checklist" },
      {
        type: "checklist",
        title: "Before you start building",
        items: [
          "Confirm you are between 13 and 18 years old (inclusive).",
          "Join the Hack Club Slack and enter #takeoff-help.",
          "Pick a hardware, software, or hybrid aviation idea.",
          "Set up a GitHub repository and start a build journal / flight log.",
        ],
      },
    ],
  },
  {
    slug: "how-it-works",
    section: "preflight",
    title: "How Takeoff Works",
    description: "From blank blueprint to hardware grant and shop prizes in three stages.",
    blocks: [
      { type: "h2", id: "the-three-stages", text: "The Three Stages" },
      {
        type: "ul",
        items: [
          "1. Design & Log: Design your hardware/software, journal every milestone, and track coding hours with Hackatime.",
          "2. Ship Your Design: Submit your GitHub repo, schematics/CAD, BOM, and flight log for review.",
          "3. Build IRL & Earn Shop Prizes: Receive hardware funding to order parts and build it, plus shop credits for future aviation gear.",
        ],
      },
      {
        type: "callout",
        variant: "tip",
        title: "PILOT TIP",
        text: "You don't need to buy parts out-of-pocket first! Ship a complete, reviewable design (CAD/PCB/code + BOM) to unlock funding for your build.",
      },
    ],
  },
  {
    slug: "what-counts",
    section: "flight-plan",
    title: "What Counts as Aviation?",
    description: "What projects qualify for Takeoff — and how to make sure yours clears ATC.",
    blocks: [
      { type: "h2", id: "eligible-categories", text: "Eligible Categories" },
      {
        type: "ul",
        items: [
          "RC planes, gliders, and multirotor drones (airframe + electronics)",
          "Custom flight controllers, ESCs, telemetry boards, or PDBs",
          "Model rockets, TVC mounts, and rocket flight computers",
          "ADS-B / hobby radar receivers and live overhead flight trackers",
          "Cockpit instrument panels, throttle quadrants, and flight-sim hardware",
          "Aviation games, ATC simulators, flight-planning tools, and sim mods",
        ],
      },
      { type: "h2", id: "what-doesnt-count", text: "What Doesn't Count" },
      {
        type: "ul",
        items: [
          "Off-the-shelf RTF kits assembled with no original design or code",
          "Purely AI-generated repos with no genuine engineering or journaling",
          "Non-aviation generic projects with a plane PNG slapped on the README",
        ],
      },
      {
        type: "callout",
        variant: "atc",
        title: "NOT SURE IF YOUR IDEA COUNTS?",
        text: "Pitch it in #takeoff-help on Slack with a 2-sentence summary and we'll give you clearance before you spend hours building.",
      },
    ],
  },
  {
    slug: "project-ideas",
    section: "flight-plan",
    title: "Project Ideas",
    description: "Beginner, intermediate, and ambitious aviation builds to spark your flight plan.",
    blocks: [
      { type: "h2", id: "beginner-friendly", text: "Beginner-Friendly Builds" },
      {
        type: "ul",
        items: [
          "Keychain Overhead Plane Spotter: ESP32 + OLED screen pulling public ADS-B data for planes flying above your house.",
          "Desktop Cockpit Switch Panel: RP2040 USB HID controller with toggle switches and rotary encoders for MSFS / X-Plane.",
          "2D ATC Radar Game: Browser-based air traffic control simulator with vectoring, altitude separation, and wind shear.",
        ],
      },
      { type: "h2", id: "intermediate-builds", text: "Intermediate Builds" },
      {
        type: "ul",
        items: [
          "Custom STM32/RP2040 Flight Controller PCB with IMU + barometer + blackbox SD logging.",
          "2.4GHz Open-Source RC Transmitter using RP2040, hall-effect gimbals, and nRF24/ELRS.",
          "1090MHz RTL-SDR Ground Station tracking local aircraft with custom flight-path analytics.",
        ],
      },
      { type: "h2", id: "ambitious-builds", text: "Ambitious Builds" },
      {
        type: "ul",
        items: [
          "3D-Printed Lightweight PLA Autonomous Fixed-Wing Plane with ArduPilot/iNav + GPS.",
          "Thrust-Vector-Controlled (TVC) Rocket Flight Computer with active PID stabilization.",
        ],
      },
    ],
  },
  {
    slug: "software-setup",
    section: "avionics",
    title: "Software & Avionics Setup",
    description: "Repo layout, README standards, and tools for software and firmware builds.",
    blocks: [
      { type: "h2", id: "repo-checklist", text: "Repository Structure" },
      {
        type: "p",
        text: "Keep everything in a clean, public GitHub repository so reviewers can verify your work quickly.",
      },
      {
        type: "code",
        label: "RECOMMENDED REPO TREE",
        code: `my-takeoff-project/
├── README.md          # Overview, renders, wiring, how to run
├── JOURNAL.md         # Timestamped build log + screenshots
├── cad/               # STEP / STL / F3D files (if hardware)
├── pcb/               # KiCad schematics, PCB, Gerbers, BOM
└── firmware/          # or src/ for software projects`,
      },
    ],
  },
  {
    slug: "hackatime",
    section: "avionics",
    title: "Using Hackatime",
    description: "How time tracking works for software vs. hardware projects.",
    blocks: [
      { type: "h2", id: "when-hackatime-is-used", text: "When to Use Hackatime" },
      {
        type: "p",
        text: "If your project involves writing code or firmware (VS Code, Neovim, JetBrains, Arduino IDE, PlatformIO, web apps, or sims), install Hackatime so your coding hours are automatically logged.",
      },
      {
        type: "callout",
        variant: "warning",
        title: "WHAT ABOUT CAD & HARDWARE WORK?",
        text: "Hackatime doesn't track Onshape, Fusion 360, KiCad, or physical soldering. For hardware work, keep a detailed Flight Log (JOURNAL.md) with dated entries, screenshots, and time spent.",
      },
    ],
  },
  {
    slug: "flight-log",
    section: "airframe",
    title: "Flight Log (Good Journaling)",
    description: "How to document CAD, PCB layout, and testing so your project sails through review.",
    blocks: [
      { type: "h2", id: "why-log", text: "Why Keep a Flight Log?" },
      {
        type: "p",
        text: "Your JOURNAL.md proves how your project evolved and helps reviewers understand your engineering decisions.",
      },
      {
        type: "checklist",
        title: "What every journal entry should have",
        items: [
          "Date and hours spent for that session",
          "What you designed, tested, or fixed (and why)",
          "Screenshots of KiCad schematics, CAD assemblies, or serial monitor output",
          "Any bugs, crashes, or revisions you made along the way",
        ],
      },
    ],
  },
  {
    slug: "sourcing-parts",
    section: "airframe",
    title: "Sourcing Parts & BOM",
    description: "How to build a clean Bill of Materials that reviewers can approve fast.",
    blocks: [
      { type: "h2", id: "bom-rules", text: "BOM Guidelines" },
      {
        type: "ul",
        items: [
          "Include part name, quantity, unit price, link, and shipping estimate in a bom.csv or README table.",
          "Prefer reliable suppliers (AliExpress, LCSC, JLCPCB, Amazon, DigiKey, Mouser, GetFPV).",
          "Keep LiPo battery safety in mind — include proper connectors (XT30/XT60) and a safe charger if needed.",
        ],
      },
    ],
  },
  {
    slug: "starter-projects",
    section: "flight-school",
    title: "Starter Guides",
    description: "Step-by-step blueprints if this is your very first hardware or aviation build.",
    blocks: [
      { type: "h2", id: "recommended-first-builds", text: "Recommended First Builds" },
      {
        type: "ul",
        items: [
          "Flight Sensor Keychain: ESP32-C3 + 0.96\" OLED + ADS-B Exchange / OpenSky API (~$12 in parts).",
          "Sim Instrument Panel: Raspberry Pi Pico (RP2040) + 6 toggle switches + 2 rotary encoders over USB HID.",
          "RP2040 Flight Controller: Custom 2-layer KiCad PCB with MPU-6050 IMU and BMP280 barometer.",
        ],
      },
      {
        type: "callout",
        variant: "tip",
        title: "FIRST TIME USING KICAD OR CAD?",
        text: "Check out Hack Club's hardware guides or ask in #takeoff-help — organizers are happy to review your schematic before you export Gerbers.",
      },
    ],
  },
  {
    slug: "shipping-guide",
    section: "shipping",
    title: "Shipping Your Project",
    description: "Everything reviewers check before approving funding and shop rewards.",
    blocks: [
      { type: "h2", id: "pre-ship-checklist", text: "Final Pre-Takeoff Checklist" },
      {
        type: "checklist",
        title: "Verify before clicking Submit",
        items: [
          "Public GitHub repo with a clear README.md and screenshots/renders",
          "Complete JOURNAL.md flight log covering the full build",
          "Accurate BOM with working purchase links and total cost",
          "Reproducible CAD (.step/.stl) or KiCad project + Gerbers (for hardware)",
          "Working demo video or live URL (for software / completed IRL builds)",
        ],
      },
    ],
  },
  {
    slug: "rewards-and-shop",
    section: "hangar",
    title: "Funding & Shop Prizes",
    description: "How project build funding and shop prizes work together.",
    blocks: [
      { type: "h2", id: "two-types-of-rewards", text: "Two Kinds of Rewards" },
      {
        type: "ul",
        items: [
          "Build Funding (Grants): Pays for the parts/PCBs needed to manufacture and assemble the project you designed and shipped.",
          "Shop Prizes: Earn credits toward aviation gear in the Takeoff shop — flight controllers, brushless motors, LiPo batteries, sensors, and tools for future builds.",
        ],
      },
    ],
  },
  {
    slug: "help-and-faq",
    section: "atc",
    title: "Control Tower & FAQ",
    description: "Need clearance or stuck on a schematic? Here is how to reach ATC.",
    blocks: [
      { type: "h2", id: "where-to-get-help", text: "Where to Get Help" },
      {
        type: "ul",
        items: [
          "Slack: Hop into #takeoff-help on the Hack Club Slack for quick answers.",
          "Dashboard Support: Once signed in, you can open a help ticket directly from your dashboard.",
        ],
      },
      { type: "h2", id: "common-questions", text: "Common Questions" },
      {
        type: "ul",
        items: [
          "Age requirement: 13 to 18 (inclusive).",
          "Team projects: Ask in #takeoff-help before starting so we can clarify funding splits.",
          "Cost limits: Keep BOMs reasonable and focused on what your project genuinely needs to fly or run.",
        ],
      },
    ],
  },
];

export function getDocBySlug(slug?: string): DocPage {
  const target = slug?.replace(/^\/+|\/+$/g, "") || "flight-briefing";
  return DOC_PAGES.find((p) => p.slug === target) ?? DOC_PAGES[0];
}

export function findDocStrict(slug: string): DocPage | undefined {
  return DOC_PAGES.find((p) => p.slug === slug);
}

export function getHeadings(page: DocPage) {
  return page.blocks.filter(
    (b): b is Extract<DocBlock, { type: "h2" | "h3" }> =>
      b.type === "h2" || b.type === "h3"
  );
}

export function getPrevNext(slug: string) {
  const index = DOC_PAGES.findIndex((p) => p.slug === slug);
  return {
    prev: index > 0 ? DOC_PAGES[index - 1] : null,
    next: index >= 0 && index < DOC_PAGES.length - 1 ? DOC_PAGES[index + 1] : null,
  };
}