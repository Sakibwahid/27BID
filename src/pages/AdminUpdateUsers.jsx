import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Medal, Plus, Trash2, UserRound } from "lucide-react";
import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  runTransaction,
  updateDoc,
} from "firebase/firestore";
import { Link } from "react-router-dom";

import { db } from "../lib/firebase/config";
import { Button } from "../components/ui/Button";

const GAMES = Array.from({ length: 9 }, (_, index) => `FIFA ${19 + index}`);
const PLACES = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"];
const SEASONS = ["S1", "S2", "S3", "S4"];

const sameAchievement = (current, target) => {
  if (current.id || target.id) return current.id === target.id;

  const sameCreatedAt =
    current.createdAt === target.createdAt ||
    current.createdAt?.isEqual?.(target.createdAt) ||
    target.createdAt?.isEqual?.(current.createdAt);

  return (
    current.place === target.place &&
    current.game === target.game &&
    current.season === target.season &&
    sameCreatedAt
  );
};

const AdminUpdateUsers = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [form, setForm] = useState({ place: "", game: "", season: "" });
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingAchievementIndex, setDeletingAchievementIndex] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let active = true;

    const loadUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, "users"));
        const userList = snapshot.docs
          .map((userDoc) => ({ id: userDoc.id, ...userDoc.data() }))
          .filter((userData) => userData.role !== "admin")
          .sort((a, b) =>
            (a.username || a.email || "").localeCompare(
              b.username || b.email || "",
            ),
          );

        if (active) {
          setUsers(userList);
          setSelectedUserId(userList[0]?.id || "");
        }
      } catch (error) {
        console.error("Failed to load users:", error);
        if (active) {
          setStatus({
            type: "error",
            message: "Users could not be loaded. Please try again.",
          });
        }
      } finally {
        if (active) setLoadingUsers(false);
      }
    };

    loadUsers();
    return () => {
      active = false;
    };
  }, []);

  const selectedUser = useMemo(
    () => users.find((userData) => userData.id === selectedUserId),
    [users, selectedUserId],
  );

  const handleDeleteAchievement = async (achievement) => {
    if (!selectedUser) return;

    const userName = selectedUser.username || selectedUser.email;
    if (
      !window.confirm(
        `Delete the ${achievement.place} achievement for ${userName}?`,
      )
    ) {
      return;
    }

    setDeletingAchievementIndex(
      selectedUser.achievements.findIndex((item) =>
        sameAchievement(item, achievement),
      ),
    );
    setStatus(null);

    try {
      const userRef = doc(db, "users", selectedUser.id);
      const updatedAchievements = await runTransaction(db, async (transaction) => {
        const userSnapshot = await transaction.get(userRef);
        if (!userSnapshot.exists()) {
          throw new Error("The selected user no longer exists.");
        }

        const achievements = Array.isArray(userSnapshot.data().achievements)
          ? userSnapshot.data().achievements
          : [];
        const achievementIndex = achievements.findIndex((item) =>
          sameAchievement(item, achievement),
        );
        if (achievementIndex < 0) {
          throw new Error("This achievement was already removed. Reload and try again.");
        }

        const updated = achievements.filter(
          (_, index) => index !== achievementIndex,
        );
        transaction.update(userRef, { achievements: updated });
        return updated;
      });

      setUsers((previous) =>
        previous.map((userData) =>
          userData.id === selectedUser.id
            ? { ...userData, achievements: updatedAchievements }
            : userData,
        ),
      );
      setStatus({ type: "success", message: "Achievement deleted." });
    } catch (error) {
      console.error("Failed to delete user achievement:", error);
      setStatus({
        type: "error",
        message: error.message || "Achievement could not be deleted.",
      });
    } finally {
      setDeletingAchievementIndex(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedUser) return;

    const achievement = {
      place: form.place.trim(),
      game: form.game.trim(),
      season: form.season.trim(),
      createdAt: Date.now(),
    };

    if (!achievement.place || !achievement.game || !achievement.season) {
      setStatus({
        type: "error",
        message: "Enter a place, game, and season before saving.",
      });
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      await updateDoc(doc(db, "users", selectedUser.id), {
        achievements: arrayUnion(achievement),
      });

      setUsers((previous) =>
        previous.map((userData) =>
          userData.id === selectedUser.id
            ? {
                ...userData,
                achievements: [
                  ...(Array.isArray(userData.achievements)
                    ? userData.achievements
                    : []),
                  achievement,
                ],
              }
            : userData,
        ),
      );
      setForm({ place: "", game: "", season: "" });
      setStatus({
        type: "success",
        message: `Achievement added for ${selectedUser.username || selectedUser.email}.`,
      });
    } catch (error) {
      console.error("Failed to save user achievement:", error);
      setStatus({
        type: "error",
        message: error.message || "Achievement could not be saved.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4.5rem)] bg-fifa-bg px-4 py-8 text-fifa-text sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-sm text-fifa-text-muted transition hover:text-fifa-text"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to dashboard
        </Link>

        <section className="mt-7 rounded-2xl border border-fifa-border bg-fifa-surface p-5 sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-fifa-accent/20 bg-fifa-accent/[0.07] text-fifa-accent">
            <Medal size={21} aria-hidden="true" />
          </div>
          <h1 className="mt-5 font-[manrope] text-2xl font-semibold tracking-tight text-fifa-text">
            Update users
          </h1>
          <p className="mt-2 text-sm leading-6 text-fifa-text-secondary">
            Add a title-history achievement to a user&apos;s dashboard.
          </p>

          {status && (
            <p
              role={status.type === "error" ? "alert" : "status"}
              className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
                status.type === "error"
                  ? "border-fifa-danger/25 bg-fifa-danger/[0.06] text-fifa-danger"
                  : "border-fifa-success/25 bg-fifa-success/[0.06] text-fifa-success"
              }`}
            >
              {status.message}
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="user"
                className="mb-1.5 block text-sm font-medium text-fifa-text-secondary"
              >
                User
              </label>
              <select
                id="user"
                value={selectedUserId}
                onChange={(event) => {
                  setSelectedUserId(event.target.value);
                  setStatus(null);
                }}
                disabled={
                  loadingUsers || !users.length || deletingAchievementIndex !== null
                }
                required
                className="block w-full rounded-lg border border-fifa-border bg-fifa-surface px-4 py-2.5 text-fifa-text outline-none transition focus:border-fifa-accent focus:ring-2 focus:ring-fifa-accent/10 disabled:opacity-60"
              >
                {loadingUsers ? (
                  <option value="">Loading users...</option>
                ) : users.length ? (
                  users.map((userData) => (
                    <option key={userData.id} value={userData.id}>
                      {userData.username || userData.email || userData.id}
                      {userData.teamName ? ` — ${userData.teamName}` : ""}
                    </option>
                  ))
                ) : (
                  <option value="">No users found</option>
                )}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="achievement-place"
                  className="mb-1.5 block text-sm font-medium text-fifa-text-secondary"
                >
                  Place
                </label>
                <select
                  id="achievement-place"
                  value={form.place}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      place: event.target.value,
                    }))
                  }
                  required
                  className="block w-full rounded-lg border border-fifa-border bg-fifa-surface px-4 py-2.5 text-fifa-text placeholder:text-fifa-text-muted outline-none transition focus:border-fifa-accent focus:ring-2 focus:ring-fifa-accent/10"
                >
                  <option value="">Select a place</option>
                  {PLACES.map((place) => (
                    <option key={place} value={place}>
                      {place}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="achievement-game"
                  className="mb-1.5 block text-sm font-medium text-fifa-text-secondary"
                >
                  Which game
                </label>
                <select
                  id="achievement-game"
                  value={form.game}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      game: event.target.value,
                    }))
                  }
                  required
                  className="block w-full rounded-lg border border-fifa-border bg-fifa-surface px-4 py-2.5 text-fifa-text placeholder:text-fifa-text-muted outline-none transition focus:border-fifa-accent focus:ring-2 focus:ring-fifa-accent/10"
                >
                  <option value="">Select a game</option>
                  {GAMES.map((game) => (
                    <option key={game} value={game}>
                      {game}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="achievement-season"
                  className="mb-1.5 block text-sm font-medium text-fifa-text-secondary"
                >
                  What season
                </label>
                <select
                  id="achievement-season"
                  value={form.season}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      season: event.target.value,
                    }))
                  }
                  required
                  className="block w-full rounded-lg border border-fifa-border bg-fifa-surface px-4 py-2.5 text-fifa-text placeholder:text-fifa-text-muted outline-none transition focus:border-fifa-accent focus:ring-2 focus:ring-fifa-accent/10"
                >
                  <option value="">Select a season</option>
                  {SEASONS.map((season) => (
                    <option key={season} value={season}>
                      {season}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              type="submit"
              disabled={
                loadingUsers ||
                !selectedUser ||
                saving ||
                deletingAchievementIndex !== null
              }
              className="min-h-11 rounded-xl"
            >
              <Plus size={17} aria-hidden="true" />
              {saving ? "Saving achievement..." : "Add achievement"}
            </Button>
          </form>

          {selectedUser && (
            <section
              aria-label={`${selectedUser.username || "User"} achievements`}
              className="mt-8 border-t border-fifa-border pt-6"
            >
              <h2 className="flex items-center gap-2 text-sm font-semibold text-fifa-text">
                <UserRound
                  size={16}
                  aria-hidden="true"
                  className="text-fifa-text-muted"
                />
                Existing achievements
              </h2>
              {Array.isArray(selectedUser.achievements) &&
              selectedUser.achievements.length ? (
                <ul className="mt-3 space-y-2">
                  {selectedUser.achievements.map((achievement, index) => (
                    <li
                      key={
                        achievement.id ||
                        `${achievement.game}-${achievement.season}-${index}`
                      }
                      className="flex items-center justify-between gap-3 rounded-lg border border-fifa-border bg-fifa-bg/50 px-4 py-3 text-sm"
                    >
                      <span className="min-w-0">
                        <span className="font-medium text-fifa-text">
                          {achievement.place}
                        </span>
                        <span className="text-fifa-text-secondary">
                          {" "}
                          · {achievement.game} · {achievement.season}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteAchievement(achievement)}
                        disabled={
                          saving || deletingAchievementIndex !== null
                        }
                        aria-label={`Delete ${achievement.place} ${achievement.game} ${achievement.season} achievement`}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-fifa-danger/25 px-2.5 py-1.5 text-xs font-medium text-fifa-danger transition hover:bg-fifa-danger/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                        {deletingAchievementIndex >= 0 &&
                        selectedUser.achievements[deletingAchievementIndex] ===
                          achievement
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-fifa-text-muted">
                  No achievements added for this user yet.
                </p>
              )}
            </section>
          )}
        </section>
      </div>
    </main>
  );
};

export default AdminUpdateUsers;
