import { createElement, useState } from "react";
import { Button } from "../components/ui/Button";
import { Anchor } from "../components/ui/Anchor";
import Reveal from "../components/ui/Reveal";
import { Radio, Search, Hammer, BarChart3, Shield, Wallet } from "lucide-react";

/* Shared box language: 2px border + hard offset shadow.
   The shadow needs ~4px of free space to the right and below. */
const PANEL =
  "rounded-2xl border-2 border-fifa-border bg-fifa-surface shadow-[4px_4px_0_0] shadow-fifa-border";

const SECTION_TITLE =
  "font-[manrope] text-2xl font-semibold tracking-[-0.03em] text-fifa-text sm:text-3xl";

const STATS = [
  { value: "Ready", label: "Roster setup" },
  { value: "Built", label: "Auction experience" },
  { value: "5", label: "Club identities" },
  { value: "0%", label: "Platform fee" },
];

const FEATURES = [
  {
    Icon: Radio,
    title: "Live Auctions",
    desc: "A focused auction room built for quick decisions and real-time bidding.",
  },
  {
    Icon: Search,
    title: "Player Market",
    desc: "Explore player profiles and ratings as soon as the roster is added.",
  },
  {
    Icon: Hammer,
    title: "Squad Building",
    desc: "Lay out your formation, lock your XI, and shape the roster nobody saw coming.",
  },
  {
    Icon: BarChart3,
    title: "Tournament Stats",
    desc: "Follow standings, ranks, and results as tournament data becomes available.",
  },
  {
    Icon: Shield,
    title: "Club Rivalry",
    desc: "Choose a club and build toward the top of the table with your fellow managers.",
  },
  {
    Icon: Wallet,
    title: "Zero Platform Fee",
    desc: "Every credit you win is yours. No cuts, no hidden costs — pure auction.",
  },
];

const STEPS = [
  {
    title: "Create your manager",
    desc: "Sign up and claim your seat at the table.",
  },
  {
    title: "Join a club",
    desc: "Pledge to one of five competing teams.",
  },
  {
    title: "Enter the auction",
    desc: "Step into the live room as players go under the hammer.",
  },
  {
    title: "Bid in real time",
    desc: "Outbid rivals before the clock runs out.",
  },
  {
    title: "Build & win",
    desc: "Assemble your squad and climb the leaderboard.",
  },
];

const TEAMS = [
  { name: "Wolves", code: "WOL", logo: "/logos/Wolves.png" },
  { name: "Bayern Munich", code: "BAY", logo: "/logos/Bayern.png" },
  { name: "Manchester City", code: "MCI", logo: "/logos/City.png" },
  { name: "Manchester United", code: "MUN", logo: "/logos/United.png" },
  { name: "Liverpool", code: "LIV", logo: "/logos/Liverpool.png" },
];

