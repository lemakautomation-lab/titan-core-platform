import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import App from "./App";

import {
  clearAuthSession,
  setAuthUser,
} from "./auth/auth.storage";

import {
  getCurrentUser,
  login,
} from "./auth/auth.service";

vi.mock("./auth/auth.service", () => ({
  login: vi.fn(),
  getCurrentUser: vi.fn(),
}));

const mockedLogin =
  vi.mocked(login);

const mockedGetCurrentUser =
  vi.mocked(getCurrentUser);

const testUser = {
  id: "user-1",
  tenantId: "tenant-1",
  email: "admin@titan.test",
  roles: ["ADMIN"],
};


describe("App", () => {

  beforeEach(() => {

    clearAuthSession();

    mockedLogin.mockReset();

    mockedGetCurrentUser.mockReset();

  });


  it("renders the login screen when no authenticated session exists", () => {

    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: "TITAN Core Platform",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Sign in",
      }),
    ).toBeInTheDocument();

    expect(
      mockedGetCurrentUser,
    ).not.toHaveBeenCalled();

  });


  it("validates a cached session with the backend before rendering the authenticated shell", async () => {

    setAuthUser(testUser);

    mockedGetCurrentUser.mockResolvedValue(
      testUser,
    );

    render(<App />);

    expect(
      screen.getByText(
        "Checking session...",
      ),
    ).toBeInTheDocument();

    expect(
      screen.queryByText(
        testUser.email,
      ),
    ).not.toBeInTheDocument();

    await waitFor(() => {

      expect(
        mockedGetCurrentUser,
      ).toHaveBeenCalledTimes(1);

    });

    expect(
      await screen.findByText(
        testUser.email,
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        `Tenant: ${testUser.tenantId}`,
      ),
    ).toBeInTheDocument();

  });


  it("rejects an invalid cached session and returns to login", async () => {

    setAuthUser(testUser);

    mockedGetCurrentUser.mockResolvedValue(
      null,
    );

    render(<App />);

    await waitFor(() => {

      expect(
        screen.getByRole("heading", {
          name: "Sign in",
        }),
      ).toBeInTheDocument();

    });

    expect(
      screen.queryByText(
        testUser.email,
      ),
    ).not.toBeInTheDocument();

  });


  it("rejects a session when backend validation fails", async () => {

    setAuthUser(testUser);

    mockedGetCurrentUser.mockRejectedValue(
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

    expect(
      screen.queryByText(
        testUser.email,
      ),
    ).not.toBeInTheDocument();

  });


  it("authenticates through the auth service and renders the authenticated shell", async () => {

    mockedLogin.mockResolvedValue(
      testUser,
    );

    render(<App />);

    fireEvent.change(
      screen.getByLabelText(
        "Tenant ID",
      ),
      {
        target: {
          value:
            testUser.tenantId,
        },
      },
    );

    fireEvent.change(
      screen.getByLabelText(
        "Email",
      ),
      {
        target: {
          value:
            testUser.email,
        },
      },
    );

    fireEvent.change(
      screen.getByLabelText(
        "Password",
      ),
      {
        target: {
          value:
            "ValidPassword123!",
        },
      },
    );

    fireEvent.click(
      screen.getByRole(
        "button",
        {
          name: "Sign in",
        },
      ),
    );

    expect(
      await screen.findByText(
        testUser.email,
      ),
    ).toBeInTheDocument();

    expect(
      mockedLogin,
    ).toHaveBeenCalledWith({
      tenantId:
        testUser.tenantId,
      email:
        testUser.email,
      password:
        "ValidPassword123!",
    });

  });


  it("displays a generic error when login fails", async () => {

    mockedLogin.mockRejectedValue(
      new Error("Unauthorized"),
    );

    render(<App />);

    fireEvent.change(
      screen.getByLabelText(
        "Tenant ID",
      ),
      {
        target: {
          value: "tenant-1",
        },
      },
    );

    fireEvent.change(
      screen.getByLabelText(
        "Email",
      ),
      {
        target: {
          value:
            "admin@titan.test",
        },
      },
    );

    fireEvent.change(
      screen.getByLabelText(
        "Password",
      ),
      {
        target: {
          value:
            "WrongPassword",
        },
      },
    );

    fireEvent.click(
      screen.getByRole(
        "button",
        {
          name: "Sign in",
        },
      ),
    );

    expect(
      await screen.findByRole(
        "alert",
      ),
    ).toHaveTextContent(
      "Unable to sign in. Please check your credentials and try again.",
    );

  });

});
