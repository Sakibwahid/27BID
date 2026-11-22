import { useEffect, useMemo, useRef, useState } from "react";
import { collection, query, getDocs, limit } from "firebase/firestore";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowUpDown } from "lucide-react";

import { db } from "../../lib/firebase/config";
import { Button } from "../ui/Button";
import PlayerList from "../player/PlayerList";

const CACHE_MAX_AGE_MS = 5 * 60 * 1000;
const PLAYER_LIMIT = 1000;
const DEFAULT_MAX_OVERALL = 95;

const CATEGORIES = [
  "",
  "GK", "CB", "LB", "RB", "LWB", "RWB",
  "CDM", "CM", "CAM", "LM", "RM",
  "LW", "RW", "CF", "ST",
];

const OVERALLS = ["95", "85", "80"];

/* App stat key -> alternate key used by some imported datasets */
const STAT_ALIASES = {
  Acceleration: "movement_acceleration",
  ShotPower: "power_shot_power",
  ShortPassing: "attacking_short_passing",
  Dribbling: "skill_dribbling",
  StandingTackle: "defending_standing_tackle",
  Strength: "power_strength",
  GKHandling: "goalkeeping_handling",
  GKPositioning: "goalkeeping_positioning",
  GKReflexes: "goalkeeping_reflexes",
};

const SELECT_CLASS =
  "min-h-10 rounded-xl border border-fifa-border bg-fifa-surface px-3 text-sm text-fifa-text-secondary outline-none transition focus:border-fifa-accent/50";

/* ---------------- helpers ---------------- */
const normalizePlayer = (playerDoc) => {
  const player = playerDoc.data();

  const name =
    player.Name?.trim() ||
    player.common_name?.trim() ||
    [player.first_name, player.last_name].filter(Boolean).join(" ");

  const stats = Object.fromEntries(
    Object.entries(STAT_ALIASES).map(([key, alias]) => [
      key,
      player[key] ?? player[alias],
    ]),
  );

  return {
    id: playerDoc.id,
    ...player,
    ...stats,
    ID: String(player.ID ?? playerDoc.id).trim() || playerDoc.id,
    Name: name,
    Overall: Number(player.Overall),
  };
};

/* ---------------- component ---------------- */
const PlayerFilter = ({
  collectionName = "players",
  cacheKey = "player_filter_cache",
  searchTerm = "",
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const category = searchParams.get("category") || "";
  const maxOverall = Number(searchParams.get("overall") || DEFAULT_MAX_OVERALL);

  const [allPlayers, setAllPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [sortHighToLow, setSortHighToLow] = useState(true);

  const listScrollRef = useRef(null);

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
          const { data, savedAt } = JSON.parse(cached);

          if (Date.now() - savedAt < CACHE_MAX_AGE_MS) {
            setAllPlayers(data);
            setLoading(false);
            return;
          }

          localStorage.removeItem(cacheKey);
        }
      } catch {
        localStorage.removeItem(cacheKey);
      }

      setLoading(true);
      setLoadError("");

      try {
        const q = query(collection(db, collectionName), limit(PLAYER_LIMIT));
        const snapshot = await getDocs(q);

        const data = snapshot.docs.map(normalizePlayer);
        setAllPlayers(data);

        localStorage.setItem(
          cacheKey,
          JSON.stringify({ data, savedAt: Date.now() }),
        );
      } catch (error) {
        console.error("Error fetching players:", error);
        setLoadError(
          "We couldn't load the player market. Please try again later.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadPlayers();
  }, [collectionName, cacheKey]);

  const filteredPlayers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return allPlayers
      .filter((p) => !category || p.Position === category)
      .filter(
        (p) =>
          !normalizedSearch ||
          String(p.Name ?? "")
            .toLowerCase()
            .includes(normalizedSearch),
      )
      .filter((p) => Number(p.Overall) <= maxOverall)
      .sort((a, b) =>
        sortHighToLow ? b.Overall - a.Overall : a.Overall - b.Overall,
      );
  }, [allPlayers, category, maxOverall, searchTerm, sortHighToLow]);

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams);
    params.set(key, value);
    setSearchParams(params);
  };

  const openPlayerDetails = (player) => {
    navigate("/player-details", { state: { player } });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-2 flex shrink-0 items-center justify-between gap-3">
        <div className="flex gap-2">
          <select
            value={category}
            onChange={(e) => updateParam("category", e.target.value)}
            aria-label="Filter by position"
            className={SELECT_CLASS}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat} className="bg-fifa-card">
                {cat || "All Positions"}
              </option>
            ))}
          </select>

          <select
            value={maxOverall}
            onChange={(e) => updateParam("overall", e.target.value)}
            aria-label="Filter by maximum rating"
            className={SELECT_CLASS}
          >
            {OVERALLS.map((o) => (
              <option key={o} value={o} className="bg-fifa-card">
                {o}
              </option>
            ))}
          </select>
        </div>

        <Button
          onClick={() => setSortHighToLow((prev) => !prev)}
          aria-label={`Sort by overall ${sortHighToLow ? "descending" : "ascending"}`}
          title="Toggle rating sort"
          className="rounded-xl border border-fifa-border bg-fifa-surface text-fifa-text-secondary shadow-none hover:bg-fifa-elevated"
        >
          <ArrowUpDown
            className={`h-4 w-4 transition-transform duration-200 ${
              sortHighToLow ? "rotate-0" : "rotate-180"
            }`}
          />
        </Button>
      </div>

      <div
        ref={listScrollRef}
        className="max-h-[80dvh] w-full flex-1 overflow-y-auto pr-1"
      >
        <PlayerList
          players={filteredPlayers}
          loading={loading}
          error={loadError}
          searchTerm={searchTerm}
          onPlayerClick={openPlayerDetails}
          scrollRef={listScrollRef}
        />
      </div>
    </div>
  );
};

export default PlayerFilter;