import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  login as loginApi,
  logout as logoutApi,
  me as meApi,
  refresh as refreshApi,
} from "./auth.api";

import {
  clearAuthSession,
  getAccessToken,
  getAuthUser,
} from "./auth.storage";

import {
  login,
  logout,
  getCurrentUser,
  isAuthenticated,
  clearSession,
  refresh,
} from "./auth.service";

vi.mock("./auth.api", () => ({
  login: vi.fn(),
  refresh: vi.fn(),
  logout: vi.fn(),
  me: vi.fn(),
}));

describe("auth.service", () => {

  beforeEach(() => {

    clearAuthSession();

    vi.clearAllMocks();

  });


  it("logs in and stores the authenticated session", async () => {

    vi.mocked(loginApi).mockResolvedValue({
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

    const user =
      await login({
        tenantId: "tenant-1",
        email: "user@example.com",
        password: "password",
      });

    expect(user.id).toBe("user-1");

    expect(
      getAccessToken(),
    ).toBe("access-token");

    expect(
      getAuthUser(),
    ).toEqual(user);

    expect(
      isAuthenticated(),
    ).toBe(true);

  });


  it("refreshes using the HttpOnly refresh-token cookie", async () => {

    vi.mocked(refreshApi).mockResolvedValue({
      success: true,
      data: {
        accessToken: "new-access-token",
      },
    });

    const accessToken =
      await refresh();

    expect(
      refreshApi,
    ).toHaveBeenCalledTimes(1);

    expect(
      accessToken,
    ).toBe("new-access-token");

    expect(
      getAccessToken(),
    ).toBe("new-access-token");

  });


  it("logs out and always clears the local session", async () => {

    vi.mocked(logoutApi).mockResolvedValue({
      success: true,
      message: "Logged out successfully",
    });

    vi.mocked(loginApi).mockResolvedValue({
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

    await logout("session-1");

    expect(
      logoutApi,
    ).toHaveBeenCalledWith(
      "session-1",
      "access-token",
    );

    expect(
      isAuthenticated(),
    ).toBe(false);

  });


  it("returns the cached user after validating the token with /me", async () => {

    const user = {
      id: "user-1",
      tenantId: "tenant-1",
      email: "user@example.com",
      roles: ["ADMIN"],
    };

    vi.mocked(loginApi).mockResolvedValue({
      success: true,
      data: {
        user,
        accessToken: "access-token",
      },
    });

    await login({
      tenantId: "tenant-1",
      email: user.email,
      password: "password",
    });

    vi.mocked(meApi).mockResolvedValue({
      userId: user.id,
      tenantId: user.tenantId,
    });

    const currentUser =
      await getCurrentUser();

    expect(
      meApi,
    ).toHaveBeenCalledWith(
      "access-token",
    );

    expect(
      currentUser,
    ).toEqual(user);

  });


  it("clears the session when /me rejects the access token", async () => {

    vi.mocked(loginApi).mockResolvedValue({
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

    vi.mocked(meApi).mockRejectedValue(
      new Error("Unauthorized"),
    );

    const currentUser =
      await getCurrentUser();

    expect(
      currentUser,
    ).toBeNull();

    expect(
      isAuthenticated(),
    ).toBe(false);

  });


  it("clears the session when refresh fails", async () => {

    vi.mocked(loginApi).mockResolvedValue({
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

    vi.mocked(refreshApi).mockRejectedValue(
      new Error("Invalid refresh token"),
    );

    await expect(
      refresh(),
    ).rejects.toThrow(
      "Invalid refresh token",
    );

  });


  it("can explicitly clear the session", async () => {

    vi.mocked(loginApi).mockResolvedValue({
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

    clearSession();

    expect(
      isAuthenticated(),
    ).toBe(false);

    expect(
      getAuthUser(),
    ).toBeNull();

  });

});