/* ─────────────────────────────────────────
   TeamBadge — logo image, falls back to
   monogram if the image is missing/broken
───────────────────────────────────────── */
function TeamBadge({ team }) {
  const [failed, setFailed] = useState(false);

  if (team.logo && !failed) {
    return (
      <img
        src={team.logo}
        alt={team.name}
        onError={() => setFailed(true)}
        className="h-12 w-12 rounded-full border border-fifa-border bg-fifa-elevated object-cover"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-fifa-border bg-fifa-elevated font-[manrope] text-xs font-semibold text-fifa-text-secondary"
    >
      {team.code}
    </span>
  );
}

const About = () => {
  return (
    <div className="min-h-screen w-full bg-fifa-bg text-fifa-text">
      <div className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6">
        {/* ── HERO ── */}
        <section className="pb-4 pt-12 sm:pt-20">
          <Reveal>
            <h1 className="font-[manrope] text-4xl font-semibold leading-[1.05] tracking-[-0.045em] text-fifa-text sm:text-6xl">
              <span className="text-fifa-text-secondary">Build your squad.</span>
              <br />
              Win the bid.
            </h1>
          </Reveal>

          <Reveal delay={80}>
            <p className="mt-5 max-w-xl text-base leading-7 text-fifa-text-secondary sm:text-lg">
              Auction22 is a team-based football auction for managers who love a
              smart signing. Create an account, explore the platform, and build
              your squad when the roster is ready.
            </p>
          </Reveal>

          <Reveal delay={160}>
            <div className="mt-7 flex flex-wrap gap-3">
              <Anchor to="/signup">
                <Button size="md" className="rounded-xl shadow-none">
                  Get started
                </Button>
              </Anchor>
              <Anchor to="/auction">
                <Button
                  size="md"
                  variant="outline"
                  className="rounded-xl border-fifa-border bg-transparent text-fifa-text shadow-none hover:bg-fifa-surface"
                >
                  Explore the auction room
                </Button>
              </Anchor>
            </div>
          </Reveal>
        </section>

        {/* ── STATS ── */}
        <section className="mt-10 sm:mt-12">
          <Reveal>
            <dl className={`${PANEL} grid grid-cols-2 sm:grid-cols-4`}>
              {STATS.map(({ value, label }, i) => (
                <div
                  key={label}
                  className={`border-fifa-border px-3 py-5 text-center ${
                    i % 2 === 1 ? "border-l" : ""
                  } ${i >= 2 ? "border-t sm:border-t-0" : ""} ${
                    i > 0 ? "sm:border-l" : ""
                  }`}
                >
                  <dd className="font-[manrope] text-2xl font-semibold tabular-nums tracking-tight text-fifa-text">
                    {value}
                  </dd>
                  <dt className="mt-1.5 text-[10px] uppercase tracking-[0.12em] text-fifa-text-muted">
                    {label}
                  </dt>
                </div>
              ))}
            </dl>
          </Reveal>
        </section>

        {/* ── ARENA ── */}
        <section className="mt-14 grid items-center gap-8 sm:mt-20 md:grid-cols-2 md:gap-12">
          <Reveal>
            <div>
              <h2 className={SECTION_TITLE}>One stage. Every star.</h2>
              <p className="mt-4 max-w-md text-base leading-7 text-fifa-text-secondary">
                Auction22 turns player trading into a live spectacle. When the
                roster is ready, managers compete for signings, shape their
                squads, and follow the season together.
              </p>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className={PANEL}>
              <div className="flex items-center gap-3 p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-fifa-accent font-[manrope] text-lg font-semibold tabular-nums text-fifa-bg">
                  91
                </span>
                <div className="min-w-0">
                  <p className="truncate font-[manrope] text-[15px] font-medium text-fifa-text">
                    Star Player
                  </p>
                  <p className="mt-0.5 text-xs text-fifa-text-muted">
                    ST · Reserve 500 credits
                  </p>
                </div>
              </div>
              <div className="flex items-end justify-between border-t border-fifa-border px-4 py-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-fifa-text-muted">
                    Current bid
                  </p>
                  <p className="mt-1 font-[manrope] text-lg font-semibold leading-none tabular-nums text-fifa-text">
                    1,240
                  </p>
                </div>
                <p className="text-xs tabular-nums text-fifa-text-muted">
                  04:12 left
                </p>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── FEATURES ── */}
        <section className="mt-14 sm:mt-20">
          <Reveal>
            <h2 className={SECTION_TITLE}>Everything to run the room</h2>
          </Reveal>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ Icon, title, desc }, i) => (
              <Reveal key={title} delay={(i % 3) * 80}>
                <div className={`${PANEL} flex h-full gap-3 p-4`}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fifa-elevated text-fifa-text-secondary">
                    {createElement(Icon, { size: 18 })}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-[manrope] text-[15px] font-medium text-fifa-text">
                      {title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-fifa-text-muted">
                      {desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="mt-14 sm:mt-20">
          <Reveal>
            <h2 className={SECTION_TITLE}>How a season flows</h2>
          </Reveal>

          <Reveal delay={80}>
            <ol
              className={`${PANEL} mt-6 grid divide-y divide-fifa-border md:grid-cols-5 md:divide-x md:divide-y-0`}
            >
              {STEPS.map(({ title, desc }, i) => (
                <li key={title} className="p-4">
                  <span className="text-xs tabular-nums text-fifa-text-muted">
                    0{i + 1}
                  </span>
                  <h3 className="mt-2 font-[manrope] text-sm font-medium text-fifa-text">
                    {title}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-fifa-text-muted">
                    {desc}
                  </p>
                </li>
              ))}
            </ol>
          </Reveal>
        </section>

        {/* ── TEAMS ── */}
        <section className="mt-14 sm:mt-20">
          <Reveal>
            <h2 className={SECTION_TITLE}>Five clubs. One crown.</h2>
          </Reveal>

          <div
            className={`${PANEL} mt-6 flex flex-wrap items-start justify-center gap-x-6 gap-y-5 p-5 sm:gap-x-10`}
          >
            {TEAMS.map((team, i) => (
              <Reveal key={team.name} delay={i * 70}>
                <div className="flex w-20 flex-col items-center gap-2 text-center">
                  <TeamBadge team={team} />
                  <span className="text-xs leading-4 text-fifa-text-muted">
                    {team.name}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="mt-14 sm:mt-20">
          <Reveal>
            <div className={`${PANEL} px-6 py-10 text-center sm:py-12`}>
              <h2 className={SECTION_TITLE}>Ready to build your squad?</h2>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Anchor to="/signup">
                  <Button size="sm" className="rounded-xl text-[12px] shadow-none">
                    Create account
                  </Button>
                </Anchor>
                <Anchor to="/login">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl border-fifa-border bg-transparent text-[12px] text-fifa-text shadow-none hover:bg-fifa-surface"
                  >
                    I already have one
                  </Button>
                </Anchor>
              </div>
            </div>
          </Reveal>
        </section>
      </div>
    </div>
  );
};

export default About;