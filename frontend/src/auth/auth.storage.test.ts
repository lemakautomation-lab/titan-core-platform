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
    sessionStorage.clear();
  });


  it("stores and retrieves the access token", () => {

    setAccessToken("access-token");

    expect(
      getAccessToken(),
    ).toBe("access-token");

  });


  it("stores and retrieves the authenticated user", () => {

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


  it("returns null when no authenticated user exists", () => {

    expect(
      getAuthUser(),
    ).toBeNull();

  });


  it("clears the complete access-token session", () => {

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

  });

});
