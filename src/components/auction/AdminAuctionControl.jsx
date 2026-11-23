import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  query,
  limit,
  orderBy,
} from "firebase/firestore";
import { db } from "../../lib/firebase/config";
import { getRegisteredTeams } from "../../lib/teams";
import { Button } from "../ui/Button";
import { Text } from "../ui/Text";
import PlayerCardDemo from "../player/PlayerCardDemo";

const POSITIONS = [
  "GK",
  "CB",
  "LB",
  "RB",
  "CDM",
  "CM",
  "CAM",
  "LW",
  "RW",
  "CF",
  "ST",
];

const STORAGE_KEY = "auction_state_v3";
const MIN_RATING = 80;
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

const getBasePrice = (rating) => {
  const r = Number(rating);
  if (r >= 90) return 85;
  if (r >= 87) return 70;
  if (r >= 85) return 60;
  if (r >= 83) return 50;
  if (r >= 81) return 40;
  return 30;
};

const AdminAuctionControl = () => {
  const [availablePlayers, setAvailablePlayers] = useState({});
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [playerLoadError, setPlayerLoadError] = useState("");

  const [selectedTeam, setSelectedTeam] = useState(null);
  const [prices, setPrices] = useState({});
  const [seasonId, setSeasonId] = useState("S4");
  const [soldFlash, setSoldFlash] = useState(null);
  const [recentSold, setRecentSold] = useState([]);
  const [registeredTeams, setRegisteredTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsLoadError, setTeamsLoadError] = useState("");

  // Keep ref to unsubscribe the live listener on unmount
  const unsubRef = useRef(null);

  useEffect(() => {
    let active = true;

    const loadRegisteredTeams = async () => {
      try {
        const snapshot = await getDocs(collection(db, "users"));
        const teams = getRegisteredTeams(
          snapshot.docs.map((userDoc) => userDoc.data()),
        );
        if (active) {
          setRegisteredTeams(teams);
          setTeamsLoadError("");
        }
      } catch (error) {
        console.error("Failed to load registered teams:", error);
        if (active) {
          setTeamsLoadError("Registered teams could not be loaded.");
        }
      } finally {
        if (active) setTeamsLoading(false);
      }
    };

    loadRegisteredTeams();
    return () => {
      active = false;
    };
  }, []);

  /* ─────────────────────────────────────────
     LIVE LISTENER — currentPlayer/active
     Replaces getDoc — updates all screens
     instantly whenever any client writes to it
  ───────────────────────────────────────── */
  useEffect(() => {
    const ref = doc(db, "currentPlayer", "active");
    unsubRef.current = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) setCurrentPlayer(snap.data());
        else setCurrentPlayer(null);
      },
      (err) => console.error("currentPlayer listener error:", err),
    );
    return () => unsubRef.current?.();
  }, []);

  /* ─────────────────────────────────────────
     LIVE LISTENER — recent sold players
  ───────────────────────────────────────── */
  useEffect(() => {
    const q = query(collection(db, "players"), orderBy("updatedAt", "desc"), limit(50));
    const unsubSold = onSnapshot(
      q,
      (snap) => {
        const sold = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((p) => p.currentTeamId && p.currentSeasonId === seasonId && p.soldPrice > 0)
          .sort((a, b) => {
            const ta = a.updatedAt?.toMillis?.() || 0;
            const tb = b.updatedAt?.toMillis?.() || 0;
            return tb - ta;
          });
        setRecentSold(sold);
      },
      (err) => console.error("recent sold listener error:", err),
    );
    return () => unsubSold();
  }, [seasonId]);

  /* ─────────────────────────────────────────
     FETCH ALL PLAYERS (once, with cache)
  ───────────────────────────────────────── */
  const fetchAllPlayers = async () => {
    try {
      // limit(318) correctly applied as a query modifier
      const q = query(collection(db, "players"), limit(1000));
      const snapshot = await getDocs(q);
      const grouped = {};

      snapshot.docs.forEach((d) => {
        const player = { ...d.data(), ID: d.id };
        const rating = Number(player.Overall ?? player.Rating ?? 0);
        if (rating < MIN_RATING) return;
        if (!grouped[player.Position]) grouped[player.Position] = [];
        grouped[player.Position].push(player);
      });

      setAvailablePlayers(grouped);
      setPlayerLoadError("");
      return grouped;
    } catch (err) {
      console.error("Fetch players error:", err);
      setPlayerLoadError("Unable to load players. Check the database connection and try again.");
    }
  };

  /* ─────────────────────────────────────────
     RESTORE FROM CACHE OR FETCH FRESH
  ───────────────────────────────────────── */
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        const ageMs = Date.now() - (parsed.savedAt ?? 0);

        if (ageMs > CACHE_MAX_AGE_MS) {
          localStorage.removeItem(STORAGE_KEY);
          fetchAllPlayers();
        } else {
          const playersWithId =
            parsed.availablePlayers &&
            Object.values(parsed.availablePlayers).every((arr) =>
              Array.isArray(arr) ? arr.every((p) => p.ID) : false
            );

          if (!playersWithId) {
            localStorage.removeItem(STORAGE_KEY);
            fetchAllPlayers();
          } else {
            if (parsed.availablePlayers)
              setAvailablePlayers(parsed.availablePlayers);
            if (parsed.selectedPosition)
              setSelectedPosition(parsed.selectedPosition);
          }
        }
      } else {
        fetchAllPlayers();
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      fetchAllPlayers();
    }
  }, []);

  /* ─────────────────────────────────────────
     PERSIST TO CACHE (with timestamp)
  ───────────────────────────────────────── */
  useEffect(() => {
    if (!Object.keys(availablePlayers).length) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        availablePlayers,
        selectedPosition,
        savedAt: Date.now(),
      }),
    );
  }, [availablePlayers, selectedPosition]);

  /* ─────────────────────────────────────────
     HELPERS
  ───────────────────────────────────────── */
  const getPlayersForPosition = (position) => {
    if (position === "LW")
      return [
        ...(availablePlayers["LW"] || []),
        ...(availablePlayers["LM"] || []),
      ];
    if (position === "RW")
      return [
        ...(availablePlayers["RW"] || []),
        ...(availablePlayers["RM"] || []),
      ];
    return availablePlayers[position] || [];
  };

  const chooseRandomPosition = () => {
    const availablePositions = POSITIONS.filter(
      (position) => getPlayersForPosition(position).length > 0,
    );
    if (!availablePositions.length) {
      setSelectedPosition(null);
      return;
    }
    const index = Math.floor(Math.random() * availablePositions.length);
    setSelectedPosition(availablePositions[index]);
  };

  const chooseRandomPlayer = async () => {
    if (!selectedPosition) return;
    const players = getPlayersForPosition(selectedPosition);
    if (!players.length) return;
    setLoading(true);
    try {
      const randomIndex = Math.floor(Math.random() * players.length);
      const randomPlayer = players[randomIndex];

      const positionGroup = [
        ...(availablePlayers[randomPlayer.Position] || []),
      ];
      const idx = positionGroup.findIndex((p) => p.ID === randomPlayer.ID);
      if (idx > -1) positionGroup.splice(idx, 1);

      setAvailablePlayers((prev) => ({
        ...prev,
        [randomPlayer.Position]: positionGroup,
      }));

      await setDoc(doc(db, "currentPlayer", "active"), {
        ...randomPlayer,
        updatedAt: serverTimestamp(),
      });
      // No need to setCurrentPlayer here — onSnapshot picks it up automatically
    } catch (err) {
      console.error("Choose player error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (teamId, value) => {
    setPrices((prev) => ({ ...prev, [teamId]: value }));
  };

  const handleSell = () => {
    if (!currentPlayer || !selectedTeam || !prices[selectedTeam]) return;
    if (!registeredTeams.some((team) => team.id === selectedTeam)) {
      console.error("handleSell abort: selected team is not registered", selectedTeam);
      alert("Select a registered team before confirming the sale.");
      return;
    }
    if (!currentPlayer.ID) {
      console.error("handleSell abort: currentPlayer is missing ID", currentPlayer);
      alert("Player ID missing. Please choose a new player and try again.");
      return;
    }

    const playerId = currentPlayer.ID;
    const price = Number(prices[selectedTeam]);
    const teamId = selectedTeam;

    setSoldFlash(teamId);
    setTimeout(() => setSoldFlash(null), 1200);
    setSelectedTeam(null);
    setPrices({});

    // All three writes fire in parallel, none awaited
    updateDoc(doc(db, "players", playerId), {
      currentTeamId: teamId,
      currentSeasonId: seasonId,
      soldPrice: price,
      updatedAt: serverTimestamp(),
    }).catch(console.error);

    setDoc(
      doc(db, "season_players", `${seasonId}_${playerId}`),
      { playerId, teamId, seasonId, soldPrice: price },
      { merge: true },
    ).catch(console.error);

    setDoc(
      doc(db, "currentPlayer", "active"),
      {
        ...currentPlayer,
        soldPrice: price,
        soldTo: teamId,
        status: "sold",
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    ).catch(console.error);
  };

  const handleResetAuction = async () => {
    const confirmReset = window.confirm(
      "Reset auction state and local storage?",
    );
    if (!confirmReset) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
      setAvailablePlayers({});
      setSelectedPosition(null);
      setSelectedTeam(null);
      setPrices({});
      setSoldFlash(null);
      await setDoc(doc(db, "currentPlayer", "active"), {}, { merge: false });
      await fetchAllPlayers();
      alert("Auction reset complete.");
    } catch (err) {
      console.error("Reset error:", err);
    }
  };

  const canSell = !!(selectedTeam && prices[selectedTeam] && currentPlayer);
  const selectedTeamIsRegistered = registeredTeams.some(
    (team) => team.id === selectedTeam,
  );
  const canConfirmSale =
    canSell && selectedTeamIsRegistered && !teamsLoading && !teamsLoadError;
  const availablePlayerCount = Object.values(availablePlayers).reduce(
    (total, players) => total + players.length,
    0
  );

  return (
    <main className="min-h-screen overflow-x-hidden bg-fifa-bg px-4 py-6 text-fifa-text sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col">
      {/* HEADER */}
      <header className="mb-5 flex flex-col gap-4 border-b border-fifa-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-fifa-accent">
            Admin workspace
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-fifa-text sm:text-3xl">
            Auction control
          </h1>
          <p className="mt-2 text-sm text-fifa-text-secondary">
            Select a player, set a winning club, and record the sale.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <label htmlFor="auction-season" className="text-xs text-fifa-text-muted">
            Season
          </label>
          <input
            id="auction-season"
            value={seasonId}
            onChange={(e) => setSeasonId(e.target.value)}
            className="h-10 w-16 rounded-lg border border-fifa-border bg-fifa-surface text-center text-sm font-medium text-fifa-text outline-none focus:border-fifa-accent"
          />
          <button
            onClick={handleResetAuction}
            className="h-10 rounded-lg border border-fifa-border px-3 text-xs font-medium text-fifa-text-secondary transition hover:border-fifa-danger/40 hover:text-fifa-danger"
          >
            Reset
          </button>
        </div>
      </header>

      {/* MAIN PANEL */}
      <div className="grid items-start overflow-hidden rounded-2xl border border-fifa-border bg-fifa-surface lg:grid-cols-3">
        {/* ── COLUMN 1 ── */}
        <div className="flex min-w-0 flex-col p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-fifa-accent/10 text-fifa-accent">
              <span className="text-xs font-semibold">01</span>
            </span>
            <h2 className="text-sm font-semibold text-fifa-text">Current lot</h2>
          </div>

          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={chooseRandomPosition}
              disabled={POSITIONS.every(
                (p) => getPlayersForPosition(p).length === 0,
              )}
              className="min-h-10 flex-1 rounded-lg bg-fifa-card text-fifa-text-secondary shadow-none hover:bg-fifa-elevated disabled:opacity-40"
            >
              Random Position
            </Button>
            <Button
              onClick={chooseRandomPlayer}
              disabled={
                loading ||
                !selectedPosition ||
                getPlayersForPosition(selectedPosition).length === 0
              }
              className="min-h-10 flex-1 rounded-lg shadow-none disabled:opacity-40"
            >
              Random Player
            </Button>
          </div>

          <div className="w-full flex flex-col items-start gap-2">
            <div className="w-full">
              {selectedPosition ? (
                <div className="flex items-center justify-between rounded-xl border border-fifa-border bg-fifa-bg/40 px-4 py-3">
                  <span className="text-xs text-fifa-text-muted">
                    Position
                  </span>
                  <Text
                    variant="heading"
                    className="text-2xl font-semibold tracking-tight text-fifa-accent"
                  >
                    {selectedPosition}
                  </Text>
                </div>
              ) : (
                <div className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-dashed border-fifa-border px-4">
                  <span className="text-xs text-fifa-text-muted">
                    No position selected
                  </span>
                </div>
              )}
            </div>

            <div className="mb-2 mt-3 w-full">
              {currentPlayer ? (
                <div className="w-full max-w-full">
                  <PlayerCardDemo player={currentPlayer} />
                  <div className="mt-3 rounded-xl border border-fifa-border bg-fifa-bg/40 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-fifa-text-muted">
                        Base Price
                      </span>
                      <Text
                        variant="heading"
                        className="text-xl font-semibold text-fifa-accent"
                      >
                        {getBasePrice(
                          currentPlayer.Overall ?? currentPlayer.Rating,
                        )}M
                      </Text>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-fifa-text/30">
                        Overall {currentPlayer.Overall ?? currentPlayer.Rating}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-48 w-full flex-col items-center justify-center rounded-xl border border-dashed border-fifa-border px-4 text-center">
                <p className="text-sm font-medium text-fifa-text">
                  {playerLoadError
                    ? "Player list unavailable"
                    : availablePlayerCount === 0
                      ? "No players in the database"
                      : "No player selected"}
                </p>
                <p className="mt-1 text-xs text-fifa-text-muted">
                  {playerLoadError ||
                    (availablePlayerCount === 0
                      ? "Add the roster when you are ready to start an auction."
                      : "Choose an available position and player to start a lot.")}
                </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── COLUMN 2 ── */}
        <div className="flex min-w-0 flex-col border-y border-fifa-border p-4 sm:p-5 lg:border-x lg:border-y-0">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-fifa-accent/10 text-fifa-accent">
              <span className="text-xs font-semibold">02</span>
            </span>
            <h2 className="text-sm font-semibold text-fifa-text">Select winning club</h2>
          </div>

          <div className="flex flex-col gap-2">
            {teamsLoadError ? (
              <p role="alert" className="text-sm text-fifa-danger">
                {teamsLoadError}
              </p>
            ) : teamsLoading ? (
              <p className="text-sm text-fifa-text-muted">
                Loading registered teams...
              </p>
            ) : registeredTeams.length === 0 ? (
              <p className="text-sm text-fifa-text-muted">
                No registered teams are available.
              </p>
            ) : registeredTeams.map((team) => {
              const isSelected = selectedTeam === team.id;
              const justSold = soldFlash === team.id;
              return (
                <div
                  key={team.id}
                  className={`
                    w-full flex items-center gap-2
                    px-2 sm:px-3 py-2
                    rounded-xl border
                    transition-all duration-200 min-w-0
                    ${
                      justSold
                        ? "bg-fifa-success/10 border-fifa-success/40"
                        : isSelected
                            ? "bg-fifa-accent/[0.08] border-fifa-accent/50"
                            : "bg-fifa-bg/30 border-fifa-border hover:bg-fifa-card"
                    }
                  `}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white/10"
                    style={{ backgroundColor: team.color }}
                  />
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() =>
                      setSelectedTeam(isSelected ? null : team.id)
                    }
                    className="min-w-0 flex-1 truncate py-2 text-left text-sm font-medium text-fifa-text"
                  >
                    {team.name}
                  </button>
                  <div
                    className="flex items-center gap-1.5 rounded-lg border border-fifa-border bg-fifa-bg/60 px-2 py-1.5 shrink-0"
                  >
                    <span className="text-fifa-text-muted text-xs">M</span>
                    <input
                      type="number"
                      aria-label={`Price in millions for ${team.name}`}
                      placeholder="0"
                      value={prices[team.id] || ""}
                      onChange={(e) =>
                        handlePriceChange(team.id, e.target.value)
                      }
                      className="w-12 bg-transparent text-right text-sm text-fifa-text placeholder:text-fifa-text-muted focus:outline-none sm:w-16"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleSell}
            disabled={!canConfirmSale}
            className={`mt-4 min-h-11 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              !canConfirmSale
                ? "cursor-not-allowed border border-fifa-border bg-fifa-bg/40 text-fifa-text-muted"
                : "bg-fifa-accent text-fifa-bg hover:bg-fifa-accent-hover"
            }`}
          >
            Confirm Sale
          </button>
        </div>

        {/* ── COLUMN 3 ── */}
        <div className="flex min-w-0 flex-col p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-fifa-accent/10 text-fifa-accent">
              <span className="text-xs font-semibold">03</span>
            </span>
            <h2 className="text-sm font-semibold text-fifa-text">Recent sales</h2>
          </div>

          <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
            {recentSold.length === 0 ? (
              <div className="rounded-xl border border-dashed border-fifa-border px-4 py-8 text-center text-sm text-fifa-text-muted">
                No sales recorded yet.
              </div>
            ) : (
              recentSold.map((player) => {
                const team = registeredTeams.find(
                  (registeredTeam) =>
                    registeredTeam.id === player.currentTeamId,
                );
                return (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 rounded-xl border border-fifa-border bg-fifa-bg/30 px-3 py-2.5"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-fifa-text truncate">
                        {player.Name || player.name}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-fifa-text-muted">
                        {player.Position}
                      </div>
                    </div>
                    {team && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: team.color }}
                        />
                        <span className="text-[11px] text-fifa-text-secondary">
                          {team.name}
                        </span>
                      </div>
                    )}
                    <div className="text-sm font-semibold text-fifa-accent shrink-0">
                      {player.soldPrice}M
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      </div>
    </main>
  );
};

export default AdminAuctionControl;
