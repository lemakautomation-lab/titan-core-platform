import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  listUsers,
} from "./users.api";

import { apiRequest } from "../api/client";

vi.mock("../api/client", () => ({
  apiRequest: vi.fn(),
}));

const apiRequestMock =
  vi.mocked(apiRequest);

describe("users.api", () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists users for the authenticated tenant", async () => {

    const users = [
      {
        id: "user-1",
        tenantId: "tenant-1",
        organisationId: null,
        email: "user@example.com",
        firstName: "Test",
        lastName: "User",
        status: "ACTIVE",
        createdAt: "2026-08-25T08:00:00.000Z",
        updatedAt: "2026-08-25T08:00:00.000Z",
      },
    ];

    apiRequestMock.mockResolvedValue(users);

    const result =
      await listUsers("tenant-1");

    expect(
      apiRequestMock,
    ).toHaveBeenCalledWith(
      "/users?tenantId=tenant-1",
    );

    expect(result).toEqual(users);
  });

  it("URL-encodes the tenant ID", async () => {

    apiRequestMock.mockResolvedValue([]);

    await listUsers("tenant/with spaces");

    expect(
      apiRequestMock,
    ).toHaveBeenCalledWith(
      "/users?tenantId=tenant%2Fwith%20spaces",
    );
  });

  it("propagates API failures", async () => {

    apiRequestMock.mockRejectedValue(
      new Error("Forbidden"),
    );

    await expect(
      listUsers("tenant-1"),
    ).rejects.toThrow("Forbidden");
  });

});
