import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  writeBatch,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase/config";

const positions = [
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

const overalls = ["95", "90", "85", "80"];

const PlayerTableAssign = () => {
  const [players, setPlayers] = useState([]);
  const [selected, setSelected] = useState({});
  const [position, setPosition] = useState("");
  const [maxOverall, setMaxOverall] = useState("95");
  const [teamId, setTeamId] = useState("");
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // 🔹 Fetch teamId once on mount
useEffect(() => {
  const fetchTeam = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        setTeamId(snap.data().teamId);
        console.log("Team ID loaded:", snap.data().teamId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  fetchTeam(); // first run
  const timer = setTimeout(fetchTeam, 1000); // second run after 1 sec

  return () => clearTimeout(timer);
}, []);


  // 🔹 Fetch filtered players when position or maxOverall changes
  useEffect(() => {
    const fetchPlayers = async () => {
      setLoadingPlayers(true);
      try {
        let q;

        if (position) {
          // With position filter
          q = query(
            collection(db, "players"),
            where("Position", "==", position),
            where("Overall", "<=", maxOverall),
            orderBy("Overall", "desc")
          );
        } else {
          // Without position filter
          q = query(
            collection(db, "players"),
            where("Overall", "<=", Number(maxOverall)),
            orderBy("Overall", "desc")
          );
        }

        const snapshot = await getDocs(q);
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setPlayers(list);
      } catch (err) {
        console.error("Error fetching players:", err);
      } finally {
        setLoadingPlayers(false);
      }
    };

    fetchPlayers();
  }, [position, maxOverall]);

  // 🔹 Select / deselect a player
  const toggleSelect = (id) => {
    setSelected((prev) => {
      if (prev[id]) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: { soldPrice: "" } };
    });
  };

  // 🔹 Update sold price per player
  const updatePrice = (id, value) => {
    setSelected((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        soldPrice: value,
      },
    }));
  };

  // 🔹 Assign selected players to team
  const assignPlayers = async () => {
    if (!teamId) return alert("Team not found");
    if (Object.keys(selected).length === 0)
      return alert("No players selected");

    const invalid = Object.values(selected).some((data) => !data.soldPrice);
    if (invalid) return alert("Please enter sold price for all selected players");

    setAssigning(true);

    try {
      const batch = writeBatch(db);

      Object.entries(selected).forEach(([playerId, data]) => {
        const playerRef = doc(db, "players", playerId);
        batch.update(playerRef, {
          currentTeamId: teamId,
          currentSeasonId: "S2",
          soldPrice: Number(data.soldPrice),
        });
      });

      await batch.commit();
      setSelected({});
      alert("Players assigned successfully");
    } catch (err) {
      console.error("Error assigning players:", err);
      alert("Error assigning players");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <main className="min-h-screen bg-fifa-bg px-4 py-8 text-fifa-text sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 border-b border-fifa-border pb-5">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-fifa-accent">
            Admin workspace
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-fifa-text sm:text-3xl">
            Assign players
          </h1>
          <p className="mt-2 text-sm text-fifa-text-secondary">
            Choose players, enter their sale prices, and assign them to your club.
          </p>
        </header>

        <section className="overflow-hidden rounded-2xl border border-fifa-border bg-fifa-surface">
          <div className="flex flex-col gap-3 border-b border-fifa-border p-4 sm:flex-row sm:items-center sm:p-5">
            <label className="sr-only" htmlFor="assign-position">Filter by position</label>
            <select
              id="assign-position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="h-10 rounded-lg border border-fifa-border bg-fifa-bg px-3 text-sm text-fifa-text outline-none focus:border-fifa-accent"
            >
              {positions.map((p) => (
                <option key={p} value={p}>
                  {p || "All positions"}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="assign-rating">Filter by maximum overall</label>
            <select
              id="assign-rating"
              value={maxOverall}
              onChange={(e) => setMaxOverall(e.target.value)}
              className="h-10 rounded-lg border border-fifa-border bg-fifa-bg px-3 text-sm text-fifa-text outline-none focus:border-fifa-accent"
            >
              {overalls.map((o) => (
                <option key={o} value={o}>
                  Overall ≤ {o}
                </option>
              ))}
            </select>

            <span className="text-xs text-fifa-text-muted sm:ml-auto">
              {teamId ? "Club ready for assignment" : "Loading club..."}
            </span>
            <button
              onClick={assignPlayers}
              disabled={!teamId || assigning || !Object.keys(selected).length}
              className="min-h-10 rounded-lg bg-fifa-accent px-4 text-sm font-semibold text-fifa-bg transition hover:bg-fifa-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              {assigning ? "Assigning..." : "Assign selected"}
            </button>
          </div>

          {loadingPlayers ? (
            <div className="flex min-h-48 items-center justify-center text-sm text-fifa-text-muted">
              Loading players...
            </div>
          ) : players.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <p className="text-sm font-medium text-fifa-text">No player records available</p>
              <p className="mt-2 text-xs text-fifa-text-muted">
                Players will appear here after the roster is imported.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
                <thead className="bg-fifa-bg/60 text-xs uppercase tracking-wider text-fifa-text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">Select</th>
                    <th scope="col" className="px-4 py-3 font-medium">Player</th>
                    <th scope="col" className="px-4 py-3 font-medium">Position</th>
                    <th scope="col" className="px-4 py-3 font-medium">Overall</th>
                    <th scope="col" className="px-4 py-3 font-medium">Sale price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fifa-border">
                  {players.map((p) => (
                    <tr key={p.id} className="transition hover:bg-fifa-elevated">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={!!selected[p.id]}
                          onChange={() => toggleSelect(p.id)}
                          aria-label={`Select ${p.Name}`}
                          className="h-4 w-4 accent-fifa-accent"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-fifa-text">{p.Name}</td>
                      <td className="px-4 py-3 text-fifa-text-secondary">{p.Position}</td>
                      <td className="px-4 py-3 text-fifa-text-secondary">{p.Overall}</td>
                      <td className="px-4 py-3">
                        {selected[p.id] ? (
                          <input
                            type="number"
                            value={selected[p.id].soldPrice}
                            onChange={(e) => updatePrice(p.id, e.target.value)}
                            aria-label={`Sale price for ${p.Name}`}
                            className="h-9 w-28 rounded-lg border border-fifa-border bg-fifa-bg px-3 text-fifa-text outline-none focus:border-fifa-accent"
                          />
                        ) : (
                          <span className="text-fifa-text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default PlayerTableAssign;
