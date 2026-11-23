import { memo } from "react";
import { CircleDot } from "lucide-react";
import useCurrentPlayer from "../../hooks/useCurrentPlayer";
import PlayerFilter from "../player/PlayerFilter";
import PlayerCard from "../player/PlayerCard";

const TEAMS = [
  { id: "wolves01", name: "Wolves" },
  { id: "bayern05", name: "Bayern Munich" },
  { id: "city04", name: "Manchester City" },
  { id: "paris03", name: "Paris Saint-Germain" },
  { id: "liverpool01", name: "Liverpool" },
  { id: "chelsea01", name: "Chelsea" },
  { id: "realmadrid01", name: "Real Madrid" },
];

const CurrentAuctionPanel = ({ currentPlayer, loading }) => {
  const soldPrice = currentPlayer?.soldPrice;
  const season = currentPlayer?.currentSeasonId || "—";
  const team = TEAMS.find(({ id }) => id === currentPlayer?.currentTeamId);
  const status = soldPrice
    ? `Sold to ${team?.name || "club"} · ${season}`
    : "UNSOLD";

  return (
    <section className="overflow-hidden rounded-2xl border border-fifa-border bg-fifa-surface">
      <div className="p-4 sm:p-5">
        {loading ? (
          <div
            role="status"
            className="flex min-h-56 flex-col items-center justify-center gap-3 text-sm text-fifa-text-muted"
          >
            <span className="h-7 w-7 animate-spin rounded-full border-2 border-fifa-border border-t-fifa-accent" />
            Loading auction...
          </div>
        ) : currentPlayer ? (
          <div className="space-y-4">
            <PlayerCard player={currentPlayer} />
            <div className="flex items-center justify-between gap-3 rounded-xl border border-fifa-border bg-fifa-bg/50 px-4 py-3">
              <p className="text-sm font-medium text-fifa-text">{status}</p>
              {soldPrice && (
                <p className="shrink-0 text-lg font-semibold text-fifa-accent">
                  {soldPrice}M
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-fifa-border px-5 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-fifa-card text-fifa-text-muted">
              <CircleDot size={19} />
            </span>
            <p className="mt-4 text-sm font-medium text-fifa-text">
              No active player
            </p>
            <p className="mt-1 max-w-xs text-xs leading-5 text-fifa-text-muted">
              The auction will appear here when an administrator selects a
              player.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

const StablePlayerFilter = memo(PlayerFilter);
StablePlayerFilter.displayName = "StablePlayerFilter";

const AuctionSection = () => {
  const { currentPlayer, loading } = useCurrentPlayer();

  return (
    <main className="min-h-[calc(100dvh-4.5rem)] bg-fifa-bg px-4 py-3 text-fifa-text sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-4">
          <h1 className="font-[manrope] text-xl font-semibold tracking-[-0.03em] text-fifa-text sm:text-3xl">
            Current Player in Auction
          </h1>
        </header>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.4fr)]">
          <div className="lg:sticky lg:top-24">
            <CurrentAuctionPanel
              currentPlayer={currentPlayer}
              loading={loading}
            />
          </div>

          <section className="flex min-h-[34rem] flex-col overflow-hidden rounded-2xl border border-fifa-border bg-fifa-surface lg:min-h-[calc(100dvh-10.5rem)]">
            <div className="min-h-0 flex-1 p-3 sm:p-5">
              <StablePlayerFilter />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default AuctionSection;