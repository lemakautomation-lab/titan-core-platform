import { describe, expect, it, vi } from "vitest";

import {
  registerAthlete,
  login,
  refresh,
  logout,
  me,
} from "./auth.api";

import { apiRequest } from "../api/client";

vi.mock("../api/client", () => ({
  apiRequest: vi.fn(),
}));

const apiRequestMock =
  vi.mocked(apiRequest);

describe("auth.api", () => {

  it("calls login with the correct endpoint and payload", async () => {

    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        user: {
          id: "user-1",
          tenantId: "tenant-1",
          email: "user@example.com",
          roles: ["ADMIN"],
        },
        accessToken: "access-token",
      },
    });

    await login({
      tenantId: "tenant-1",
      email: "user@example.com",
      password: "password",
    });

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({
          tenantId: "tenant-1",
          email: "user@example.com",
          password: "password",
        }),
      },
    );

  });


  it("calls refresh without exposing or supplying the refresh token", async () => {

    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        accessToken: "new-access-token",
      },
    });

    await refresh();

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/auth/refresh",
      {
        method: "POST",
      },
    );

  });


  it("calls logout without supplying the refresh token or bearer token", async () => {

    apiRequestMock.mockResolvedValue({
      success: true,
      message: "Logged out successfully",
    });

    await logout();

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/auth/logout",
      {
        method: "POST",
      },
    );

  });


  it("calls me without explicitly supplying the access token", async () => {

    apiRequestMock.mockResolvedValue({
      userId: "user-1",
      tenantId: "tenant-1",
    });

    await me();

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/auth/me",
      {
        method: "GET",
      },
    );

  });



  it("registers an Athlete without client-owned tenant or access fields", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        user: {
          id: "user-1",
          tenantId: "tenant-1",
          email: "athlete@example.com",
          roles: [],
          permissions: [],
        },
        accessToken: "access-token",
        registration: {
          userId: "user-1",
          athleteId: "athlete-1",
          digitalTwinId: "twin-1",
          tenantId: "tenant-1",
          email: "athlete@example.com",
        },
      },
    });

    const request = {
      firstName: "Titan",
      lastName: "Athlete",
      email: "athlete@example.com",
      password: "Password123!",
      countryCode: "ZA",
      dateOfBirth: "1995-01-01",
    };

    await registerAthlete(request);

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/auth/register/athlete",
      {
        method: "POST",
        body: JSON.stringify(request),
      },
    );
  });
});
