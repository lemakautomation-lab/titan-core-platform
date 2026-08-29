import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import App from "./App";

import {
  clearAuthSession,
  setAccessToken,
  setAuthUser,
} from "./auth/auth.storage";

vi.mock("./auth/auth.service", () => ({
  login: vi.fn(),
  getCurrentUser: vi.fn(),
  restoreSession: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("./auth/AuthApp", () => ({
  default: ({
    user,
    onLogout,
    loggingOut,
  }: {
    user: {
      email: string;
      tenantId: string;
    };
    onLogout: () => Promise<void>;
    loggingOut: boolean;
  }) => (
    <section>
      <h1>Authenticated</h1>

      <span>{user.email}</span>

      <span>Tenant</span>

      <strong>{user.tenantId}</strong>

      <button
        type="button"
        onClick={() => {
          void onLogout();
        }}
        disabled={loggingOut}
      >
        {loggingOut
          ? "Signing out..."
          : "Sign out"}
      </button>
    </section>
  ),
}));

import {
  getCurrentUser,
  login,
  restoreSession,
  logout,
} from "./auth/auth.service";

const getCurrentUserMock =
  vi.mocked(getCurrentUser);

const loginMock =
  vi.mocked(login);

const restoreSessionMock =
  vi.mocked(restoreSession);

const logoutMock =
  vi.mocked(logout);

describe("App", () => {

  beforeEach(() => {

    clearAuthSession();

    sessionStorage.clear();
    localStorage.clear();

    vi.clearAllMocks();

    getCurrentUserMock.mockResolvedValue(null);
    restoreSessionMock.mockResolvedValue(null);
    logoutMock.mockResolvedValue(undefined);
  });

  it("renders the login screen when no authenticated session exists", async () => {

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          name: "Sign in",
        }),
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByText("Authenticated"),
    ).not.toBeInTheDocument();

  });

  it("renders the authenticated application after /me validates the session", async () => {

    const user = {
      id: "user-1",
      tenantId: "tenant-1",
      email: "user@example.com",
      roles: ["ADMIN"],
      permissions: [],
    };

    setAccessToken("access-token");
    setAuthUser(user);

    getCurrentUserMock.mockResolvedValue(user);

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByText("Authenticated"),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText("user@example.com"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Tenant"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("tenant-1"),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("heading", {
        name: "Sign in",
      }),
    ).not.toBeInTheDocument();

  });

  it("restores the authenticated application through the refresh cookie", async () => {

    const user = {
      id: "user-1",
      tenantId: "tenant-1",
      email: "user@example.com",
      roles: ["ADMIN"],
      permissions: [],
    };

    restoreSessionMock.mockResolvedValue(user);

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByText("Authenticated"),
      ).toBeInTheDocument();
    });

    expect(
      restoreSessionMock,
    ).toHaveBeenCalledTimes(1);

    expect(
      screen.getByText("user@example.com"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("tenant-1"),
    ).toBeInTheDocument();

  });

  it("does not render protected application content when session restoration fails", async () => {

    restoreSessionMock.mockResolvedValue(null);

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          name: "Sign in",
        }),
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByText("Authenticated"),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText("tenant-1"),
    ).not.toBeInTheDocument();

  });

  it("does not render protected application content while authentication is being checked", () => {

    restoreSessionMock.mockReturnValue(
      new Promise(() => {}),
    );

    render(<App />);

    expect(
      screen.getByText("Checking session..."),
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Authenticated"),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("heading", {
        name: "Sign in",
      }),
    ).not.toBeInTheDocument();

  });

  it("authenticates through the auth service and renders the authenticated shell", async () => {

    const user = {
      id: "user-1",
      tenantId: "tenant-1",
      email: "admin@titan.test",
      roles: ["ADMIN"],
      permissions: [],
    };

    loginMock.mockResolvedValue(user);

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          name: "Sign in",
        }),
      ).toBeInTheDocument();
    });

    fireEvent.change(
      screen.getByLabelText("Tenant ID"),
      {
        target: {
          value: user.tenantId,
        },
      },
    );

    fireEvent.change(
      screen.getByLabelText("Email"),
      {
        target: {
          value: user.email,
        },
      },
    );

    fireEvent.change(
      screen.getByLabelText("Password"),
      {
        target: {
          value: "ValidPassword123!",
        },
      },
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Sign in",
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("Authenticated"),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(user.email),
    ).toBeInTheDocument();

    expect(
      loginMock,
    ).toHaveBeenCalledWith({
      tenantId: user.tenantId,
      email: user.email,
      password: "ValidPassword123!",
    });

  });

  it("displays a generic error when login fails", async () => {

    loginMock.mockRejectedValue(
      new Error("Unauthorized"),
    );

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          name: "Sign in",
        }),
      ).toBeInTheDocument();
    });

    fireEvent.change(
      screen.getByLabelText("Tenant ID"),
      {
        target: {
          value: "tenant-1",
        },
      },
    );

    fireEvent.change(
      screen.getByLabelText("Email"),
      {
        target: {
          value: "admin@titan.test",
        },
      },
    );

    fireEvent.change(
      screen.getByLabelText("Password"),
      {
        target: {
          value: "WrongPassword",
        },
      },
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Sign in",
      }),
    );

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent(
      "Unable to sign in. Please check your credentials and try again.",
    );

  });

  it("logs out and returns to the login screen", async () => {

    const user = {
      id: "user-1",
      tenantId: "tenant-1",
      email: "user@example.com",
      roles: ["ADMIN"],
      permissions: [],
    };

    setAccessToken("access-token");
    setAuthUser(user);

    getCurrentUserMock.mockResolvedValue(user);

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByText("Authenticated"),
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Sign out",
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          name: "Sign in",
        }),
      ).toBeInTheDocument();
    });

    expect(
      logoutMock,
    ).toHaveBeenCalledTimes(1);

    expect(
      screen.queryByText("Authenticated"),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText("user@example.com"),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText("tenant-1"),
    ).not.toBeInTheDocument();

  });

});
