import {
  render,
  screen,
} from "@testing-library/react";

import {
  MemoryRouter,
} from "react-router-dom";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import AppRouter from "./AppRouter";

const user = {
  id: "user-1",
  tenantId: "tenant-1",
  email: "admin@titan.test",
  roles: ["ADMIN"],
  permissions: [
    "users.read",
  ],
};

function renderRouter(
  initialEntry: string,
  authenticated = true,
) {
  return render(
    <MemoryRouter
      initialEntries={[
        initialEntry,
      ]}
    >
      <AppRouter
        authState={
          authenticated
            ? "authenticated"
            : "unauthenticated"
        }
        user={
          authenticated
            ? user
            : null
        }
        onAuthenticated={vi.fn()}
        onLogout={async () => undefined}
        loggingOut={false}
      />
    </MemoryRouter>,
  );
}

describe("AppRouter", () => {
  it("renders the authenticated users route", () => {
    renderRouter("/users");

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Users",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("tenant-1"),
    ).toBeInTheDocument();
  });

  it("redirects the authenticated root to users", () => {
    renderRouter("/");

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Users",
      }),
    ).toBeInTheDocument();
  });

  it("redirects unauthenticated users to login", () => {
    renderRouter(
      "/users",
      false,
    );

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Sign in",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Tenant ID"),
    ).toBeInTheDocument();
  });

  it("redirects authenticated users away from login", () => {
    renderRouter("/login");

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Users",
      }),
    ).toBeInTheDocument();
  });

  it("renders a not-found page", () => {
    renderRouter(
      "/does-not-exist",
    );

    expect(
      screen.getByRole("heading", {
        name: "Page not found",
      }),
    ).toBeInTheDocument();
  });
});
