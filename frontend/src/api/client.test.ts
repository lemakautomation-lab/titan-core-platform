import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { apiRequest } from "./client";

import {
  clearAuthSession,
  getAccessToken,
  setAccessToken,
} from "../auth/auth.storage";

describe("apiRequest", () => {

  beforeEach(() => {

    clearAuthSession();

    vi.restoreAllMocks();

  });


  it("sends requests to the configured API base URL", async () => {

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    const result =
      await apiRequest<{ status: string }>(
        "/health",
      );

    expect(result).toEqual({
      status: "ok",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/v1/health",
      expect.objectContaining({
        credentials: "include",
      }),
    );

    const requestOptions =
      fetchMock.mock.calls[0][1];

    const headers =
      requestOptions?.headers;

    expect(headers).toBeDefined();

    expect(
      headers instanceof Headers
        ? headers.get("Content-Type")
        : (headers as Record<string, string>)["Content-Type"],
    ).toBe("application/json");

    vi.unstubAllGlobals();

  });


  it("attaches the in-memory access token to authenticated API requests", async () => {

    setAccessToken("access-token");

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    await apiRequest("/users");

    const requestOptions =
      fetchMock.mock.calls[0][1];

    const headers =
      requestOptions?.headers as Headers;

    expect(
      headers.get("Authorization"),
    ).toBe(
      "Bearer access-token",
    );

    expect(
      sessionStorage.getItem(
        "titan.accessToken",
      ),
    ).toBeNull();

    expect(
      localStorage.getItem(
        "titan.accessToken",
      ),
    ).toBeNull();

    vi.unstubAllGlobals();

  });


  it("refreshes the access token after a 401 and retries the request", async () => {

    setAccessToken("expired-access-token");

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: false,
          }),
          {
            status: 401,
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              accessToken:
                "refreshed-access-token",
            },
          }),
          {
            status: 200,
            headers: {
              "Content-Type":
                "application/json",
            },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: "ok",
          }),
          {
            status: 200,
            headers: {
              "Content-Type":
                "application/json",
            },
          },
        ),
      );

    vi.stubGlobal("fetch", fetchMock);

    const result =
      await apiRequest<{ status: string }>(
        "/users",
      );

    expect(result).toEqual({
      status: "ok",
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);

    const refreshOptions =
      fetchMock.mock.calls[1][1];

    expect(
      refreshOptions?.credentials,
    ).toBe("include");

    const refreshHeaders =
      refreshOptions?.headers as Record<string, string>;

    expect(
      refreshHeaders.Authorization,
    ).toBeUndefined();

    const retryHeaders =
      fetchMock.mock.calls[2][1]?.headers as Headers;

    expect(
      retryHeaders.get("Authorization"),
    ).toBe(
      "Bearer refreshed-access-token",
    );

    expect(
      getAccessToken(),
    ).toBe(
      "refreshed-access-token",
    );

    vi.unstubAllGlobals();

  });


  it("refreshes and retries a 401 request that contains custom headers", async () => {

    setAccessToken("expired-access-token");

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: false,
          }),
          {
            status: 401,
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              accessToken:
                "custom-header-refresh-token",
            },
          }),
          {
            status: 200,
            headers: {
              "Content-Type":
                "application/json",
            },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: "ok",
          }),
          {
            status: 200,
            headers: {
              "Content-Type":
                "application/json",
            },
          },
        ),
      );

    vi.stubGlobal("fetch", fetchMock);

    const result =
      await apiRequest<{ status: string }>(
        "/users",
        {
          headers: {
            "X-Request-ID": "request-123",
          },
        },
      );

    expect(result).toEqual({
      status: "ok",
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);

    const originalHeaders =
      fetchMock.mock.calls[0][1]?.headers as Headers;

    expect(
      originalHeaders.get("X-Request-ID"),
    ).toBe(
      "request-123",
    );

    const refreshOptions =
      fetchMock.mock.calls[1][1];

    expect(
      refreshOptions?.credentials,
    ).toBe("include");

    const refreshHeaders =
      refreshOptions?.headers as Record<string, string>;

    expect(
      refreshHeaders.Authorization,
    ).toBeUndefined();

    const retryHeaders =
      fetchMock.mock.calls[2][1]?.headers as Headers;

    expect(
      retryHeaders.get("X-Request-ID"),
    ).toBe(
      "request-123",
    );

    expect(
      retryHeaders.get("Authorization"),
    ).toBe(
      "Bearer custom-header-refresh-token",
    );

    expect(
      getAccessToken(),
    ).toBe(
      "custom-header-refresh-token",
    );

    vi.unstubAllGlobals();

  });


  it("clears the local session when automatic refresh fails", async () => {

    setAccessToken("expired-access-token");

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: false,
          }),
          {
            status: 401,
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: false,
          }),
          {
            status: 401,
          },
        ),
      );

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      apiRequest("/users"),
    ).rejects.toThrow(
      "API request failed with status 401",
    );

    expect(
      getAccessToken(),
    ).toBeNull();

    expect(
      sessionStorage.getItem(
        "titan.accessToken",
      ),
    ).toBeNull();

    expect(
      localStorage.getItem(
        "titan.accessToken",
      ),
    ).toBeNull();

    expect(
      fetchMock,
    ).toHaveBeenCalledTimes(2);

    vi.unstubAllGlobals();

  });


  it("does not automatically refresh authentication endpoints", async () => {

    setAccessToken("expired-access-token");

    const fetchMock =
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: false,
          }),
          {
            status: 401,
          },
        ),
      );

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      apiRequest("/auth/me"),
    ).rejects.toThrow(
      "API request failed with status 401",
    );

    expect(
      fetchMock,
    ).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();

  });


  it("shares one refresh request across concurrent 401 responses", async () => {

    setAccessToken("expired-access-token");

    let resolveRefresh:
      ((response: Response) => void) | null =
      null;

    const refreshResponse =
      new Promise<Response>(
        (resolve) => {
          resolveRefresh = resolve;
        },
      );

    const fetchMock =
      vi.fn().mockImplementation(
        (url: string) => {

          if (
            url.endsWith(
              "/auth/refresh",
            )
          ) {

            return refreshResponse;
          }

          return Promise.resolve(
            new Response(
              JSON.stringify({
                success: false,
              }),
              {
                status: 401,
              },
            ),
          );

        },
      );

    vi.stubGlobal("fetch", fetchMock);

    const firstRequest =
      apiRequest("/users");

    const secondRequest =
      apiRequest("/roles");

    await new Promise(
      (resolve) => setTimeout(resolve, 0),
    );

    expect(
      fetchMock.mock.calls.filter(
        ([url]) =>
          url.endsWith(
            "/auth/refresh",
          ),
      ),
    ).toHaveLength(1);

    const refreshCall =
      fetchMock.mock.calls.find(
        ([url]) =>
          url.endsWith(
            "/auth/refresh",
          ),
      );

    expect(refreshCall).toBeDefined();

    const refreshOptions =
      refreshCall?.[1];

    expect(
      refreshOptions?.credentials,
    ).toBe("include");

    const refreshHeaders =
      refreshOptions?.headers as Record<string, string>;

    expect(
      refreshHeaders.Authorization,
    ).toBeUndefined();

    resolveRefresh!(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            accessToken:
              "shared-refresh-token",
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type":
              "application/json",
          },
        },
      ),
    );

    await expect(
      firstRequest,
    ).rejects.toThrow();

    await expect(
      secondRequest,
    ).rejects.toThrow();

    expect(
      fetchMock.mock.calls.filter(
        ([url]) =>
          url.endsWith(
            "/auth/refresh",
          ),
      ),
    ).toHaveLength(1);

    expect(
      getAccessToken(),
    ).toBe(
      "shared-refresh-token",
    );

    vi.unstubAllGlobals();

  });

});
