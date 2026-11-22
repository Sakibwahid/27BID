import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { User } from "lucide-react";

import { db } from "../../lib/firebase/config";
import { useAuth } from "../../context/AuthContext";

import Loadin from "../ui/loadin";
import Reveal from "../ui/Reveal";
import FieldView from "./FieldView";
import { Button } from "../ui/Button";

const BUDGET = 2200;
const POSITION_GROUPS = {
  GK: ["GK"],
  DEF: ["CB", "LB", "RB", "LWB", "RWB"],
  MID: ["CDM", "CM", "CAM", "LM", "RM"],
  FWD: ["LW", "RW", "CF", "ST"],
};

const GROUP_LABELS = {
  GK: "Goalkeepers",
  DEF: "Defenders",
  MID: "Midfielders",
  FWD: "Forwards",
  OTH: "Others",
};

const POSITIONS = [
  "GK",
  "CB",
  "LB",
  "RB",
  "LWB",
  "RWB",
  "CDM",
  "CM",
  "CAM",
  "LM",
  "RM",
  "LW",
  "RW",
  "CF",
  "ST",
];

const OTHER_TEAMS = [
  { id: "wolves01", name: "Wolves" },
  { id: "bayern05", name: "Bayern Munich" },
  { id: "city04", name: "Manchester City" },
  { id: "paris03", name: "Paris Saint-Germain" },
  { id: "liverpool01", name: "Liverpool" },
];

/* Shared box language (same as PlayerCard): 2px border + hard offset shadow.
   The shadow needs ~4px of free space to the right and below. */
const PANEL =
  "rounded-2xl border-2 border-fifa-border bg-fifa-surface shadow-[4px_4px_0_0] shadow-fifa-border";

const PANEL_INTERACTIVE =
  "transition duration-150 hover:-translate-x-px hover:-translate-y-px hover:shadow-[5px_5px_0_0] active:translate-x-1 active:translate-y-1 active:shadow-[0_0_0_0]";

const SELECT_CLASS =
  "h-10 rounded-xl border border-fifa-border bg-fifa-surface px-3 text-sm text-fifa-text outline-none transition focus:border-fifa-accent";

const squadCache = new Map();
let squadUnsub = null;

const sumValue = (list) =>
  list.reduce((acc, p) => acc + (Number(p.soldPrice) || 0), 0);

const normalizePlayer = (player, seasonData = {}) => {
  if (!player) return null;

  const playerId = String(
    seasonData.playerId ?? player.ID ?? player.id ?? ""
  ).trim();

  return {
    ...seasonData,
    ...player,
    id: playerId,
    playerId,
    ID: playerId,
    Name:
      player.Name?.trim() ||
      player.name?.trim() ||
      player.common_name?.trim() ||
      [player.first_name, player.last_name].filter(Boolean).join(" "),
    Position: player.Position ?? player.position,
    Overall: Number(player.Overall ?? player.overall),
  };
};

function PlayerPhoto({ playerId, name, size = "h-10 w-10" }) {
  const [failed, setFailed] = useState(false);

  return (
    <span
      className={`${size} flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-fifa-elevated text-fifa-text-muted`}
    >
      {failed ? (
        <User size={18} aria-hidden="true" />
      ) : (
        <img
          src={`/player_photos/${playerId}.png`}
          alt={name}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover object-top"
        />
      )}
    </span>
  );
}

/* One cell of the summary strip */
const Metric = ({ label, value, valueClass = "text-fifa-text" }) => (
  <div className="min-w-0 px-2 py-2.5 text-center">
    <dt className="truncate text-[9px] font-medium uppercase tracking-[0.12em] text-fifa-text-muted">
      {label}
    </dt>
    <dd
      className={`mt-1 font-[manrope] text-lg font-semibold leading-none tabular-nums tracking-tight ${valueClass}`}
    >
      {value}
    </dd>
  </div>
);

