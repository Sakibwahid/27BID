import { createElement, useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../../lib/firebase/config";
import { Button } from "../ui/Button";
import Loadin from "../ui/loadin";
import { Crown, Medal, Percent, Trophy } from "lucide-react";

const TEAM_SHORT_NAMES = {
  "Wolverhampton Wanderers F.C.": "Wolves",
  "FC Bayern Munich": "Bayern",
  "Manchester City F.C.": "Man City",
  "Paris Saint-Germain F.C.": "PSG",
  "Liverpool F.C.": "Liverpool",
};

const teamShort = (name) => TEAM_SHORT_NAMES[name] || name;

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

function ClubLogo({ name, size = "h-10 w-10" }) {
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
      className={`${size} flex shrink-0 items-center justify-center rounded-full border border-fifa-border bg-fifa-bg text-xs font-semibold text-fifa-accent`}
      aria-hidden="true"
    >
      {short.slice(0, 3).toUpperCase()}
    </span>
  );
}

const TournamentStats = ({ selectedSeason = "S3" }) => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      <div className="flex min-h-64 items-center justify-center rounded-2xl border border-fifa-border bg-fifa-surface">
        <Loadin>Loading standings...</Loadin>
      </div>
    );
  }

  const summary = [
    { label: "Tournaments played", value: stats.tournaments, Icon: Trophy },
    {
      label: "Most finals won",
      value: stats.finalsWon,
      team: stats.finalsWonTeam,
      Icon: Crown,
    },
    {
      label: "Most finals played",
      value: stats.finalsPlayed,
      team: stats.finalsPlayedTeam,
      Icon: Medal,
    },
    {
      label: "Best final win rate",
      value: `${stats.bestRate}%`,
      team: stats.bestRateTeam,
      Icon: Percent,
    },
  ];

  return (
    <section className="w-full rounded-2xl border border-fifa-border bg-fifa-surface p-4 sm:p-6">
      <header className="flex flex-col gap-4 border-b border-fifa-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-fifa-accent">
            League table · {selectedSeason}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-fifa-text sm:text-3xl">
            Tournament standings
          </h1>
        </div>
        <Button
          size="sm"
          onClick={() =>
            navigate(`/tournamentresults?season=${selectedSeason}`)
          }
          className="min-h-10 rounded-lg shadow-none"
        >
          View results
        </Button>
      </header>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map(({ label, value, team, Icon }) => (
          <article
            key={label}
            className="flex min-h-20 items-center gap-3 rounded-xl border border-fifa-border bg-fifa-bg/30 p-4"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-fifa-border bg-fifa-surface text-fifa-accent">
              {createElement(Icon, { size: 16 })}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium uppercase tracking-wider text-fifa-text-muted">
                {label}
              </p>
              {team && (
                <p className="mt-1 truncate text-sm font-medium text-fifa-text">
                  {teamShort(team)}
                </p>
              )}
            </div>
            <p className="shrink-0 text-xl font-semibold text-fifa-accent">
              {value}
            </p>
          </article>
        ))}
      </div>

      {error ? (
        <p role="alert" className="mt-6 rounded-xl border border-fifa-danger/25 bg-fifa-danger/[0.05] p-4 text-sm text-fifa-danger">
          {error}
        </p>
      ) : teams.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-fifa-border px-5 py-10 text-center">
          <p className="text-sm font-medium text-fifa-text">No standings yet</p>
          <p className="mt-2 text-xs text-fifa-text-muted">
            Standings will appear here after tournament results are recorded.
          </p>
        </div>
      ) : (
        <>
          <section className="mt-7">
            <h2 className="mb-3 text-sm font-semibold text-fifa-text">
              Current standings
            </h2>
            <div className="overflow-hidden rounded-xl border border-fifa-border">
              <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_4.5rem] gap-3 bg-fifa-bg/50 px-3 py-2.5 text-[10px] font-medium uppercase tracking-wider text-fifa-text-muted sm:grid-cols-[3rem_minmax(0,1fr)_minmax(7rem,0.6fr)_5rem] sm:px-4">
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

                return (
                  <div
                    key={team.name}
                    className="grid grid-cols-[2.5rem_minmax(0,1fr)_4.5rem] items-center gap-3 border-t border-fifa-border px-3 py-3 sm:grid-cols-[3rem_minmax(0,1fr)_minmax(7rem,0.6fr)_5rem] sm:px-4"
                  >
                    <span className="text-sm font-medium text-fifa-text-muted">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="flex min-w-0 items-center gap-3">
                      <ClubLogo name={team.name} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-fifa-text">
                          {teamShort(team.name)}
                        </p>
                        <p className="mt-1 truncate text-[10px] text-fifa-text-muted">
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
                        className="h-1.5 overflow-hidden rounded-full bg-fifa-bg"
                      >
                        <div
                          className="h-full rounded-full bg-fifa-accent"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-right text-base font-semibold text-fifa-text">
                      {team.totalPoints || 0}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-7">
            <h2 className="mb-3 text-sm font-semibold text-fifa-text">
              Points by club
            </h2>
            <div className="flex h-56 items-end gap-3 rounded-xl border border-fifa-border bg-fifa-bg/30 px-3 pb-3 pt-5 sm:gap-5 sm:px-5">
              {teams.map((team) => {
                const height = Math.max(
                  ((team.totalPoints || 0) / stats.maxPoints) * 100,
                  2
                );

                return (
                  <div
                    key={team.name}
                    className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                  >
                    <span className="text-xs font-medium text-fifa-text">
                      {team.totalPoints || 0}
                    </span>
                    <div className="flex h-36 w-full items-end overflow-hidden rounded-t-md bg-fifa-surface">
                      <div
                        className="w-full rounded-t-md bg-fifa-accent"
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
    </section>
  );
};

export default TournamentStats;
