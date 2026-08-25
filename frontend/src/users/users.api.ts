import { apiRequest } from "../api/client";
import { UserDto } from "./users.types";

export async function listUsers(
  tenantId: string,
): Promise<UserDto[]> {

  return apiRequest<UserDto[]>(
    `/users?tenantId=${encodeURIComponent(tenantId)}`,
  );
}
