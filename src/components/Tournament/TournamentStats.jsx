import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate, useSearchParams } from "react-router-dom";
import { db } from "../../lib/firebase/config";
import { Button } from "../ui/Button";
import Loadin from "../ui/loadin";

const TEAM_SHORT_NAMES = {
  "Wolverhampton Wanderers F.C.": "Wolves",
  "FC Bayern Munich": "Bayern",
  "Manchester City F.C.": "Man City",
  "Paris Saint-Germain F.C.": "PSG",
  "Liverpool F.C.": "Liverpool",
};

const SEASONS = ["S3", "S4", "S5"];
const teamShort = (name) => TEAM_SHORT_NAMES[name] || name;

/* Shared box language: 2px border + hard offset shadow.
   The shadow needs ~4px of free space to the right and below. */
const PANEL =
  "rounded-2xl border-2 border-fifa-border bg-fifa-surface shadow-[4px_4px_0_0] shadow-fifa-border";

const SECTION_TITLE =
  "mb-2 px-0.5 text-[11px] uppercase tracking-[0.16em] text-fifa-text-muted";

const sortTeams = (a, b) => {
  if ((b.totalPoints || 0) !== (a.totalPoints || 0))
    return (b.totalPoints || 0) - (a.totalPoints || 0);
  if ((b.firstCount || 0) !== (a.firstCount || 0))
    return (b.firstCount || 0) - (a.firstCount || 0);
  if ((b.secondCounts || 0) !== (a.secondCounts || 0))
    return (b.secondCounts || 0) - (a.secondCounts || 0);
  if ((b.thirdCount || 0) !== (a.thirdCount || 0))
    return (b.thirdCount || 0) - (a.thirdCount || 0);
  return (a.zeroCounts || 0) - (b.zeroCounts || 0);
};

function ClubLogo({ name, size = "h-9 w-9" }) {
  const short = teamShort(name);
  const [failed, setFailed] = useState(false);

  if (!failed) {
    return (
      <img
        src={`/logos/${short}.png`}
        alt=""
        aria-hidden="true"
        onError={() => setFailed(true)}
        className={`${size} shrink-0 rounded-full border border-fifa-border bg-fifa-bg object-cover`}
      />
    );
  }

  return (
    <span
      className={`${size} flex shrink-0 items-center justify-center rounded-full border border-fifa-border bg-fifa-bg text-[10px] text-fifa-text-secondary`}
      aria-hidden="true"
    >
      {short.slice(0, 3).toUpperCase()}
    </span>
  );
}

