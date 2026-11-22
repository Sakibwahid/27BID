import { createElement, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onSnapshot, collection } from "firebase/firestore";

import { db } from "../lib/firebase/config";
import { useAuth } from "../context/AuthContext";

import { Anchor } from "../components/ui/Anchor";
import Loadin from "../components/ui/loadin";

import {
  ArrowUpRight,
  BarChart3,
  Gavel,
  LogOut,
  Shield,
  Users,
} from "lucide-react";
import { logoutUser } from "../lib/firebase/auth";

const STANDINGS_CACHE_KEY = "standings_cache_v1";
const CACHE_MAX_AGE_MS = 1000 * 60 * 5;
const DEFAULT_SEASON = "S3";

/* Entrance motion. Disabled automatically for reduced-motion users. */
const MOTION_CSS = `
@media (prefers-reduced-motion: no-preference) {
  @keyframes dash-rise {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: none; }
  }
  .dash-rise { animation: dash-rise .6s cubic-bezier(.22,1,.36,1) backwards; animation-delay: var(--d, 0ms); }
}
`;

/* Shared box language (same as PlayerCard): 2px border + hard offset shadow.
   The shadow needs ~4px of free space to the right and below. */
const PANEL =
  "rounded-2xl border-2 border-fifa-border bg-fifa-surface shadow-[4px_4px_0_0] shadow-fifa-border";

const PANEL_INTERACTIVE =
  "transition duration-150 hover:-translate-x-px hover:-translate-y-px hover:shadow-[5px_5px_0_0] active:translate-x-1 active:translate-y-1 active:shadow-[0_0_0_0]";

const readStandingsCache = () => {
  try {
    const cached = localStorage.getItem(STANDINGS_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed?.data && Date.now() - parsed.savedAt < CACHE_MAX_AGE_MS) {
        return { standings: parsed.data, ready: true };
      }
    }
  } catch {
    localStorage.removeItem(STANDINGS_CACHE_KEY);
  }

  return { standings: [], ready: false };
};

const normalizeTeamName = (name) => {
  if (!name) return name;
  return name.replace(/\s+FC$/, " F.C.").replace(/\s+C\.F\.$/, " C.F.");
};

const sortStandings = (a, b) => {
  if ((b.totalPoints || 0) !== (a.totalPoints || 0))
    return (b.totalPoints || 0) - (a.totalPoints || 0);
  if ((b.firstCount || 0) !== (a.firstCount || 0))
    return (b.firstCount || 0) - (a.firstCount || 0);
  return (b.secondCounts || 0) - (a.secondCounts || 0);
};

/* stagger helper */
const delay = (ms) => ({ "--d": `${ms}ms` });

const actionTiles = [
  { to: "/auction", label: "Auction room", Icon: Gavel },
  { to: "/players", label: "Player market", Icon: Users },
  { to: "/user/squad", label: "Your squad", Icon: Shield },
  { to: "/tournamentstats", label: "League standings", Icon: BarChart3 },
];

