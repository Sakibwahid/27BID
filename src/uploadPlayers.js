import Papa from "papaparse";
import { db } from "./lib/firebase/config";
import { doc, writeBatch } from "firebase/firestore";

export async function uploadPlayersToFirestore() {
  return new Promise((resolve, reject) => {
    Papa.parse("/27BID.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: async ({ data }) => {
        try {
          let batch = writeBatch(db);
          let batchSize = 0;
          let uploaded = 0;

          for (const player of data) {
            const playerId = String(player.ID ?? "").trim();
            if (!playerId) continue;

            const playerData = {};
            Object.keys(player).forEach((key) => {
              const value = player[key];

              if (value === "") {
                playerData[key] = null;
              } else if (!isNaN(value) && value !== "") {
                playerData[key] = Number(value);
              } else {
                playerData[key] = value;
              }
            });

            playerData.ID = playerId;
            playerData.Name =
              String(player.common_name ?? "").trim() ||
              [player.first_name, player.last_name].filter(Boolean).join(" ");
            playerData.Acceleration = Number(
              player.Acceleration ?? player.movement_acceleration
            ) || null;
            playerData.ShotPower = Number(
              player.ShotPower ?? player.power_shot_power
            ) || null;
            playerData.ShortPassing = Number(
              player.ShortPassing ?? player.attacking_short_passing
            ) || null;
            playerData.Dribbling = Number(
              player.Dribbling ?? player.skill_dribbling
            ) || null;
            playerData.StandingTackle = Number(
              player.StandingTackle ?? player.defending_standing_tackle
            ) || null;
            playerData.Strength = Number(
              player.Strength ?? player.power_strength
            ) || null;
            playerData.GKHandling = Number(
              player.GKHandling ?? player.goalkeeping_handling
            ) || null;
            playerData.GKPositioning = Number(
              player.GKPositioning ?? player.goalkeeping_positioning
            ) || null;
            playerData.GKReflexes = Number(
              player.GKReflexes ?? player.goalkeeping_reflexes
            ) || null;
            batch.set(doc(db, "players", playerId), playerData);
            batchSize += 1;
            uploaded += 1;

            if (batchSize === 500) {
              await batch.commit();
              batch = writeBatch(db);
              batchSize = 0;
            }
          }

          if (batchSize > 0) await batch.commit();
          resolve({ uploaded });
        } catch (error) {
          reject(error);
        }
      },
      error: reject,
    });
  });
}