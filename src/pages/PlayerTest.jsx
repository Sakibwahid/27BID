import { Text } from "../components/ui/Text";
import PlayerFilter from "../components/player/PlayerFilter";

const PlayerTest = () => {
  return (
    <main className="min-h-screen w-full bg-fifa-bg px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-5 border-b border-fifa-border pb-5">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-fifa-accent">
            Admin utility · Test data
          </p>
          <Text
            variant="heading"
            className="mt-2 text-2xl font-semibold tracking-tight text-fifa-text sm:text-3xl"
          >
            Player test roster
          </Text>
          <p className="mt-2 max-w-2xl text-sm text-fifa-text-secondary">
            Inspect the test collection and filter players by position or rating.
          </p>
        </header>

        <section className="min-h-64 rounded-2xl border border-fifa-border bg-fifa-surface p-3 sm:p-5">
          <PlayerFilter
            collectionName="players_test"
            cacheKey="player_test_filter_cache"
          />
        </section>
      </div>
    </main>
  );
};

export default PlayerTest;
