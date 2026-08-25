import {
  getAccessToken,
  setAccessToken,
  clearAuthSession,
} from "../auth/auth.storage";


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;


if (!API_BASE_URL) {
  throw new Error(
    "VITE_API_BASE_URL is not configured",
  );
}


let refreshPromise:
  Promise<string | null> | null = null;


async function refreshAccessToken(): Promise<string | null> {

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise =
    (async (): Promise<string | null> => {

      try {

        const response =
          await fetch(
            `${API_BASE_URL}/auth/refresh`,
            {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type":
                  "application/json",
              },
            },
          );

        if (!response.ok) {
          clearAuthSession();
          return null;
        }

        const body =
          await response.json() as {
            success: boolean;
            data?: {
              accessToken?: string;
            };
          };

        const accessToken =
          body.data?.accessToken;

        if (
          !body.success ||
          !accessToken
        ) {
          clearAuthSession();
          return null;
        }

        setAccessToken(
          accessToken,
        );

        return accessToken;

      } catch {

        clearAuthSession();
        return null;

      } finally {

        refreshPromise = null;

      }

    })();

  return refreshPromise;
}


export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {

  const accessToken =
    getAccessToken();


  const headers = new Headers(
    options.headers,
  );


  if (!headers.has("Content-Type")) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }


  if (
    accessToken &&
    !headers.has("Authorization")
  ) {

    headers.set(
      "Authorization",
      `Bearer ${accessToken}`,
    );

  }


  const response =
    await fetch(
      `${API_BASE_URL}${path}`,
      {
        ...options,
        credentials: "include",
        headers,
      },
    );


  if (
    response.status === 401 &&
    !path.startsWith("/auth/")
  ) {

    const refreshedToken =
      await refreshAccessToken();

    if (refreshedToken) {

      const retryHeaders =
        new Headers(
          options.headers,
        );

      if (!retryHeaders.has("Content-Type")) {
        retryHeaders.set(
          "Content-Type",
          "application/json",
        );
      }

      retryHeaders.set(
        "Authorization",
        `Bearer ${refreshedToken}`,
      );

      const retryResponse =
        await fetch(
          `${API_BASE_URL}${path}`,
          {
            ...options,
            credentials: "include",
            headers: retryHeaders,
          },
        );

      if (!retryResponse.ok) {
        throw new Error(
          `API request failed with status ${retryResponse.status}`,
        );
      }

      if (retryResponse.status === 204) {
        return undefined as T;
      }

      return (
        await retryResponse.json()
      ) as T;

    }

  }


  if (!response.ok) {
    throw new Error(
      `API request failed with status ${response.status}`,
    );
  }


  if (response.status === 204) {
    return undefined as T;
  }


  return (
    await response.json()
  ) as T;

}
