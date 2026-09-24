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
