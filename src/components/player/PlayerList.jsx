import { useEffect, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import PlayerCardDemo from "./PlayerCardDemo";

const TWO_COLUMN_MIN_WIDTH = 1024;
const ESTIMATED_ROW_HEIGHT = 168;

const PlayerList = ({
  players = [],
  onPlayerClick,
  loading,
  error,
  searchTerm = "",
  scrollRef,
}) => {
  const [columns, setColumns] = useState(1);

  /* Column count follows the list's own width, not the viewport */
  useEffect(() => {
    const el = scrollRef?.current;
    if (!el) return;

    const update = () =>
      setColumns(el.clientWidth >= TWO_COLUMN_MIN_WIDTH ? 2 : 1);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [scrollRef]);

  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(players.length / columns),
    getScrollElement: () => scrollRef?.current ?? null,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: 8,
  });

  if (loading) {
    return (
      <div className="flex min-h-72 w-full flex-col items-center justify-center gap-3 py-16">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-fifa-border border-t-fifa-accent" />
        <p className="text-sm tracking-wide text-fifa-text-secondary">
          Loading the market...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="flex min-h-72 w-full items-center justify-center px-5 py-16 text-center"
      >
        <p className="max-w-sm text-sm leading-6 text-fifa-danger">{error}</p>
      </div>
    );
  }

  if (!players.length) {
    return (
      <div className="flex min-h-72 w-full flex-col items-center justify-center px-5 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-fifa-border bg-fifa-surface text-xl text-fifa-accent">
          +
        </span>
        <h2 className="mt-4 text-base font-medium text-fifa-text">
          {searchTerm
            ? "No players match that search"
            : "The player market is taking shape"}
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-fifa-text-muted">
          {searchTerm
            ? "Try another name or clear your search. New players will appear here once they are added."
            : "There are no players in the database yet. Player cards will appear here as soon as the roster is added."}
        </p>
      </div>
    );
  }

  return (
    <div
      className="relative w-full"
      style={{ height: rowVirtualizer.getTotalSize() }}
    >
      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
        const start = virtualRow.index * columns;
        const rowPlayers = players.slice(start, start + columns);

        return (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={rowVirtualizer.measureElement}
            className="absolute left-0 top-0 grid w-full items-start gap-x-6 pb-4"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {rowPlayers.map((player) => (
              <div key={player.ID} className="min-w-0 px-1">
                <PlayerCardDemo player={player} onClick={onPlayerClick} />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default PlayerList;