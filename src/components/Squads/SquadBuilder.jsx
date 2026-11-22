import React, { useEffect, useMemo, useState } from "react";
import { collection, getDocs, limit, query } from "firebase/firestore";

import { db } from "../../lib/firebase/config";
import { useAuth } from "../../context/AuthContext";

import { Text } from "../ui/Text";
import { Button } from "../ui/Button";
import { Search, Plus, X, Target } from "lucide-react";

const SQUAD_CACHE_KEY = "squad_builder_players";
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const CATEGORIES = [
  "",
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

const POSITION_ORDER = [
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

const SquadBuilder = () => {
  const { user } = useAuth();
  const [allPlayers, setAllPlayers] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState("");

  const storageKey = user?.uid ? `squad_targets_${user.uid}` : null;

  const [targets, setTargets] = useState(() => {
    if (!storageKey) return [];
    try {
      const cached = localStorage.getItem(storageKey);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [status, setStatus] = useState(null);
  const [viewMode, setViewMode] = useState("market");

  function PlayerPhoto({ playerId, name, size = "w-10 h-10" }) {
    const [failed, setFailed] = React.useState(false);
    if (!failed) {
      return (
        <img
          src={`/player_photos/${playerId}.png`}
          alt={name}
          loading="lazy"
          onError={() => setFailed(true)}
          className={`${size} rounded-xl object-cover object-top border border-fifa-border bg-fifa-surface shrink-0`}
        />
      );
    }
    return (
      <div className={`${size} rounded-xl bg-fifa-surface border border-fifa-border flex items-center justify-center shrink-0`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-fifa-text-muted">
          <circle cx="12" cy="8" r="4" fill="currentColor" opacity="0.4" />
          <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" fill="currentColor" opacity="0.4" />
        </svg>
      </div>
    );
  }

  /* ---------------- LOAD PLAYERS (cached) ---------------- */
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const cached = localStorage.getItem(SQUAD_CACHE_KEY);
        if (cached) {
          const { data, savedAt } = JSON.parse(cached);
          if (Date.now() - savedAt < CACHE_MAX_AGE_MS) {
            setAllPlayers(data);
            return;
          }
          localStorage.removeItem(SQUAD_CACHE_KEY);
        }
      } catch {
        localStorage.removeItem(SQUAD_CACHE_KEY);
      }

      setLoadingPlayers(true);
      try {
        const data = (await getDocs(query(collection(db, "players"), limit(1000)))).docs.map((d) => ({
          id: d.id,
          ...d.data(),
          Overall: Number(d.data().Overall),
        }));
        setAllPlayers(data);
        localStorage.setItem(
          SQUAD_CACHE_KEY,
          JSON.stringify({ data, savedAt: Date.now() })
        );
      } catch (err) {
        console.error("Error fetching players:", err);
        setStatus({ type: "error", msg: "Failed to load players." });
      } finally {
        setLoadingPlayers(false);
      }
    };

    loadPlayers();
  }, []);

  /* ---------------- TARGETS (localStorage only) ---------------- */
  const persistTargets = (list) => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(list));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!storageKey) return;
    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) setTargets(JSON.parse(cached));
    } catch (error) {
      console.error("Failed to load saved squad targets:", error);
    }
  }, [storageKey]);

  const addTarget = (player) => {
    if (targets.find((t) => t.playerId === player.id)) {
      setStatus({ type: "error", msg: "Already in targets" });
      return;
    }
    const next = [
      ...targets,
      {
        playerId: player.id,
        position: player.Position,
        name: player.Name,
        overall: player.Overall,
      },
    ];
    setTargets(next);
    persistTargets(next);
  };

  const removeTarget = (playerId) => {
    const next = targets.filter((t) => t.playerId !== playerId);
    setTargets(next);
    persistTargets(next);
  };

  const clearAll = () => {
    setTargets([]);
    persistTargets([]);
  };

  /* ---------------- FILTER PLAYERS ---------------- */
  const filteredPlayers = useMemo(() => {
    let list = [...allPlayers];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => (p.Name || "").toLowerCase().includes(q));
    }
    if (positionFilter) {
      list = list.filter((p) => p.Position === positionFilter);
    }
    return list.sort((a, b) => (b.Overall || 0) - (a.Overall || 0));
  }, [allPlayers, search, positionFilter]);

  /* ---------------- GROUP TARGETS BY EXACT POSITION ---------------- */
  const groupedTargets = useMemo(() => {
    const map = {};
    targets.forEach((t) => {
      const pos = t.position || "UNKNOWN";
      if (!map[pos]) map[pos] = [];
      map[pos].push(t);
    });
    return POSITION_ORDER.reduce((acc, pos) => {
      if (map[pos]) acc[pos] = map[pos];
      return acc;
    }, {});
  }, [targets]);

  const totalTargets = targets.length;

  /* ---------------- AUTH GUARD ---------------- */
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fifa-bg">
        <Text className="text-fifa-text-secondary">Please log in to build your squad.</Text>
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-fifa-bg text-fifa-text">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        {/* Header */}
        <div className="flex flex-col gap-5 border-b border-fifa-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-fifa-accent">
              Squad planning
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-fifa-text sm:text-3xl">
              Squad builder
            </h1>
            <p className="mt-2 text-sm text-fifa-text-secondary">
              Track targets and prepare your preferred lineup.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              aria-label="Select squad builder view"
              className="h-10 rounded-lg border border-fifa-border bg-fifa-surface px-3 text-sm text-fifa-text outline-none focus:border-fifa-accent"
            >
              <option value="market">Browse Market</option>
              <option value="targets">My Targets</option>
            </select>

            <Text className="font-inter text-xs text-fifa-text-muted">
              {totalTargets} target{totalTargets === 1 ? "" : "s"}
            </Text>
            {status && (
              <span
                role={status.type === "error" ? "alert" : "status"}
                className={`rounded-lg border px-3 py-2 text-xs ${
                  status.type === "success"
                    ? "bg-fifa-success/10 text-fifa-success border-fifa-success/30"
                    : "bg-fifa-danger/10 text-fifa-danger border-fifa-danger/30"
                }`}
              >
                {status.msg}
              </span>
            )}
            {viewMode === "targets" && (
              <Button
                size="sm"
                onClick={clearAll}
                disabled={!totalTargets}
                className="min-h-10 rounded-lg border border-fifa-danger/30 bg-transparent text-fifa-danger shadow-none hover:bg-fifa-danger/10 disabled:opacity-50"
              >
                Clear All
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* LEFT — target list */}
          <div
            className={
              viewMode === "market"
                ? "lg:col-span-1"
                : "lg:col-span-3"
            }
          >
            <div className="rounded-2xl border border-fifa-border bg-fifa-surface p-4 sm:p-5">
              <Text className="mb-4 text-base font-semibold text-fifa-text">
                Targets ({totalTargets})
              </Text>

              {totalTargets === 0 && viewMode === "targets" && (
                <p className="rounded-xl border border-dashed border-fifa-border px-4 py-6 text-sm leading-6 text-fifa-text-muted">
                  You haven’t added any targets yet. Player targets will appear here when the roster is available.
                </p>
              )}

              <div className="flex flex-col gap-4">
                {Object.entries(groupedTargets).map(([pos, list]) => (
                  <div key={pos}>
                    <Text className="font-inter text-[10px] uppercase tracking-[0.2em] text-fifa-text-muted mb-2 block">
                      {pos}
                    </Text>
                    <div className="flex flex-col gap-2">
                       {list.map((t) => (
                         <div
                           key={t.playerId}
                           className="flex items-center justify-between gap-2 bg-fifa-surface/70 border border-fifa-border rounded-xl px-3 py-2"
                         >
                           <div className="flex items-center gap-2 min-w-0">
                             <PlayerPhoto playerId={t.playerId} name={t.name} size="w-8 h-8" />
                             <div className="min-w-0">
                               <Text className="font-[rajdhani] font-semibold text-fifa-text text-sm truncate block">
                                 {t.name}
                               </Text>
                               <Text className="font-inter text-[10px] text-fifa-text-muted">
                                 OVR {t.overall}
                               </Text>
                             </div>
                           </div>
                           <button
                             onClick={() => removeTarget(t.playerId)}
                             className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-fifa-border bg-fifa-bg/50 text-fifa-text-muted transition hover:border-fifa-danger/40 hover:text-fifa-danger"
                             aria-label={`Remove ${t.name}`}
                           >
                             <X size={14} />
                           </button>
                         </div>
                       ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — player market */}
          {viewMode === "market" && (
            <div className="rounded-2xl border border-fifa-border bg-fifa-surface p-4 sm:p-5 lg:col-span-2">
              <Text className="mb-4 text-base font-semibold text-fifa-text">Player market</Text>

              <div className="flex flex-col gap-3 mb-4">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-fifa-text-muted"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Search players"
                    placeholder="Search players..."
                    className="w-full bg-fifa-surface border border-fifa-border rounded-xl pl-10 pr-4 py-3 text-sm text-fifa-text placeholder:text-fifa-text-muted outline-none focus:border-fifa-accent transition"
                  />
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  <select
                    value={positionFilter}
                    onChange={(e) => setPositionFilter(e.target.value)}
                    aria-label="Filter by position"
                    className="bg-fifa-surface border border-fifa-border text-fifa-text text-sm rounded-xl px-3 py-2 outline-none focus:border-fifa-accent transition"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-fifa-card">
                        {cat || "All Positions"}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-fifa-text-muted">
                    {filteredPlayers.length} player{filteredPlayers.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>

              {loadingPlayers && (
                <div className="py-10 text-center text-fifa-text-muted text-sm">
                  Loading players...
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto pr-1">
                {filteredPlayers.map((p) => {
                  const added = targets.some((t) => t.playerId === p.id);
                  return (
                     <div
                       key={p.id}
                       className="flex items-center justify-between gap-3 rounded-xl border border-fifa-border bg-fifa-bg/30 px-3 py-3 transition hover:border-fifa-accent/40"
                     >
                       <div className="flex items-center gap-3 min-w-0">
                         <PlayerPhoto playerId={p.id} name={p.Name} size="w-10 h-10" />
                         <div className="min-w-0">
                           <Text className="font-[rajdhani] font-semibold text-fifa-text text-sm truncate block">
                             {p.Name}
                           </Text>
                           <Text className="font-inter text-[10px] text-fifa-text-muted">
                             {p.Position} · OVR {p.Overall}
                           </Text>
                         </div>
                       </div>
                       <button
                         onClick={() => addTarget(p)}
                         disabled={added}
                         className={`shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                           added
                             ? "bg-fifa-surface border-fifa-border text-fifa-text-muted cursor-not-allowed"
                             : "bg-fifa-accent text-fifa-bg border-fifa-accent hover:bg-fifa-accent-hover"
                         }`}
                       >
                         {added ? <X size={12} /> : <Plus size={12} />}
                         {added ? "Added" : "Target"}
                       </button>
                     </div>
                  );
                })}
              </div>

              {!loadingPlayers && filteredPlayers.length === 0 && (
                <p className="rounded-xl border border-dashed border-fifa-border px-4 py-8 text-center text-sm text-fifa-text-muted">
                  {allPlayers.length === 0
                    ? "The player roster is empty. Player cards will appear here when records are added."
                    : "No players match your filters."}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default SquadBuilder;
