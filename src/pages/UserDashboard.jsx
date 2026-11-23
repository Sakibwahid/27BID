import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import { db } from "../lib/firebase/config";
import { useAuth } from "../context/AuthContext";

import Loadin from "../components/ui/loadin";

import { LogOut, Medal, Trophy, User } from "lucide-react";
import { logoutUser } from "../lib/firebase/auth";

const STANDINGS_CACHE_KEY = "standings_cache_v1";
const CACHE_MAX_AGE_MS = 1000 * 60 * 5;
const DEFAULT_SEASON = "S3";
const SEASONS = ["S3", "S4", "S5"];
const PLAYER_SEASONS = ["S2", ...SEASONS];
const TEAM_IDS = {
  "FC Bayern Munich": "bayern05",
  "Manchester City F.C.": "city04",
  "Wolverhampton Wanderers F.C.": "wolves01",
  "Liverpool FC": "liverpool01",
  "Liverpool F.C.": "liverpool01",
  "Manchester United F.C.": "united03",
  "Paris Saint-Germain F.C.": "paris03",
  "Chelsea F.C.": "chelsea01",
  "Real Madrid C.F.": "realmadrid01",
};

/* Motion. Everything here is disabled for reduced-motion users. */
const MOTION_CSS = `
@media (prefers-reduced-motion: no-preference) {
  @keyframes dash-rise {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: none; }
  }
  @keyframes award-shine {
    0%   { transform: translateX(-130%); }
    55%, 100% { transform: translateX(130%); }
  }
  @keyframes award-float {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(-3px); }
  }
  .dash-rise { animation: dash-rise .6s cubic-bezier(.22,1,.36,1) backwards; animation-delay: var(--d, 0ms); }
  .award-shine::after { animation: award-shine 3.4s ease-in-out infinite; animation-delay: var(--d, 0ms); }
  .award-float { animation: award-float 3s ease-in-out infinite; }
}

/* Light sweep across winner cards (color comes from the theme token) */
.award-shine { position: relative; overflow: hidden; }
.award-shine::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  transform: translateX(-130%);
  background: linear-gradient(
    110deg,
    transparent 38%,
    color-mix(in srgb, var(--color-fifa-text) 45%, transparent) 50%,
    transparent 62%
  );
}
`;

/* Shared box language (same as PlayerCard): 2px border + hard offset shadow.
   The shadow needs ~4px of free space to the right and below. */
const PANEL =
  "rounded-2xl border-2 border-fifa-border bg-fifa-surface shadow-[4px_4px_0_0] shadow-fifa-border";

const SECTION_TITLE =
  "mb-2 px-0.5 text-[11px] uppercase tracking-[0.16em] text-fifa-text-muted";

/* How an achievement's `place` is shown */
const WINNER_PLACES = ["1st", "1", "first", "winner", "champion", "champions"];
const RUNNER_UP_PLACES = [
  "2nd",
  "2",
  "second",
  "runner up",
  "runner-up",
  "runnerup",
];

const getAward = (place) => {
  const key = String(place ?? "")
    .trim()
    .toLowerCase();
  if (WINNER_PLACES.includes(key)) return "winner";
  if (RUNNER_UP_PLACES.includes(key)) return "runnerUp";
  return "other";
};

const getTournamentPoints = (placement) => {
  switch (String(placement ?? "").trim().toLowerCase()) {
    case "1st":
    case "1":
    case "first":
      return 3;
    case "2nd":
    case "2":
    case "second":
      return 2;
    case "3rd":
    case "3":
    case "third":
      return 1;
    default:
      return 0;
  }
};

/* Winners first, then runners up, then everything else */
const AWARD_ORDER = { winner: 0, runnerUp: 1, other: 2 };

const AWARD_STYLES = {
  winner: {
    Icon: Trophy,
    card: "award-shine bg-fifa-accent text-fifa-bg shadow-[0_0_36px_-6px] shadow-fifa-accent/70",
    chip: "bg-fifa-bg/15",
    title: "text-2xl sm:text-3xl",
    sub: "text-fifa-bg/70",
    floats: true,
  },
  runnerUp: {
    Icon: Medal,
    card: "bg-fifa-text text-fifa-bg shadow-[0_0_28px_-8px] shadow-fifa-text/50",
    chip: "bg-fifa-bg/10",
    title: "text-lg sm:text-xl",
    sub: "text-fifa-bg/65",
    floats: false,
  },
  other: {
    Icon: Medal,
    card: "bg-fifa-elevated text-fifa-text",
    chip: "bg-fifa-bg/30",
    title: "text-lg sm:text-xl",
    sub: "text-fifa-text-muted",
    floats: false,
  },
};

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

