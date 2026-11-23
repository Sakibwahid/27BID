import { useState } from "react";
import {
  collection,
  doc,
  increment,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../lib/firebase/config";
import { Button } from "../ui/Button";
import TournamentStats from "./TournamentStats";

const TEAM_META = {
  "Wolverhampton Wanderers F.C.": { short: "Wolves", logo: "/logos/Wolves.png" },
  "FC Bayern Munich": { short: "Bayern", logo: "/logos/Bayern.png" },
  "Manchester City F.C.": { short: "Man City", logo: "/logos/City.png" },
  "Paris Saint-Germain F.C.": { short: "PSG", logo: "/logos/PSG.png" },
  "Liverpool F.C.": { short: "Liverpool", logo: "/logos/Liverpool.png" },
  "Chelsea F.C.": { short: "Chelsea", logo: "/logos/Chelsea.png" },
  "Real Madrid C.F.": { short: "Real Madrid", logo: "/logos/Real Madrid.png" },
};

const TEAMS = Object.keys(TEAM_META);
const POSITIONS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"];
const SEASONS = ["S3", "S4", "S5"];

const UpdateTournament = () => {
  const [placements, setPlacements] = useState({});
  const [selectedSeason, setSelectedSeason] = useState("S4");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const getStatsUpdate = (position) => {
    switch (position) {
      case "1st":
        return { totalPoints: increment(3), firstCount: increment(1) };
      case "2nd":
        return { totalPoints: increment(2), secondCounts: increment(1) };
      case "3rd":
        return { totalPoints: increment(1), thirdCount: increment(1) };
      case "4th":
      case "5th":
      case "6th":
      case "7th":
        return { zeroCounts: increment(1) };
      default:
        return {};
    }
  };

  const usedPositions = new Set(Object.values(placements));

  const handleChange = (team, position) => {
    setPlacements((previous) => ({ ...previous, [team]: position }));
    setStatus(null);
  };

  const handleSeasonChange = (season) => {
    setSelectedSeason(season);
    setPlacements({});
    setStatus(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (Object.keys(placements).length !== TEAMS.length) {
      setStatus({
        type: "error",
        msg: "Please assign a position to all teams.",
      });
      return;
    }

    if (usedPositions.size !== POSITIONS.length) {
      setStatus({ type: "error", msg: "Each position must be unique." });
      return;
    }

    setSubmitting(true);
    setStatus(null);

    try {
      const batch = writeBatch(db);

      TEAMS.forEach((team) => {
        const standingsRef = doc(
          db,
          "seasons",
          selectedSeason,
          "standings",
          team
        );
        batch.set(standingsRef, getStatsUpdate(placements[team]), {
          merge: true,
        });
      });

      const tournamentRef = doc(
        collection(db, "seasons", selectedSeason, "tournaments")
      );
      batch.set(tournamentRef, {
        season: selectedSeason,
        results: placements,
        createdAt: serverTimestamp(),
      });

      await batch.commit();
      setStatus({
        type: "success",
        msg: `${selectedSeason} tournament submitted successfully.`,
      });
      setPlacements({});
      setRefreshKey((key) => key + 1);
    } catch (error) {
      console.error("Failed to submit tournament:", error);
      setStatus({
        type: "error",
        msg: error?.message || "Failed to submit tournament.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetSeason = async () => {
    const confirmed = window.confirm(
      `Reset all standings for ${selectedSeason}?`
    );
    if (!confirmed) return;

    setSubmitting(true);
    setStatus(null);

    try {
      const batch = writeBatch(db);
      TEAMS.forEach((team) => {
        const standingsRef = doc(
          db,
          "seasons",
          selectedSeason,
          "standings",
          team
        );
        batch.set(
          standingsRef,
          {
            totalPoints: 0,
            firstCount: 0,
            secondCounts: 0,
            thirdCount: 0,
            zeroCounts: 0,
          },
          { merge: true }
        );
      });
      await batch.commit();
      setStatus({ type: "success", msg: `${selectedSeason} standings reset.` });
      setRefreshKey((key) => key + 1);
    } catch (error) {
      console.error("Failed to reset standings:", error);
      setStatus({
        type: "error",
        msg: error?.message || "Failed to reset standings.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const assignedCount = Object.keys(placements).length;

  return (
    <main className="min-h-screen w-full bg-fifa-bg px-3 py-6 text-fifa-text sm:px-5 sm:py-8 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(19rem,0.8fr)_minmax(0,1.4fr)] lg:gap-5">
        <section className="rounded-2xl border border-fifa-border bg-fifa-surface p-4 sm:p-5">
          <header className="border-b border-fifa-border pb-4">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-fifa-accent">
              Admin · Tournament
            </p>
            <h1 className="mt-2 text-xl font-semibold tracking-tight text-fifa-text sm:text-2xl">
              Record results
            </h1>
          </header>

          <div className="mt-4">
            <label
              htmlFor="tournament-season"
              className="mb-1.5 block text-xs font-medium text-fifa-text-muted"
            >
              Season
            </label>
            <select
              id="tournament-season"
              value={selectedSeason}
              onChange={(event) => handleSeasonChange(event.target.value)}
              className="min-h-11 w-full rounded-lg border border-fifa-border bg-fifa-bg px-3 text-sm text-fifa-text outline-none focus:border-fifa-accent"
            >
              {SEASONS.map((season) => (
                <option key={season} value={season}>
                  {season}
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-2.5">
            {TEAMS.map((team) => {
              const meta = TEAM_META[team];
              const currentPosition = placements[team] || "";

              return (
                <div
                  key={team}
                  className="flex min-h-14 items-center justify-between gap-3 rounded-lg border border-fifa-border bg-fifa-bg/30 px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <img
                      src={meta.logo}
                      alt=""
                      aria-hidden="true"
                      onError={(event) => {
                        event.currentTarget.hidden = true;
                      }}
                      className="h-8 w-8 shrink-0 rounded-full border border-fifa-border object-cover"
                    />
                    <span className="truncate text-sm font-medium text-fifa-text">
                      {meta.short}
                    </span>
                  </div>

                  <select
                    aria-label={`${meta.short} tournament position`}
                    value={currentPosition}
                    onChange={(event) =>
                      handleChange(team, event.target.value)
                    }
                    className="min-h-10 w-28 rounded-lg border border-fifa-border bg-fifa-surface px-2 text-sm text-fifa-text outline-none focus:border-fifa-accent"
                    required
                  >
                    <option value="" disabled>
                      Position
                    </option>
                    {POSITIONS.map((position) => {
                      const taken =
                        usedPositions.has(position) &&
                        position !== currentPosition;
                      return (
                        <option
                          key={position}
                          value={position}
                          disabled={taken}
                        >
                          {position}
                        </option>
                      );
                    })}
                  </select>
                </div>
              );
            })}

            <p className="py-1 text-xs text-fifa-text-muted" aria-live="polite">
              Assigned{" "}
              <span className="font-semibold text-fifa-accent">
                {assignedCount}/{TEAMS.length}
              </span>
            </p>

            {status && (
              <p
                role={status.type === "error" ? "alert" : "status"}
                className={`rounded-lg border px-3 py-2.5 text-sm ${
                  status.type === "success"
                    ? "border-fifa-success/30 bg-fifa-success/10 text-fifa-success"
                    : "border-fifa-danger/30 bg-fifa-danger/10 text-fifa-danger"
                }`}
              >
                {status.msg}
              </p>
            )}

            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="min-h-11 w-full rounded-lg shadow-none disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit tournament"}
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleResetSeason}
              disabled={submitting}
              className="min-h-11 w-full rounded-lg border border-fifa-danger/30 bg-transparent text-fifa-danger shadow-none hover:bg-fifa-danger/10 disabled:opacity-60"
            >
              Clear season standings
            </Button>
          </form>
        </section>

        <TournamentStats
          key={refreshKey}
          selectedSeason={selectedSeason}
          onSeasonChange={handleSeasonChange}
        />
      </div>
    </main>
  );
};

export default UpdateTournament;
