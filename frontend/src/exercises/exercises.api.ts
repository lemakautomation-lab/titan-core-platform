import { apiRequest } from "../api/client";

export interface ExerciseDto {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description: string | null;
  movement: string;
  muscleGroups: string[];
  equipment: string[];
  trainingObjective: string;
  difficulty: string;
  trainingPhase: string | null;
  sportId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExercisesListResponse {
  data: ExerciseDto[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export async function listExercises(): Promise<ExerciseDto[]> {
  const result =
    await apiRequest<ExercisesListResponse>(
      "/exercises",
    );

  return result.data;
}
