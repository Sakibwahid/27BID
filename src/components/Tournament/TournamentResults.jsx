import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Clock } from "lucide-react";
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

/* Shared box language: 2px border + hard offset shadow.
   The shadow needs ~4px of free space to the right and below. */
const PANEL =
  "rounded-2xl border-2 border-fifa-border bg-fifa-surface shadow-[4px_4px_0_0] shadow-fifa-border";

function ClubLogo({ name }) {
  const short = teamShort(name);
  const [failed, setFailed] = useState(false);

  if (!name || failed) {
    return (
      <span
        aria-hidden="true"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-fifa-border bg-fifa-bg text-[9px] text-fifa-text-secondary"
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
      className="h-7 w-7 shrink-0 rounded-full border border-fifa-border bg-fifa-bg object-cover"
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
    () => (SEASONS.includes(seasonParam || "") ? seasonParam : "S4"),
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
      <div className="mx-auto flex min-h-[60vh] w-full max-w-7xl items-center justify-center px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <Loadin>Loading tournament results...</Loadin>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      {/* ---------- Header ---------- */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-[manrope] text-2xl font-semibold tracking-[-0.03em] text-fifa-text sm:text-3xl">
            Tournament results
          </h1>
          <p className="mt-1 text-xs text-fifa-text-muted">
            {selectedSeason} · {tournaments.length} tournament
            {tournaments.length === 1 ? "" : "s"}
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
            onClick={() => navigate(`/tournamentstats?season=${selectedSeason}`)}
            className="h-10 shrink-0 whitespace-nowrap rounded-xl shadow-none"
          >
            Standings
          </Button>
        </div>
      </header>

      {/* ---------- Content ---------- */}
      {error ? (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-fifa-danger/25 bg-fifa-danger/[0.05] p-4 text-sm text-fifa-danger"
        >
          {error}
        </p>
      ) : tournaments.length === 0 ? (
        <div className="mt-5 rounded-2xl border-2 border-dashed border-fifa-border bg-fifa-surface px-5 py-10 text-center">
          <Clock size={22} className="mx-auto text-fifa-text-muted" />
          <p className="mt-3 text-sm font-medium text-fifa-text">
            No tournaments yet
          </p>
          <p className="mt-1 text-xs text-fifa-text-muted">
            Tournament results will appear here once they are recorded.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
          {tournaments.map((tournament, index) => {
            const results = tournament.results || {};

            return (
              <article key={tournament.id} className={`${PANEL} p-3 sm:p-4`}>
                <header className="mb-3 flex items-baseline justify-between gap-3">
                  <h2 className="truncate text-sm font-medium text-fifa-text">
                    Tournament {tournaments.length - index}
                  </h2>
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
                        className="flex min-w-0 flex-col items-center gap-1.5 rounded-xl bg-fifa-elevated px-1 py-2.5"
                      >
                        <span
                          className={`text-[9px] font-medium uppercase tracking-[0.1em] ${positionColor}`}
                        >
                          {position}
                        </span>
                        <ClubLogo name={teamName} />
                        <span
                          className="max-w-full truncate text-center text-[10px] text-fifa-text"
                          title={teamName}
                        >
                          {teamName ? teamShort(teamName) : "—"}
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
      )}
    </main>
  );
};

export default TournamentResults;