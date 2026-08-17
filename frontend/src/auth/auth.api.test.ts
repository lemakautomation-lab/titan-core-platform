import { describe, expect, it, vi } from "vitest";

import {
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


  it("calls logout with bearer authentication", async () => {

    apiRequestMock.mockResolvedValue({
      success: true,
      message: "Logged out successfully",
    });

    await logout(
      "session-1",
      "access-token",
    );

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/auth/logout",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer access-token",
        },
        body: JSON.stringify({
          sessionId: "session-1",
        }),
      },
    );

  });


  it("calls me with bearer authentication", async () => {

    apiRequestMock.mockResolvedValue({
      userId: "user-1",
      tenantId: "tenant-1",
    });

    await me("access-token");

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/auth/me",
      {
        method: "GET",
        headers: {
          Authorization: "Bearer access-token",
        },
      },
    );

  });

});
