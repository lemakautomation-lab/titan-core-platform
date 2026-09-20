import { apiRequest } from "../api/client";

export interface CoachSquadDto {
  id: string;
  name: string;
  description: string | null;
  status: string;
}

export interface CoachTeamDto {
  id: string;
  name: string;
  description: string | null;
  status: string;
}

export interface CoachAthleteDto {
  athleteId: string;
  firstName: string;
  lastName: string;
  countryCode: string | null;
  status: string;
  relationshipId: string;
  relationshipStatus: string;
  startsAt: string | null;
  endsAt: string | null;
}

export interface CoachMonitoringDto {
  athleteId: string;
  performance: unknown[];
  recovery: unknown[];
  trainingStress: unknown[];
  workoutProgrammes: unknown[];
}

export interface CreateCoachTrainingInput {
  athleteId: string;
  name: string;
  description?: string;
  goal: string;
  experience: string;
  trainingFrequency: number;
  sessionDurationMinutes: number;
  sportId?: string | null;
}

export const getCoachSquads = () =>
  apiRequest<CoachSquadDto[]>("/coach/squads");

export const createCoachSquad = (
  name: string,
) =>
  apiRequest<CoachSquadDto>("/coach/squads", {
    method: "POST",
    body: JSON.stringify({ name }),
  });

export const getCoachTeams = () =>
  apiRequest<CoachTeamDto[]>("/coach/teams");

export const createCoachTeam = (
  name: string,
) =>
  apiRequest<CoachTeamDto>("/coach/teams", {
    method: "POST",
    body: JSON.stringify({ name }),
  });

export const getCoachAthletes = () =>
  apiRequest<CoachAthleteDto[]>("/coach/athletes");

export const addCoachAthlete = (
  athleteId: string,
) =>
  apiRequest<{ relationshipId: string }>(
    "/coach/athletes",
    {
      method: "POST",
      body: JSON.stringify({ athleteId }),
    },
  );

export const removeCoachAthlete = (
  athleteId: string,
) =>
  apiRequest<void>(
    `/coach/athletes/${encodeURIComponent(athleteId)}`,
    { method: "DELETE" },
  );

export const getCoachAthleteMonitoring = (
  athleteId: string,
) =>
  apiRequest<CoachMonitoringDto>(
    `/coach/athletes/${encodeURIComponent(
      athleteId,
    )}/performance-monitoring`,
  );

export const createCoachTrainingProgramme = (
  input: CreateCoachTrainingInput,
) =>
  apiRequest<{ id: string }>(
    "/coach/training/programmes",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
