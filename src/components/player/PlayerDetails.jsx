import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, User } from "lucide-react";

/* key = app field, alt = alternate field name used by some imported datasets */
const STATS = [
  { key: "Acceleration", alt: "movement_acceleration", label: "Acceleration" },
  { key: "SprintSpeed", alt: "movement_sprint_speed", label: "Sprint Speed" },
  { key: "Agility", alt: "movement_agility", label: "Agility" },
  { key: "Balance", alt: "movement_balance", label: "Balance" },
  { key: "Reactions", alt: "movement_reactions", label: "Reactions" },
  { key: "Stamina", alt: "power_stamina", label: "Stamina" },
  { key: "Strength", alt: "power_strength", label: "Strength" },
  { key: "Jumping", alt: "power_jumping", label: "Jumping" },
  { key: "Aggression", alt: "mentality_aggression", label: "Aggression" },
  { key: "Finishing", alt: "attacking_finishing", label: "Finishing" },
  { key: "ShotPower", alt: "power_shot_power", label: "Shot Power" },
  { key: "LongShots", alt: "power_long_shots", label: "Long Shots" },
  { key: "Volleys", alt: "attacking_volleys", label: "Volleys" },
  { key: "Penalties", alt: "mentality_penalties", label: "Penalties" },
  { key: "Positioning", alt: "mentality_positioning", label: "Positioning" },
  {
    key: "HeadingAccuracy",
    alt: "attacking_heading_accuracy",
    label: "Heading Accuracy",
  },
  {
    key: "ShortPassing",
    alt: "attacking_short_passing",
    label: "Short Passing",
  },
  { key: "LongPassing", alt: "skill_long_passing", label: "Long Passing" },
  { key: "Crossing", alt: "attacking_crossing", label: "Crossing" },
  { key: "Vision", alt: "mentality_vision", label: "Vision" },
  { key: "Curve", alt: "skill_curve", label: "Curve" },
  { key: "FKAccuracy", alt: "skill_fk_accuracy", label: "FK Accuracy" },
  { key: "Dribbling", alt: "skill_dribbling", label: "Dribbling" },
  { key: "BallControl", alt: "skill_ball_control", label: "Ball Control" },
  { key: "Composure", alt: "mentality_composure", label: "Composure" },
  { key: "Marking", alt: "defending_marking_awareness", label: "Marking" },
  {
    key: "Interceptions",
    alt: "mentality_interceptions",
    label: "Interceptions",
  },
  {
    key: "StandingTackle",
    alt: "defending_standing_tackle",
    label: "Standing Tackle",
  },
  {
    key: "SlidingTackle",
    alt: "defending_sliding_tackle",
    label: "Sliding Tackle",
  },
  { key: "GKDiving", alt: "goalkeeping_diving", label: "GK Diving" },
  { key: "GKHandling", alt: "goalkeeping_handling", label: "GK Handling" },
  { key: "GKKicking", alt: "goalkeeping_kicking", label: "GK Kicking" },
  {
    key: "GKPositioning",
    alt: "goalkeeping_positioning",
    label: "GK Positioning",
  },
  { key: "GKReflexes", alt: "goalkeeping_reflexes", label: "GK Reflexes" },
];

/* Same surface language as PlayerCard: 2px border + hard offset shadow */
const PANEL =
  "rounded-2xl border-2 border-fifa-border bg-fifa-surface shadow-[4px_4px_0_0] shadow-fifa-border";

/* label + value on one line, thin bar underneath */
const StatItem = ({ label, value }) => {
  const pct = Math.min(100, Math.max(0, Number(value)));

  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-xs text-fifa-text-muted">{label}</span>
        <span className="text-xs font-semibold tabular-nums text-fifa-text">
          {value}
        </span>
      </div>
      <div
        aria-hidden="true"
        className="mt-1 h-1 overflow-hidden rounded-full bg-fifa-elevated"
      >
        <div
          className="h-full rounded-full bg-fifa-text-secondary"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const PlayerDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const player =
    location.state?.player || JSON.parse(localStorage.getItem("player")) || null;
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    if (location.state?.player) {
      localStorage.setItem("player", JSON.stringify(location.state.player));
    }
  }, [location.state?.player]);

  if (!player) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-fifa-bg px-6">
        <p className="text-sm text-fifa-text-muted">
          Player details are unavailable.
        </p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-fifa-border px-4 text-sm text-fifa-text-secondary transition hover:border-fifa-accent/40 hover:text-fifa-text"
        >
          <ArrowLeft size={16} /> Go back
        </button>
      </div>
    );
  }

  const infoFields = [
    { label: "Nationality", value: player.Nationality },
    { label: "Club", value: player.Club },
    { label: "Age", value: player.Age },
    { label: "Height", value: player.Height },
  ];

  /* Only stats this player actually has */
  const visibleStats = STATS.map((stat) => ({
    ...stat,
    value: player[stat.key] ?? player[stat.alt],
  })).filter(({ value }) => value !== undefined && !isNaN(value));

  return (
    <main className="min-h-screen w-full bg-fifa-bg text-fifa-text">
      <div className="mx-auto w-full max-w-3xl px-4 py-4 pb-10 sm:px-6 sm:py-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex min-h-9 items-center gap-2 text-sm text-fifa-text-muted transition hover:text-fifa-text"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {/* ---------- Identity ---------- */}
        <section className={`${PANEL} overflow-hidden`}>
          <div className="flex items-center gap-3 p-3 sm:p-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-fifa-elevated text-fifa-text-muted">
              {imgFailed ? (
                <User size={24} aria-hidden="true" />
              ) : (
                <img
                  src={`/player_photos/${player.ID}.png`}
                  alt={player.Name}
                  className="h-full w-full object-cover object-top"
                  onError={() => setImgFailed(true)}
                />
              )}
            </span>

            <div className="min-w-0 flex-1">
              <h1 className="truncate font-[manrope] text-xl font-semibold tracking-[-0.03em] text-fifa-text sm:text-2xl">
                {player.Name}
              </h1>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-fifa-text-muted">
                {player.Position}
              </p>
            </div>

            <span
              aria-label={`Overall ${player.Overall}`}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-fifa-accent font-[manrope] text-xl font-bold tabular-nums text-fifa-bg"
            >
              {player.Overall}
            </span>
          </div>

          <dl className="grid grid-cols-4 divide-x divide-fifa-border border-t border-fifa-border">
            {infoFields.map(({ label, value }) => (
              <div key={label} className="min-w-0 px-2 py-2 text-center">
                <dt className="text-[9px] font-medium uppercase tracking-[0.12em] text-fifa-text-muted">
                  {label}
                </dt>
                <dd className="mt-0.5 truncate text-sm font-medium text-fifa-text">
                  {value ?? "—"}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ---------- Stats (flat, ungrouped) ---------- */}
        {visibleStats.length > 0 && (
          <section
            className={`${PANEL} mt-5 grid grid-cols-2 gap-x-5 gap-y-3 p-4 sm:grid-cols-3 sm:gap-x-8 sm:p-5`}
          >
            {visibleStats.map(({ key, label, value }) => (
              <StatItem key={key} label={label} value={value} />
            ))}
          </section>
        )}
      </div>
    </main>
  );
};

export default PlayerDetails;