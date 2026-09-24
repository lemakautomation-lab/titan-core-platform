import { apiRequest } from "../api/client";

export interface ClubExecutivePage {
  organisationId: string;
  organisationName: string;
  activeChildOrganisationCount: number;
  executives: Array<{ id: string; name: string }>;
  nextCursor: string | null;
}

export function getClubExecutives(cursor?: string): Promise<ClubExecutivePage> {
  return apiRequest<ClubExecutivePage>(
    `/club/executives?limit=25${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
  );
}

export interface ClubDirectorPage {
  organisationId: string;
  directors: Array<{ id: string; name: string }>;
  nextCursor: string | null;
}

export function getClubDirectors(cursor?: string): Promise<ClubDirectorPage> {
  return apiRequest<ClubDirectorPage>(
    `/club/directors?limit=25${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
  );
}

export interface ClubCoachPage {
  organisationId: string;
  coaches: Array<{ id: string; name: string }>;
  nextCursor: string | null;
}

export function getClubCoaches(cursor?: string): Promise<ClubCoachPage> {
  return apiRequest<ClubCoachPage>(
    `/club/coaches?limit=25${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
  );
}

export interface ClubScientistPage {
  organisationId: string;
  scientists: Array<{ id: string; name: string }>;
  nextCursor: string | null;
}

export function getClubScientists(cursor?: string): Promise<ClubScientistPage> {
  return apiRequest<ClubScientistPage>(
    `/club/scientists?limit=25${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
  );
}

export interface ClubConditioningPage {
  organisationId: string;
  conditioning: Array<{ id: string; name: string }>;
  nextCursor: string | null;
}

export function getClubConditioning(cursor?: string): Promise<ClubConditioningPage> {
  return apiRequest<ClubConditioningPage>(
    `/club/conditioning?limit=25${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
  );
}

export interface ClubNutritionPage {
  organisationId: string;
  nutrition: Array<{ id: string; name: string }>;
  nextCursor: string | null;
}

export function getClubNutrition(cursor?: string): Promise<ClubNutritionPage> {
  return apiRequest<ClubNutritionPage>(
    `/club/nutrition?limit=25${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
  );
}

export interface ClubRehabilitationPage {
  organisationId: string;
  rehabilitation: Array<{ id: string; name: string }>;
  nextCursor: string | null;
}

export function getClubRehabilitation(cursor?: string): Promise<ClubRehabilitationPage> {
  return apiRequest<ClubRehabilitationPage>(
    `/club/rehabilitation?limit=25${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
  );
}
