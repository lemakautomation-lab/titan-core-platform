import { apiRequest } from "../api/client";

export interface SportDto {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface SportsListResponse {
  data: SportDto[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export async function listSports(
  tenantId: string,
): Promise<SportDto[]> {
  const result = await apiRequest<SportsListResponse>(
    "/sports",
  );

  return result.data;
}
