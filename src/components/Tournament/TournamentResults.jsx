import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Clock, Trophy } from "lucide-react";
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

const teamShort = (name) => TEAM_SHORT_NAMES[name] || name;
const POSITIONS = ["1st", "2nd", "3rd", "4th", "5th"];
const POINTS_FOR = { "1st": 3, "2nd": 2, "3rd": 1, "4th": 0, "5th": 0 };
const SEASONS = ["S3", "S4", "S5"];

function ClubLogo({ name }) {
  const short = teamShort(name);
  const [failed, setFailed] = useState(false);

  if (!name || failed) {
    return (
      <span
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-fifa-border bg-fifa-bg text-[10px] font-semibold text-fifa-accent"
      >
        {name ? short.slice(0, 3).toUpperCase() : "—"}
      </span>
    );
  }

  return (
    <img
      src={`/logos/${short}.png`}
      alt=""
      aria-hidden="true"
      onError={() => setFailed(true)}
      className="h-8 w-8 shrink-0 rounded-full border border-fifa-border bg-fifa-bg object-cover"
    />
  );
}

const toDate = (createdAt) => {
  if (!createdAt) return null;
  const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (createdAt) => {
  const date = toDate(createdAt);
  if (!date) return "Date unavailable";
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const TournamentResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const seasonParam = searchParams.get("season");
  const selectedSeason = useMemo(
    () => (SEASONS.includes(seasonParam || "") ? seasonParam : "S3"),
    [seasonParam]
  );
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTournaments = async () => {
      setLoading(true);
      setError("");

      try {
        const tournamentsRef = collection(
          db,
          "seasons",
          selectedSeason,
          "tournaments"
        );
        const snapshot = await getDocs(tournamentsRef);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        data.sort(
          (a, b) =>
            (toDate(b.createdAt)?.getTime() || 0) -
            (toDate(a.createdAt)?.getTime() || 0)
        );
        setTournaments(data);
      } catch (fetchError) {
        console.error("Failed to fetch tournaments:", fetchError);
        setError("Tournament results could not be loaded. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, [selectedSeason]);

  const handleSeasonChange = (season) => {
    navigate(`/tournamentresults?season=${season}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loadin>Loading tournament results...</Loadin>
      </div>
    );
  }

  return (
    <section className="w-full rounded-2xl border border-fifa-border bg-fifa-surface p-4 sm:p-6">
      <header className="flex flex-col gap-4 border-b border-fifa-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-fifa-accent">
            Tournament records · {selectedSeason}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-fifa-text sm:text-3xl">
            Tournament results
          </h1>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label
            htmlFor="results-season"
            className="text-xs font-medium text-fifa-text-muted"
          >
            Season
          </label>
          <select
            id="results-season"
            value={selectedSeason}
            onChange={(event) => handleSeasonChange(event.target.value)}
            className="min-h-10 rounded-lg border border-fifa-border bg-fifa-bg px-3 text-sm text-fifa-text outline-none focus:border-fifa-accent"
          >
            {SEASONS.map((season) => (
              <option key={season} value={season}>
                {season}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="mt-5 flex min-h-16 items-center gap-3 rounded-xl border border-fifa-border bg-fifa-bg/30 px-4 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-fifa-border bg-fifa-surface text-fifa-accent">
          <Trophy size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-fifa-text-muted">Tournaments logged</p>
          <p className="mt-1 text-lg font-semibold text-fifa-text">
            {tournaments.length}
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => navigate(`/tournamentstats?season=${selectedSeason}`)}
          className="min-h-9 rounded-lg shadow-none"
        >
          Standings
        </Button>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-fifa-danger/25 bg-fifa-danger/[0.05] p-4 text-sm text-fifa-danger"
        >
          {error}
        </p>
      ) : tournaments.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-fifa-border px-5 py-12 text-center">
          <Clock size={24} className="mx-auto text-fifa-text-muted" />
          <p className="mt-3 text-sm font-medium text-fifa-text">No tournaments yet</p>
          <p className="mt-1 text-xs text-fifa-text-muted">
            Tournament results will appear here once they are recorded.
          </p>
        </div>
      ) : (
        <section className="mt-7">
          <h2 className="mb-3 text-sm font-semibold text-fifa-text">Results</h2>
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {tournaments.map((tournament, index) => {
              const results = tournament.results || {};

              return (
                <article
                  key={tournament.id}
                  className="rounded-xl border border-fifa-border bg-fifa-bg/20 p-3 sm:p-4"
                >
                  <header className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-fifa-border bg-fifa-surface text-fifa-accent">
                        <Trophy size={14} />
                      </span>
                      <h3 className="truncate text-sm font-medium text-fifa-text">
                        Tournament {tournaments.length - index}
                      </h3>
                    </div>
                    <time className="shrink-0 text-xs text-fifa-text-muted">
                      {formatDate(tournament.createdAt)}
                    </time>
                  </header>

                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                    {POSITIONS.map((position) => {
                      const teamName =
                        Object.entries(results).find(
                          ([, resultPosition]) => resultPosition === position
                        )?.[0] || "";
                      const positionColor =
                        position === "1st"
                          ? "text-fifa-accent"
                          : "text-fifa-text-muted";

                      return (
                        <div
                          key={position}
                          className="flex min-w-0 flex-col items-center gap-1.5 rounded-lg border border-fifa-border bg-fifa-surface/50 px-1 py-2"
                        >
                          <ClubLogo name={teamName} />
                          <span
                            className="max-w-full truncate text-center text-[10px] font-medium text-fifa-text"
                            title={teamName}
                          >
                            {teamName ? teamShort(teamName) : "—"}
                          </span>
                          <span
                            className={`text-[9px] font-medium uppercase ${positionColor}`}
                          >
                            {position}
                          </span>
                          {teamName && (
                            <span className="text-[9px] text-fifa-text-muted">
                              {POINTS_FOR[position]} pt
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </section>
  );
};

export default TournamentResults;
