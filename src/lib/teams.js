const TEAM_DEFINITIONS = [
  {
    id: "wolves01",
    name: "Wolves",
    aliases: ["Wolves", "Wolverhampton Wanderers F.C."],
    color: "#FDB913",
  },
  {
    id: "bayern05",
    name: "Bayern Munich",
    aliases: ["Bayern Munich", "FC Bayern Munich"],
    color: "#FFFFFF",
  },
  {
    id: "city04",
    name: "Manchester City",
    aliases: ["Manchester City", "Manchester City F.C."],
    color: "#6CABDD",
  },
  {
    id: "paris03",
    name: "Paris Saint-Germain",
    aliases: ["Paris Saint-Germain", "Paris Saint-Germain F.C."],
    color: "#f507da",
  },
  {
    id: "liverpool01",
    name: "Liverpool",
    aliases: ["Liverpool", "Liverpool FC"],
    color: "#C8102E",
  },
  {
    id: "chelsea01",
    name: "Chelsea",
    aliases: ["Chelsea", "Chelsea F.C."],
    color: "#034694",
  },
  {
    id: "realmadrid01",
    name: "Real Madrid",
    aliases: ["Real Madrid", "Real Madrid C.F."],
    color: "#FEBE10",
  },
  {
    id: "united03",
    name: "Manchester United",
    aliases: ["Manchester United", "Manchester United F.C."],
    color: "#DA291C",
  },
  {
    id: "arsenal01",
    name: "Arsenal",
    aliases: ["Arsenal", "Arsenal F.C."],
    color: "#EF0107",
  },
];

const normalizeTeamName = (name) =>
  String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export const getTeamIdForUser = (userData) => {
  const teamById = TEAM_DEFINITIONS.find(
    (team) =>
      team.id === userData?.teamId ||
      team.aliases.some(
        (alias) =>
          normalizeTeamName(alias) === normalizeTeamName(userData?.teamId),
      ),
  );
  if (teamById) return teamById.id;

  const teamByName = TEAM_DEFINITIONS.find((team) =>
    team.aliases.some(
      (alias) =>
        normalizeTeamName(alias) === normalizeTeamName(userData?.teamName),
    ),
  );

  return teamByName?.id || userData?.teamId || null;
};

export const getRegisteredTeams = (users) => {
  const teamsById = new Map();

  users.forEach((userData) => {
    if (userData.role === "admin") return;

    const id = getTeamIdForUser(userData);
    if (!id || teamsById.has(id)) return;

    const definition = TEAM_DEFINITIONS.find((team) => team.id === id);
    const name =
      definition?.name ||
      userData.teamName ||
      userData.teamId;

    teamsById.set(id, {
      id,
      name,
      color: definition?.color || "#6CABDD",
    });
  });

  return [...teamsById.values()].sort((a, b) => a.name.localeCompare(b.name));
};
