import { beforeEach, describe, expect, it } from "vitest";

import {
  getAccessToken,
  setAccessToken,
  getAuthUser,
  setAuthUser,
  clearAuthSession,
} from "./auth.storage";

describe("auth.storage", () => {

  beforeEach(() => {
    clearAuthSession();
    sessionStorage.clear();
    localStorage.clear();
  });

  it("stores and retrieves the access token in memory", () => {

    setAccessToken("access-token");

    expect(
      getAccessToken(),
    ).toBe("access-token");

  });

  it("does not persist the access token in browser storage", () => {

    setAccessToken("access-token");

    expect(
      sessionStorage.getItem("titan.accessToken"),
    ).toBeNull();

    expect(
      localStorage.getItem("titan.accessToken"),
    ).toBeNull();

  });

  it("stores and retrieves the authenticated user in memory", () => {

    const user = {
      id: "user-1",
      tenantId: "tenant-1",
      email: "user@example.com",
      roles: ["ADMIN"],
    };

    setAuthUser(user);

    expect(
      getAuthUser(),
    ).toEqual(user);

  });

  it("does not persist the authenticated user in browser storage", () => {

    const user = {
      id: "user-1",
      tenantId: "tenant-1",
      email: "user@example.com",
      roles: ["ADMIN"],
    };

    setAuthUser(user);

    expect(
      sessionStorage.getItem("titan.authUser"),
    ).toBeNull();

    expect(
      localStorage.getItem("titan.authUser"),
    ).toBeNull();

  });

  it("returns null when no authenticated user exists", () => {

    expect(
      getAuthUser(),
    ).toBeNull();

  });

  it("clears the complete in-memory authentication session", () => {

    setAccessToken("access-token");

    setAuthUser({
      id: "user-1",
      tenantId: "tenant-1",
      email: "user@example.com",
      roles: ["ADMIN"],
    });

    clearAuthSession();

    expect(
      getAccessToken(),
    ).toBeNull();

    expect(
      getAuthUser(),
    ).toBeNull();

  });

  it("does not expose a refresh-token storage API", () => {

    expect(
      "refreshToken" in sessionStorage,
    ).toBe(false);

    expect(
      "refreshToken" in localStorage,
    ).toBe(false);

  });

});