const DisplaySquad = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();

  const userTeamId = userData?.teamId || null;
  const [players, setPlayers] = useState([]);
  const [seasonId, setSeasonId] = useState("S4");
  const [teamOverride, setTeamOverride] = useState(null);
  const selectedTeamId = teamOverride || userTeamId;
  const [viewMode, setViewMode] = useState("list");

  /* ---------------- FETCH SQUAD ---------------- */
  useEffect(() => {
    if (!selectedTeamId || !seasonId) return;

    const key = `${selectedTeamId}_${seasonId}`;

    const loadSquad = async () => {
      if (squadCache.has(key)) {
        setPlayers(squadCache.get(key));
      }

      const [seasonSnap, directSnap] = await Promise.all([
        getDocs(
          query(
            collection(db, "season_players"),
            where("teamId", "==", selectedTeamId),
            where("seasonId", "==", seasonId)
          )
        ),
        getDocs(
          query(
            collection(db, "players"),
            where("currentTeamId", "==", selectedTeamId),
            where("currentSeasonId", "==", seasonId)
          )
        ),
      ]);

      const directPlayers = directSnap.docs.map((playerDoc) =>
        normalizePlayer(
          { id: playerDoc.id, ...playerDoc.data() },
          { playerId: playerDoc.id }
        )
      );

      const seasonData = seasonSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      const playerSnaps = await Promise.all(
        seasonData
          .map((sp) => sp.playerId)
          .filter(Boolean)
          .map((playerId) => getDoc(doc(db, "players", playerId)))
      );

      const playerMap = {};
      playerSnaps.forEach((snap) => {
        if (snap.exists()) playerMap[snap.id] = snap.data();
      });

      const seasonPlayers = seasonData
        .map((sp) =>
          normalizePlayer(playerMap[sp.playerId], {
            ...sp,
            playerId: sp.playerId,
          })
        )
        .filter((p) => p?.Name);

      const mergedById = new Map();
      [...directPlayers, ...seasonPlayers].forEach((player) => {
        if (player?.Name && player.playerId) {
          mergedById.set(player.playerId, player);
        }
      });
      const merged = [...mergedById.values()];

      merged.sort((a, b) => (b.Overall || 0) - (a.Overall || 0));

      squadCache.set(key, merged);
      setPlayers(merged);
    };

    loadSquad();

    if (squadUnsub) squadUnsub();
    const liveQuery = query(
      collection(db, "season_players"),
      where("teamId", "==", selectedTeamId),
      where("seasonId", "==", seasonId)
    );
    squadUnsub = onSnapshot(liveQuery, async (snap) => {
      const seasonData = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const playerSnaps = await Promise.all(
        seasonData.map((sp) => getDoc(doc(db, "players", sp.playerId)))
      );
      const playerMap = {};
      playerSnaps.forEach((snap) => {
        if (snap.exists()) playerMap[snap.id] = snap.data();
      });
      let merged = seasonData
        .map((sp) => ({ ...playerMap[sp.playerId], ...sp }))
        .filter((p) => p.Name);
      merged.sort((a, b) => (b.Overall || 0) - (a.Overall || 0));
      squadCache.set(key, merged);
      setPlayers(merged);
    });

    return () => {
      if (squadUnsub) squadUnsub();
    };
  }, [selectedTeamId, seasonId]);

  /* ---------------- DERIVED ---------------- */
  const totalValue = useMemo(() => sumValue(players), [players]);
  const remaining = BUDGET - totalValue;

  const grouped = useMemo(() => {
    const map = {};
    players.forEach((p) => {
      const pos = p.Position || "UNKNOWN";
      if (!map[pos]) map[pos] = [];
      map[pos].push(p);
    });
    return POSITIONS.reduce((acc, pos) => {
      if (map[pos]) acc[pos] = map[pos];
      return acc;
    }, {});
  }, [players]);

  const groupedValues = useMemo(() => {
    const vals = {};
    Object.entries(grouped).forEach(([pos, list]) => {
      vals[pos] = sumValue(list);
    });
    return vals;
  }, [grouped]);

  /* ---------------- AUTH GUARD ---------------- */
  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fifa-bg">
        <Loadin>Loading dashboard...</Loadin>
      </div>
    );
  }

  const groupSummary = Object.entries(POSITION_GROUPS).map(
    ([group, positions]) => {
      const inGroup = players.filter((p) => positions.includes(p.Position));
      return { group, count: inGroup.length, value: sumValue(inGroup) };
    }
  );

  const openPlayer = (player) =>
    navigate("/player-details", { state: { player } });

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-fifa-bg text-fifa-text">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        {/* ---------- Header ---------- */}
        <Reveal>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="font-[manrope] text-2xl font-semibold tracking-[-0.03em] text-fifa-text sm:text-3xl">
              Squad overview
            </h1>

            <div className="flex items-center gap-2">
              <select
                value={seasonId}
                onChange={(e) => setSeasonId(e.target.value)}
                aria-label="Select season"
                className={`${SELECT_CLASS} w-20 shrink-0`}
              >
                <option value="S2">S2</option>
                <option value="S3">S3</option>
                <option value="S4">S4</option>
              </select>

              <select
                value={selectedTeamId || ""}
                onChange={(e) => setTeamOverride(e.target.value)}
                aria-label="Select club"
                className={`${SELECT_CLASS} min-w-0 flex-1 sm:w-44 sm:flex-none`}
              >
                {userTeamId && <option value={userTeamId}>Your Squad</option>}
                {OTHER_TEAMS.map((team) => (
                  <option key={team.id} value={team.id} className="bg-fifa-card">
                    {team.name}
                  </option>
                ))}
              </select>

              <Button
                size="sm"
                onClick={() => setViewMode(viewMode === "list" ? "squad" : "list")}
                className="h-10 shrink-0 whitespace-nowrap rounded-xl shadow-none"
              >
                {viewMode === "list" ? "Pitch View" : "List View"}
              </Button>
            </div>
          </div>
        </Reveal>

        {/* ---------- Summary strip ---------- */}
        <Reveal delay={80}>
          <section
            aria-label="Squad summary"
            className="mb-6 grid gap-4 lg:grid-cols-[3fr_4fr]"
          >
            <dl className={`${PANEL} grid grid-cols-3 divide-x divide-fifa-border`}>
              <Metric label="Players" value={players.length} />
              <Metric label="Squad Value" value={`${totalValue}M`} />
              <Metric
                label="Budget Left"
                value={`${remaining}M`}
                valueClass={
                  remaining < 100 ? "text-fifa-danger" : "text-fifa-text"
                }
              />
            </dl>

            <dl className={`${PANEL} grid grid-cols-4 divide-x divide-fifa-border`}>
              {groupSummary.map(({ group, count, value }) => (
                <Metric
                  key={group}
                  label={
                    <>
                      <span className="sm:hidden">{group}</span>
                      <span className="hidden sm:inline">
                        {GROUP_LABELS[group]}
                      </span>{" "}
                      · {count}
                    </>
                  }
                  value={`${value}M`}
                />
              ))}
            </dl>
          </section>
        </Reveal>

        {/* ---------- Squad ---------- */}
        {viewMode === "list" ? (
          <div className="space-y-5">
            {players.length === 0 && (
              <Reveal>
                <div className="rounded-2xl border-2 border-dashed border-fifa-border bg-fifa-surface px-5 py-10 text-center">
                  <h2 className="font-[manrope] text-base font-semibold text-fifa-text">
                    No players in this squad yet
                  </h2>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-fifa-text-muted">
                    Your roster will appear here after players are added to this
                    club and season.
                  </p>
                  <Button
                    type="button"
                    onClick={() => navigate("/user/buildsquad")}
                    className="mt-5 min-h-10 rounded-xl shadow-none"
                  >
                    Open squad builder
                  </Button>
                </div>
              </Reveal>
            )}

            {Object.entries(grouped).map(([pos, list]) => (
              <Reveal
                key={pos}
                delay={Math.min(POSITIONS.indexOf(pos) * 50, 300)}
              >
                <section>
                  <div className="mb-2 flex items-center gap-3 px-0.5">
                    <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-fifa-text-muted">
                      <span className="text-fifa-text">{pos}</span> ·{" "}
                      {list.length} player{list.length === 1 ? "" : "s"}
                    </h2>
                    <span className="inline-flex items-baseline gap-1.5 rounded-lg border border-fifa-border bg-fifa-elevated px-2 py-0.5">
                      <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-fifa-text-muted">
                        Total
                      </span>
                      <span className="text-xs font-semibold tabular-nums text-fifa-text">
                        {groupedValues[pos]}M
                      </span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {list.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => openPlayer(p)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            openPlayer(p);
                          }
                        }}
                        className={`${PANEL} ${PANEL_INTERACTIVE} flex cursor-pointer items-center gap-3 p-2 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fifa-accent`}
                      >
                        <PlayerPhoto
                          playerId={p.playerId || p.id}
                          name={p.Name}
                        />

                        <span className="min-w-0 flex-1 truncate font-[manrope] text-[15px] font-semibold tracking-tight text-fifa-text">
                          {p.Name}
                        </span>

                        <span className="w-14 shrink-0 text-right text-sm font-medium tabular-nums text-fifa-text-secondary">
                          {p.soldPrice ?? "—"}M
                        </span>

                        <span
                          aria-label={`Overall ${p.Overall}`}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-fifa-accent font-[manrope] text-sm font-bold tabular-nums text-fifa-bg"
                        >
                          {p.Overall}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </Reveal>
            ))}
          </div>
        ) : (
          <FieldView players={players} onPlayerClick={openPlayer} />
        )}
      </div>
    </main>
  );
};

export default DisplaySquad;