const formatTournamentDate = (createdAt) => {
  const date = createdAt?.toDate?.() || (createdAt ? new Date(createdAt) : null);
  if (!date || Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function PlayerPhoto({ playerId, name }) {
  const [failed, setFailed] = useState(false);

  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-fifa-elevated text-fifa-text-muted">
      {failed ? (
        <User size={18} aria-hidden="true" />
      ) : (
        <img
          src={`/player_photos/${playerId}.png`}
          alt={name}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover object-top"
        />
      )}
    </span>
  );
}

const EmptyBox = ({ children }) => (
  <div className="rounded-2xl border-2 border-dashed border-fifa-border bg-fifa-surface px-5 py-8 text-center text-sm text-fifa-text-muted">
    {children}
  </div>
);

/* One achievement: Winner / Runner up are big and bold, anything else is quiet */
const AwardCard = ({ achievement, index }) => {
  const kind = getAward(achievement.place);
  const { Icon, card, chip, title, sub, floats } = AWARD_STYLES[kind];
  const label =
    kind === "winner"
      ? "Winner"
      : kind === "runnerUp"
        ? "Runner up"
        : achievement.place;

  return (
    <li
      className={`dash-rise relative flex min-h-28 flex-col justify-center overflow-hidden rounded-2xl p-3 sm:p-5 ${card}`}
      style={delay(160 + index * 60)}
    >
      <Icon
        size={75}
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-5 -right-4 opacity-[0.14]"
      />

      <div className="relative flex items-center gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${chip}`}
        >
          <Icon
            size={18}
            aria-hidden="true"
            className={floats ? "award-float" : undefined}
          />
        </span>
        <p
          className={`min-w-0 truncate font-[manrope] font-extrabold uppercase leading-none tracking-[-0.02em] ${title}`}
        >
          {label}
        </p>
      </div>

      <p
        className={`relative mt-3 truncate text-base font-semibold sm:text-lg ${sub}`}
      >
        {achievement.game} · {achievement.season}
      </p>
    </li>
  );
};

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, userData, loading: authLoading } = useAuth();

  const [initialState] = useState(readStandingsCache);
  const [standings, setStandings] = useState(initialState.standings);
  const [ready, setReady] = useState(initialState.ready);
  const [achievements, setAchievements] = useState([]);
  const [achievementsError, setAchievementsError] = useState("");
  const [recentTournaments, setRecentTournaments] = useState([]);
  const [topPlayers, setTopPlayers] = useState([]);
  const [teamDataLoading, setTeamDataLoading] = useState(true);
  const [teamDataError, setTeamDataError] = useState("");

  const normalizedUserTeam = useMemo(
    () => normalizeTeamName(userData?.teamName),
    [userData],
  );
  const userTeamId = userData?.teamId || TEAM_IDS[userData?.teamName] || null;

  /* ---------------- AUTH GUARD ---------------- */
  useEffect(() => {
    if (!authLoading && !userData) {
      navigate("/login");
    }
  }, [authLoading, userData, navigate]);

  /* ---------------- REALTIME USER ACHIEVEMENTS ---------------- */
  useEffect(() => {
    if (!user?.uid) {
      setAchievements([]);
      return;
    }

    return onSnapshot(
      doc(db, "users", user.uid),
      (snapshot) => {
        setAchievements(
          snapshot.exists() && Array.isArray(snapshot.data().achievements)
            ? snapshot.data().achievements
            : [],
        );
        setAchievementsError("");
      },
      (error) => {
        console.error("Failed to load user achievements:", error);
        setAchievementsError("Achievements could not be loaded.");
      },
    );
  }, [user?.uid]);

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
      (error) => console.error("Failed to load standings:", error),
    );

    return () => unsubscribe();
  }, []);

  /* ---------------- TEAM HISTORY AND PURCHASES ---------------- */
  useEffect(() => {
    if (!normalizedUserTeam) {
      setRecentTournaments([]);
      setTopPlayers([]);
      setTeamDataLoading(false);
      return;
    }

    let active = true;
    setTeamDataLoading(true);
    setTeamDataError("");

    const loadTeamData = async () => {
      try {
        const [tournamentSnapshots, purchaseSnapshots, playerSnapshot] =
          await Promise.all([
            Promise.all(
              SEASONS.map((season) =>
                getDocs(collection(db, "seasons", season, "tournaments")),
              ),
            ),
            userTeamId
              ? Promise.all(
                  PLAYER_SEASONS.map((season) =>
                    getDocs(
                      query(
                        collection(db, "season_players"),
                        where("teamId", "==", userTeamId),
                        where("seasonId", "==", season),
                      ),
                    ),
                  ),
                )
              : Promise.resolve([]),
            userTeamId
              ? getDocs(
                  query(
                    collection(db, "players"),
                    where("currentTeamId", "==", userTeamId),
                  ),
                )
              : Promise.resolve(null),
          ]);

        const tournaments = tournamentSnapshots
          .flatMap((snapshot, seasonIndex) =>
            snapshot.docs.map((doc) => ({
              id: doc.id,
              season: SEASONS[seasonIndex],
              ...doc.data(),
            })),
          )
          .map((tournament) => ({
            ...tournament,
            placement: tournament.results?.[normalizedUserTeam] || null,
          }))
          .filter((tournament) => tournament.placement)
          .sort((a, b) => {
            const dateA = a.createdAt?.toMillis?.() || 0;
            const dateB = b.createdAt?.toMillis?.() || 0;
            return dateB - dateA;
          })
          .slice(0, 5);

        const purchasedByPlayer = new Map();
        purchaseSnapshots.forEach((snapshot, seasonIndex) => {
          snapshot.docs.forEach((purchaseDoc) => {
            const purchase = purchaseDoc.data();
            const season = PLAYER_SEASONS[seasonIndex];
            const playerId =
              purchase.playerId ||
              (purchaseDoc.id.startsWith(`${season}_`)
                ? purchaseDoc.id.slice(season.length + 1)
                : purchaseDoc.id);
            const soldPrice = Number(purchase.soldPrice) || 0;
            const existing = purchasedByPlayer.get(playerId);
            if (playerId && soldPrice > (existing?.soldPrice || 0)) {
              purchasedByPlayer.set(playerId, { soldPrice });
            }
          });
        });

        (playerSnapshot?.docs || []).forEach((playerDoc) => {
          const player = playerDoc.data();
          const soldPrice = Number(player.soldPrice) || 0;
          const existing = purchasedByPlayer.get(playerDoc.id);
          if (soldPrice > (existing?.soldPrice || 0)) {
            purchasedByPlayer.set(playerDoc.id, { soldPrice });
          }
        });

        const currentPlayerDocs = new Map(
          (playerSnapshot?.docs || []).map((playerDoc) => [
            playerDoc.id,
            playerDoc.data(),
          ]),
        );
        const missingPlayerIds = [...purchasedByPlayer.keys()].filter(
          (playerId) => !currentPlayerDocs.has(playerId),
        );
        const historicalPlayerSnapshots = await Promise.all(
          missingPlayerIds.map((playerId) =>
            getDoc(doc(db, "players", playerId)),
          ),
        );
        historicalPlayerSnapshots.forEach((playerDoc) => {
          if (playerDoc.exists()) {
            currentPlayerDocs.set(playerDoc.id, playerDoc.data());
          }
        });

        const players = [...purchasedByPlayer.entries()]
          .map(([playerId, purchase]) => {
            const player = currentPlayerDocs.get(playerId);
            if (!player) return null;

            return {
              id: playerId,
              name:
                player.Name?.trim() ||
                player.common_name?.trim() ||
                [player.first_name, player.last_name].filter(Boolean).join(" ") ||
                "Unknown player",
              overall: Number(player.Overall) || 0,
              soldPrice: purchase.soldPrice,
              position: player.Position || "—",
            };
          })
          .filter((player) => player && player.soldPrice > 0)
          .sort((a, b) => b.soldPrice - a.soldPrice)
          .slice(0, 5);

        if (active) {
          setRecentTournaments(tournaments);
          setTopPlayers(players);
        }
      } catch (error) {
        console.error("Failed to load team dashboard data:", error);
        if (active) {
          setTeamDataError("Team history and purchases could not be loaded.");
        }
      } finally {
        if (active) setTeamDataLoading(false);
      }
    };

    loadTeamData();
    return () => {
      active = false;
    };
  }, [normalizedUserTeam, userTeamId]);

  /* ---------------- DERIVED VALUES ---------------- */

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

  const sortedAchievements = [...achievements]
    .reverse()
    .sort((a, b) => AWARD_ORDER[getAward(a.place)] - AWARD_ORDER[getAward(b.place)]);
  const recentTournamentPoints = recentTournaments.reduce(
    (total, tournament) => total + getTournamentPoints(tournament.placement),
    0,
  );

  return (
    <div className="relative min-h-screen px-4 py-8 text-fifa-text sm:px-7 sm:py-12 lg:px-10">
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
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-fifa-border bg-fifa-surface text-fifa-text-secondary transition hover:border-fifa-danger/50 hover:text-fifa-danger sm:w-auto sm:px-4"
          >
            <LogOut size={17} aria-hidden="true" />
            <span className="hidden text-sm sm:inline">Sign out</span>
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
                className="px-4 first:pl-0 sm:px-6 lg:px-12 lg:first:pl-12 lg:last:pr-0"
              >
                <p className="text-[11px] uppercase tracking-[0.18em] text-fifa-text-muted">
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

        {/* ---------- Achievements (no container, straight under the club) ---------- */}
        <section
          aria-labelledby="achievements-heading"
          className="mt-8 sm:mt-10"
        >
          <h2
            id="achievements-heading"
            className={`${SECTION_TITLE} dash-rise`}
            style={delay(130)}
          >
            Achievements
            {achievements.length > 0 && (
              <span className="tabular-nums"> · {achievements.length}</span>
            )}
          </h2>

          {achievementsError ? (
            <p role="alert" className="text-sm text-fifa-danger">
              {achievementsError}
            </p>
          ) : achievements.length ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sortedAchievements.map((achievement, index) => (
                <AwardCard
                  key={
                    achievement.id ||
                    `${achievement.game}-${achievement.season}-${index}`
                  }
                  achievement={achievement}
                  index={index}
                />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-fifa-text-muted">
              No achievements recorded yet.
            </p>
          )}
        </section>

        {/* ---------- Team history ---------- */}
        {teamDataError && (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-fifa-danger/25 bg-fifa-danger/[0.05] p-4 text-sm text-fifa-danger"
          >
            {teamDataError}
          </p>
        )}

        <section
          aria-label="Team history and top purchases"
          className="mt-8 grid gap-4 sm:mt-10 lg:grid-cols-2"
        >
          {/* Last 5 tournaments */}
          <div className="dash-rise" style={delay(300)}>
            <h2 className={SECTION_TITLE}>Last 5 tournaments</h2>

            {teamDataLoading ? (
              <div className={`${PANEL} px-3 py-2.5 text-xs text-fifa-text-muted`}>
                Loading tournament history...
              </div>
            ) : recentTournaments.length ? (
              <div className={`${PANEL} p-4 sm:px-5 sm:py-4`}>
                <div
                  aria-label="Recent tournament placements and total points"
                  className="grid items-center gap-2 sm:gap-3"
                  style={{
                    gridTemplateColumns: `minmax(3.5rem, auto) repeat(${recentTournaments.length}, minmax(0, 1fr))`,
                  }}
                >
                  <div className="min-w-0 pr-1">
                    <p className="whitespace-nowrap font-[manrope] text-lg font-extrabold leading-tight tabular-nums text-fifa-accent sm:text-xl">
                      {recentTournamentPoints}
                      <span className="ml-0.5 text-[10px] font-bold sm:text-xs">pts</span>
                    </p>
                  </div>
                  {recentTournaments.map((tournament) => {
                    const award = getAward(tournament.placement);
                    const textColor =
                      award === "winner"
                        ? "text-fifa-accent"
                        : award === "runnerUp"
                          ? "text-fifa-info"
                          : "text-fifa-text-secondary";

                    return (
                      <div
                        key={`${tournament.season}_${tournament.id}`}
                        className="min-w-0 text-center"
                      >
                        <p
                          className={`truncate text-base font-extrabold leading-none tracking-tight sm:text-lg ${textColor}`}
                        >
                          {tournament.placement}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className={`${PANEL} px-3 py-2.5 text-xs text-fifa-text-muted`}>
                No tournament results recorded yet.
              </div>
            )}
          </div>

          {/* Highest bought players */}
          <div className="dash-rise" style={delay(360)}>
            <h2 className={SECTION_TITLE}>Highest bought players</h2>

            {teamDataLoading ? (
              <EmptyBox>Loading purchases...</EmptyBox>
            ) : topPlayers.length ? (
              <ul
                className={`${PANEL} divide-y divide-fifa-border overflow-hidden`}
              >
                {topPlayers.map((player, index) => (
                  <li
                    key={player.id}
                    className="flex items-center gap-3 px-3 py-2.5"
                  >
                    <span className="w-4 shrink-0 text-center text-xs tabular-nums text-fifa-text-muted">
                      {index + 1}
                    </span>
                    <PlayerPhoto playerId={player.id} name={player.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-[manrope] text-[15px] font-medium tracking-tight text-fifa-text">
                        {player.name}
                      </p>
                      <p className="mt-0.5 text-xs text-fifa-text-muted">
                        {player.position} · {player.overall} OVR
                      </p>
                    </div>
                    <span className="shrink-0 font-[manrope] text-base font-semibold tabular-nums text-fifa-text">
                      {player.soldPrice}M
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyBox>No player purchases recorded yet.</EmptyBox>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default UserDashboard;