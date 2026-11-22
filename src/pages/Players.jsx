import { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import PlayerFilter from "../components/player/PlayerFilter";

const Players = () => {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="relative min-h-screen overflow-hidden bg-fifa-bg">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/4 h-[28rem] w-[28rem] rounded-full bg-fifa-accent/[0.06] blur-[120px]"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-7 sm:py-14 lg:px-10 lg:py-16">
        <div className="flex flex-col gap-7 border-b border-fifa-border pb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-10 sm:pb-10">
          <div className="max-w-2xl">
            <h1 className="mt-5 font-[spaceGrotesk] text-4xl font-medium tracking-[-0.05em] text-fifa-text sm:text-5xl">
              Find your next <span className="text-fifa-accent">difference-maker.</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-fifa-text-secondary sm:text-base sm:leading-7">
              Search the roster, explore ratings, and start planning the squad
              you want to take into the auction.
            </p>
          </div>

          <label className="relative block w-full shrink-0 sm:max-w-sm">
            <span className="sr-only">Search players by name</span>
            <Search
              size={17}
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-fifa-text-muted"
            />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search players by name"
              className="min-h-12 w-full rounded-xl border border-fifa-border bg-fifa-surface pl-11 pr-4 text-sm text-fifa-text outline-none transition placeholder:text-fifa-text-muted focus:border-fifa-accent/50 focus:ring-2 focus:ring-fifa-accent/10"
            />
          </label>
        </div>

        <section className="mt-7 overflow-hidden rounded-2xl border border-fifa-border bg-fifa-card/60">
          <div className="p-4 sm:p-6">
            <PlayerFilter searchTerm={searchTerm} />
          </div>
        </section>
      </div>
    </div>
  );
};

export default Players;
