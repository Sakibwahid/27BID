import { useState } from "react";
import { User } from "lucide-react";

const STATS = [
  { label: "PAC", key: "Acceleration" },
  { label: "SHO", key: "ShotPower" },
  { label: "PAS", key: "ShortPassing" },
  { label: "DRI", key: "Dribbling" },
  { label: "DEF", key: "StandingTackle" },
  { label: "PHY", key: "Strength" },
];

/* Hard offset shadow takes its color from the token via shadow-fifa-border.
   Needs ~4px of free space to the right and below so it isn't clipped. */
const BASE =
  "flex w-full items-center gap-3 rounded-2xl border-2 border-fifa-border bg-fifa-surface p-2.5 text-left shadow-[4px_4px_0_0] shadow-fifa-border transition duration-150";

const INTERACTIVE =
  "cursor-pointer hover:-translate-x-px hover:-translate-y-px hover:shadow-[5px_5px_0_0] active:translate-x-1 active:translate-y-1 active:shadow-[0_0_0_0]";

const PlayerCard = ({ player, onClick }) => {
  const [failedId, setFailedId] = useState(null);
  const photoFailed = failedId === player.ID;
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      {...(onClick && { type: "button", onClick: () => onClick(player) })}
      className={`${BASE} ${onClick ? INTERACTIVE : ""}`}
    >
      {/* Photo */}
      <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-fifa-elevated text-fifa-text-muted">
        {photoFailed ? (
          <User size={20} aria-hidden="true" />
        ) : (
          <img
            src={`/player_photos/${player.ID}.png`}
            alt={player.Name}
            loading="lazy"
            onError={() => setFailedId(player.ID)}
            className="h-full w-full object-cover object-top"
          />
        )}
      </span>

      {/* Name + stats */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="truncate font-[manrope] text-[15px] font-semibold tracking-tight text-fifa-text">
            {player.Name}
          </p>
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-fifa-text-muted">
            {player.Position}
          </span>
        </div>

        <dl className="mt-1.5 grid grid-cols-6 gap-1 text-center">
          {STATS.map(({ label, key }) => (
            <div key={key} className="flex flex-col-reverse">
              <dt className="mt-1 text-[9px] font-medium uppercase leading-none tracking-[0.1em] text-fifa-text-muted">
                {label}
              </dt>
              <dd className="text-sm font-normal leading-none tabular-nums text-fifa-text">
                {player[key] ?? "—"}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Overall */}
      <span
        aria-label={`Overall ${player.Overall}`}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-fifa-accent font-[manrope] text-lg font-bold tabular-nums text-fifa-bg"
      >
        {player.Overall}
      </span>
    </Tag>
  );
};

export default PlayerCard;