const UserDashboard = () => {
  const navigate = useNavigate();
  const { userData, loading: authLoading } = useAuth();

  const [initialState] = useState(readStandingsCache);
  const [standings, setStandings] = useState(initialState.standings);
  const [ready, setReady] = useState(initialState.ready);

  /* ---------------- AUTH GUARD ---------------- */
  useEffect(() => {
    if (!authLoading && !userData) {
      navigate("/login");
    }
  }, [authLoading, userData, navigate]);

  /* ---------------- REALTIME STANDINGS ---------------- */
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "seasons", DEFAULT_SEASON, "standings"),
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => ({
            name: doc.id,
            ...doc.data(),
          }))
          .sort(sortStandings);

        setStandings(data);
        setReady(true);

        localStorage.setItem(
          STANDINGS_CACHE_KEY,
          JSON.stringify({
            data,
            savedAt: Date.now(),
          }),
        );
      },
    );

    return () => unsubscribe();
  }, []);

  /* ---------------- DERIVED VALUES ---------------- */
  const normalizedUserTeam = useMemo(
    () => normalizeTeamName(userData?.teamName),
    [userData],
  );

  const userRank = useMemo(() => {
    if (!normalizedUserTeam) return null;
    const idx = standings.findIndex((t) => t.name === normalizedUserTeam);
    return idx >= 0 ? idx + 1 : null;
  }, [standings, normalizedUserTeam]);

  const userPoints = useMemo(() => {
    if (!normalizedUserTeam) return 0;
    return (
      standings.find((t) => t.name === normalizedUserTeam)?.totalPoints || 0
    );
  }, [standings, normalizedUserTeam]);

  const handleSignOut = async () => {
    const result = await logoutUser();
    if (!result.success) {
      console.error("Logout failed:", result.error);
      return;
    }

    navigate("/login", { replace: true });
  };

  /* ---------------- LOADING LOGIC ---------------- */
  if (authLoading || (!userData && !ready)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fifa-bg">
        <Loadin>Loading dashboard...</Loadin>
      </div>
    );
  }

  const stats = [
    { label: "Rank", value: userRank ? `#${userRank}` : "—", accent: true },
    { label: "Points", value: userPoints },
  ];

  return (
    <div className="min-h-screen bg-fifa-bg px-4 py-8 text-fifa-text sm:px-7 sm:py-12 lg:px-10">
      <style>{MOTION_CSS}</style>

      <div className="mx-auto max-w-6xl">
        {/* ---------- Greeting ---------- */}
        <div
          className="dash-rise flex items-center justify-between gap-4"
          style={delay(0)}
        >
          <h1 className="font-[manrope] text-lg font-medium tracking-tight text-fifa-text-secondary sm:text-xl">
            Welcome back, {userData?.username || "Manager"}.
          </h1>
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Sign out"
            title="Sign out"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full border border-fifa-border text-fifa-text-secondary transition hover:border-fifa-danger/50 hover:text-fifa-danger sm:w-auto sm:px-4"
          >
            <LogOut size={17} aria-hidden="true" />
            <span className="hidden text-sm font-medium sm:inline">
              Sign out
            </span>
          </button>
        </div>

        {/* ---------- Club standing (primary) ---------- */}
        <section
          aria-label="Club standing"
          className={`${PANEL} dash-rise mt-4 flex flex-col gap-6 p-6 sm:mt-5 sm:p-9 lg:flex-row lg:items-center lg:justify-between`}
          style={delay(80)}
        >
          <h2 className="min-w-0 break-words font-[manrope] text-3xl font-semibold leading-tight tracking-[-0.04em] text-fifa-text sm:text-4xl">
            {userData?.teamName || "No club selected"}
          </h2>

          <div className="grid grid-cols-2 divide-x divide-fifa-border border-t border-fifa-border pt-6 lg:border-l lg:border-t-0 lg:pt-0">
            {stats.map(({ label, value, accent }) => (
              <div
                key={label}
                className="px-6 first:pl-0 lg:px-12 lg:first:pl-12 lg:last:pr-0"
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-fifa-text-muted">
                  {label}
                </p>
                <p
                  className={`mt-2 font-[manrope] text-5xl font-semibold tabular-nums tracking-[-0.05em] sm:text-6xl ${
                    accent ? "text-fifa-accent" : "text-fifa-text"
                  }`}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Quick access ---------- */}
        <section aria-label="Quick access" className="mt-8 sm:mt-10">
          <div className="grid gap-4 sm:grid-cols-2">
            {actionTiles.map(({ to, label, Icon }, i) => (
              <Anchor
                to={to}
                key={to}
                style={delay(180 + i * 50)}
                className={`${PANEL} ${PANEL_INTERACTIVE} dash-rise group flex min-h-20 items-center gap-4 p-4 sm:p-5`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-fifa-elevated text-fifa-text-secondary transition group-hover:text-fifa-accent">
                  {createElement(Icon, { size: 18 })}
                </span>

                <span className="min-w-0 flex-1 truncate font-[manrope] text-base font-semibold tracking-tight text-fifa-text">
                  {label}
                </span>

                <ArrowUpRight
                  size={17}
                  aria-hidden="true"
                  className="shrink-0 text-fifa-text-muted transition duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fifa-text"
                />
              </Anchor>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default UserDashboard;