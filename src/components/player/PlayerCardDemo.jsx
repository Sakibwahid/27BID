import { useState } from "react";
import { User } from "lucide-react";

const STATS = [
  { label: "PAC", title: "Pace", key: "Acceleration", csvKey: "movement_acceleration" },
  { label: "SHO", title: "Shooting", key: "ShotPower", csvKey: "power_shot_power" },
  { label: "PAS", title: "Passing", key: "ShortPassing", csvKey: "attacking_short_passing" },
  { label: "DRI", title: "Dribbling", key: "Dribbling", csvKey: "skill_dribbling" },
  { label: "DEF", title: "Defending", key: "StandingTackle", csvKey: "defending_standing_tackle" },
  { label: "PHY", title: "Physicality", key: "Strength", csvKey: "power_strength" },
];

const GOALKEEPER_STATS = [
  { label: "DIV", title: "GK Diving", key: "GKDiving", csvKey: "goalkeeping_diving" },
  { label: "HAN", title: "GK Handling", key: "GKHandling", csvKey: "goalkeeping_handling" },
  { label: "KIC", title: "GK Kicking", key: "GKKicking", csvKey: "goalkeeping_kicking" },
  { label: "REF", title: "GK Reflexes", key: "GKReflexes", csvKey: "goalkeeping_reflexes" },
  { label: "POS", title: "GK Positioning", key: "GKPositioning", csvKey: "goalkeeping_positioning" },
  { label: "REA", title: "Reactions", key: "Reactions", csvKey: "movement_reactions" },
];

const getValue = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== "");

/* Hard offset shadow takes its color from the token via shadow-fifa-border.
   Needs ~4px of free space to the right and below so it isn't clipped. */
const BASE =
  "flex w-full items-center gap-3 rounded-2xl border-2 border-fifa-border bg-fifa-surface p-2.5 text-left shadow-[4px_4px_0_0] shadow-fifa-border transition duration-150";

const INTERACTIVE =
  "cursor-pointer hover:-translate-x-px hover:-translate-y-px hover:shadow-[5px_5px_0_0] active:translate-x-1 active:translate-y-1 active:shadow-[0_0_0_0]";

const PlayerCard = ({ player, onClick }) => {
  const [failedId, setFailedId] = useState(null);
  const playerId = String(player?.ID ?? player?.id ?? "").trim();
  const playerName =
    player?.Name?.trim() ||
    player?.name?.trim() ||
    player?.common_name?.trim() ||
    [player?.first_name, player?.last_name].filter(Boolean).join(" ") ||
    "Unknown player";
  const position = getValue(player?.Position, player?.position) || "—";
  const overall = getValue(player?.Overall, player?.overall) ?? "—";
  const stats =
    String(position).toUpperCase() === "GK" ? GOALKEEPER_STATS : STATS;
  const photoFailed = failedId === playerId;
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
            src={`/player_photos/${playerId}.png`}
            alt={playerName}
            loading="lazy"
            onError={() => setFailedId(playerId)}
            className="h-full w-full object-cover object-top"
          />
        )}
      </span>

      {/* Name + stats */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="truncate font-[manrope] text-[15px] font-semibold tracking-tight text-fifa-text">
            {playerName}
          </p>
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-fifa-text-muted">
            {position}
          </span>
        </div>

        <dl className="mt-1.5 grid grid-cols-6 gap-1 text-center">
          {stats.map(({ label, title, key, csvKey }) => (
            <div key={key} className="flex flex-col-reverse">
              <dt
                title={title}
                className="mt-1 text-[9px] font-medium uppercase leading-none tracking-[0.1em] text-fifa-text-muted"
              >
                {label}
              </dt>
              <dd className="text-sm font-normal leading-none tabular-nums text-fifa-text">
                {getValue(player?.[key], player?.[csvKey]) ?? "—"}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Overall */}
      <span
        aria-label={`Overall ${overall}`}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-fifa-accent font-[manrope] text-lg font-bold tabular-nums text-fifa-bg"
      >
        {overall}
      </span>
    </Tag>
  );
};

export default PlayerCard;