const TournamentStats = ({
  selectedSeason: selectedSeasonProp,
  onSeasonChange,
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const seasonParam = searchParams.get("season");
  const selectedSeason =
    selectedSeasonProp ||
    (SEASONS.includes(seasonParam || "") ? seasonParam : "S4");
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleSeasonChange = (season) => {
    if (onSeasonChange) {
      onSeasonChange(season);
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("season", season);
    setSearchParams(nextParams);
  };

  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      setError("");

      try {
        const standingsRef = collection(
          db,
          "seasons",
          selectedSeason,
          "standings"
        );
        const snapshot = await getDocs(standingsRef);
        const data = snapshot.docs.map((doc) => ({
          name: doc.id,
          ...doc.data(),
        }));
        data.sort(sortTeams);
        setTeams(data);
      } catch (fetchError) {
        console.error("Failed to fetch standings:", fetchError);
        setError("Standings could not be loaded. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [selectedSeason]);

  const stats = useMemo(() => {
    const mostFinalsWonTeam = teams.reduce(
      (leader, team) =>
        (team.firstCount || 0) > (leader?.firstCount || 0) ? team : leader,
      null
    );
    const mostFinalsPlayedTeam = teams.reduce(
      (leader, team) =>
        (team.firstCount || 0) + (team.secondCounts || 0) >
        (leader?.firstCount || 0) + (leader?.secondCounts || 0)
          ? team
          : leader,
      null
    );
    const bestRateTeam = teams.reduce((leader, team) => {
      const leaderFinals =
        (leader?.firstCount || 0) + (leader?.secondCounts || 0);
      const teamFinals = (team.firstCount || 0) + (team.secondCounts || 0);
      const leaderRate = leaderFinals
        ? (leader.firstCount || 0) / leaderFinals
        : -1;
      const teamRate = teamFinals
        ? (team.firstCount || 0) / teamFinals
        : -1;
      return teamRate > leaderRate ? team : leader;
    }, null);
    const bestRateDenominator = bestRateTeam
      ? (bestRateTeam.firstCount || 0) + (bestRateTeam.secondCounts || 0)
      : 0;
    const totalPoints = teams.reduce(
      (sum, team) => sum + (team.totalPoints || 0),
      0
    );

    return {
      tournaments: Math.round(totalPoints / 6),
      finalsWon: Math.max(...teams.map((team) => team.firstCount || 0), 0),
      finalsWonTeam: mostFinalsWonTeam?.name,
      finalsPlayed: Math.max(
        ...teams.map(
          (team) => (team.firstCount || 0) + (team.secondCounts || 0)
        ),
        0
      ),
      finalsPlayedTeam: mostFinalsPlayedTeam?.name,
      bestRate: bestRateDenominator
        ? Math.round(
            ((bestRateTeam.firstCount || 0) / bestRateDenominator) * 100
          )
        : 0,
      bestRateTeam: bestRateTeam?.name,
      maxPoints: Math.max(...teams.map((team) => team.totalPoints || 0), 1),
    };
  }, [teams]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div
          className={`${PANEL} flex min-h-64 items-center justify-center`}
        >
          <Loadin>Loading standings...</Loadin>
        </div>
      </div>
    );
  }

  const summary = [
    { label: "Tournaments played", value: stats.tournaments },
    {
      label: "Most finals won",
      value: stats.finalsWon,
      team: stats.finalsWonTeam,
    },
    {
      label: "Most finals played",
      value: stats.finalsPlayed,
      team: stats.finalsPlayedTeam,
    },
    {
      label: "Best final win rate",
      value: `${stats.bestRate}%`,
      team: stats.bestRateTeam,
    },
  ];

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      {/* ---------- Header ---------- */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-[manrope] text-2xl font-semibold tracking-[-0.03em] text-fifa-text sm:text-3xl">
            Tournament standings
          </h1>
          <p className="mt-1 text-xs text-fifa-text-muted">
            League table · {selectedSeason}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            role="group"
            aria-label="Select season"
            className="inline-flex rounded-xl border border-fifa-border bg-fifa-surface p-1"
          >
            {SEASONS.map((season) => (
              <button
                key={season}
                type="button"
                aria-pressed={selectedSeason === season}
                onClick={() => handleSeasonChange(season)}
                className={`h-8 rounded-lg px-3 text-xs font-medium transition ${
                  selectedSeason === season
                    ? "bg-fifa-accent text-fifa-bg"
                    : "text-fifa-text-secondary hover:bg-fifa-elevated hover:text-fifa-text"
                }`}
              >
                {season}
              </button>
            ))}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              navigate(`/tournamentresults?season=${selectedSeason}`)
            }
            className="h-10 w-fit shrink-0 whitespace-nowrap rounded-xl shadow-none"
          >
            Detailed
          </Button>
        </div>
      </header>

      {/* ---------- Summary strip ---------- */}
      <dl
        className={`${PANEL} mt-5 grid grid-cols-2 lg:grid-cols-4`}
      >
        {summary.map(({ label, value, team }, i) => (
          <div
            key={label}
            className={`min-w-0 border-fifa-border px-3 py-3 sm:px-4 ${
              i % 2 === 1 ? "border-l" : ""
            } ${i >= 2 ? "border-t lg:border-t-0" : ""} ${
              i > 0 ? "lg:border-l" : ""
            }`}
          >
            <dt className="truncate text-[10px] uppercase tracking-[0.12em] text-fifa-text-muted">
              {label}
            </dt>
            <dd className="mt-1.5 flex items-baseline gap-2">
              <span className="font-[manrope] text-lg font-semibold leading-none tabular-nums text-fifa-text">
                {value}
              </span>
              {team && (
                <span className="truncate text-xs text-fifa-text-muted">
                  {teamShort(team)}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>

      {error ? (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-fifa-danger/25 bg-fifa-danger/[0.05] p-4 text-sm text-fifa-danger"
        >
          {error}
        </p>
      ) : teams.length === 0 ? (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-fifa-border bg-fifa-surface px-5 py-10 text-center">
          <p className="text-sm font-medium text-fifa-text">No standings yet</p>
          <p className="mt-2 text-xs text-fifa-text-muted">
            Standings will appear here after tournament results are recorded.
          </p>
        </div>
      ) : (
        <>
          {/* ---------- Table ---------- */}
          <section className="mt-6">
            <h2 className={SECTION_TITLE}>Current standings</h2>
            <div className={`${PANEL} overflow-hidden`}>
              <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_4.5rem] gap-3 bg-fifa-elevated px-3 py-2.5 text-[10px] uppercase tracking-wider text-fifa-text-muted sm:grid-cols-[3rem_minmax(0,1fr)_minmax(7rem,0.6fr)_5rem] sm:px-4">
                <span>Rank</span>
                <span>Club</span>
                <span className="hidden sm:block">Points</span>
                <span className="text-right sm:hidden">Pts</span>
                <span className="hidden text-right sm:block">Total</span>
              </div>
              {teams.map((team, index) => {
                const percent = Math.max(
                  ((team.totalPoints || 0) / stats.maxPoints) * 100,
                  3
                );
                const isLeader = index === 0 && (team.totalPoints || 0) > 0;

                return (
                  <div
                    key={team.name}
                    className="grid grid-cols-[2.5rem_minmax(0,1fr)_4.5rem] items-center gap-3 border-t border-fifa-border px-3 py-2.5 sm:grid-cols-[3rem_minmax(0,1fr)_minmax(7rem,0.6fr)_5rem] sm:px-4"
                  >
                    <span className="text-sm tabular-nums text-fifa-text-muted">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="flex min-w-0 items-center gap-3">
                      <ClubLogo name={team.name} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-fifa-text">
                          {teamShort(team.name)}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] text-fifa-text-muted">
                          1st {team.firstCount || 0} · 2nd{" "}
                          {team.secondCounts || 0} · 3rd {team.thirdCount || 0}
                        </p>
                      </div>
                    </div>
                    <div className="hidden sm:block">
                      <div
                        role="progressbar"
                        aria-label={`${teamShort(team.name)} points`}
                        aria-valuenow={team.totalPoints || 0}
                        aria-valuemin={0}
                        aria-valuemax={stats.maxPoints}
                        className="h-1.5 overflow-hidden rounded-full bg-fifa-elevated"
                      >
                        <div
                          className="h-full rounded-full bg-fifa-text-secondary"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-right">
                      <span
                        className={
                          isLeader
                            ? "inline-block min-w-9 rounded-lg bg-fifa-accent px-2 py-0.5 text-center font-[manrope] text-sm font-semibold tabular-nums text-fifa-bg"
                            : "font-[manrope] text-sm font-semibold tabular-nums text-fifa-text"
                        }
                      >
                        {team.totalPoints || 0}
                      </span>
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ---------- Chart ---------- */}
          <section className="mt-6">
            <h2 className={SECTION_TITLE}>Points by club</h2>
            <div
              className={`${PANEL} flex h-48 items-end gap-3 px-3 pb-3 pt-4 sm:gap-5 sm:px-5`}
            >
              {teams.map((team, index) => {
                const height = Math.max(
                  ((team.totalPoints || 0) / stats.maxPoints) * 100,
                  2
                );
                const isLeader = index === 0 && (team.totalPoints || 0) > 0;

                return (
                  <div
                    key={team.name}
                    className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                  >
                    <span className="text-xs tabular-nums text-fifa-text-secondary">
                      {team.totalPoints || 0}
                    </span>
                    <div className="flex h-28 w-full items-end overflow-hidden rounded-t-md bg-fifa-elevated">
                      <div
                        className={`w-full rounded-t-md ${
                          isLeader ? "bg-fifa-accent" : "bg-fifa-text-secondary"
                        }`}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="max-w-full truncate text-center text-[10px] text-fifa-text-muted">
                      {teamShort(team.name)}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </main>
  );
};

export default TournamentStats;