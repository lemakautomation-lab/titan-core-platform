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

const baseUser = {
  id: "user-1",
  tenantId: "tenant-1",
  email: "admin@titan.test",
  roles: ["ADMIN"],
  permissions: [] as string[],
};

function createUser(
  permissions: string[] = [],
) {
  return {
    ...baseUser,
    permissions,
  };
}

function renderRouter(
  initialEntry: string,
  authenticated = true,
  permissions: string[] = [],
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
            ? createUser(permissions)
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
    renderRouter(
      "/users",
      true,
      ["users.read"],
    );

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

  it("redirects the authenticated root to dashboard", () => {
    renderRouter(
      "/",
      true,
      ["users.read"],
    );

    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Dashboard",
      }),
    ).toBeInTheDocument();
  });

  it("renders the canonical dashboard route", () => {
    renderRouter(
      "/dashboard",
      true,
      [],
    );

    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Dashboard",
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
    renderRouter(
      "/login",
      true,
      ["users.read"],
    );

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
      true,
      ["users.read"],
    );

    expect(
      screen.getByRole("heading", {
        name: "Page not found",
      }),
    ).toBeInTheDocument();
  });

  it("renders the sports route with sports.read", () => {
    renderRouter(
      "/sports",
      true,
      ["sports.read"],
    );

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Performance",
      }),
    ).toBeInTheDocument();
  });

  it("renders the performance metrics route with performance-metrics.read", () => {
    renderRouter(
      "/performance-metrics",
      true,
      ["performance-metrics.read"],
    );

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Performance",
      }),
    ).toBeInTheDocument();
  });

  it("renders the exercises route with exercises.read", () => {
    renderRouter(
      "/exercises",
      true,
      ["exercises.read"],
    );

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Training",
      }),
    ).toBeInTheDocument();
  });

  it("renders the athlete digital twin route with athlete_digital_twins.read", () => {
    renderRouter(
      "/athlete-digital-twin/athlete-1",
      true,
      ["athlete_digital_twins.read"],
    );

    expect(
      screen.getByRole("heading", {
        level: 2,
      }),
    ).toBeInTheDocument();
  });

  it("denies direct users route access without users.read", () => {
    renderRouter(
      "/users",
      true,
      [],
    );

    expect(
      screen.getByRole("heading", {
        name: "Access denied",
      }),
    ).toBeInTheDocument();
  });

  it("denies direct sports route access without sports.read", () => {
    renderRouter(
      "/sports",
      true,
      [],
    );

    expect(
      screen.getByRole("heading", {
        name: "Access denied",
      }),
    ).toBeInTheDocument();
  });

  it("denies direct performance metrics access without performance-metrics.read", () => {
    renderRouter(
      "/performance-metrics",
      true,
      [],
    );

    expect(
      screen.getByRole("heading", {
        name: "Access denied",
      }),
    ).toBeInTheDocument();
  });

  it("denies direct exercises route access without exercises.read", () => {
    renderRouter(
      "/exercises",
      true,
      [],
    );

    expect(
      screen.getByRole("heading", {
        name: "Access denied",
      }),
    ).toBeInTheDocument();
  });

  it("denies direct athlete digital twin access without athlete_digital_twins.read", () => {
    renderRouter(
      "/athlete-digital-twin/athlete-1",
      true,
      [],
    );

    expect(
      screen.getByRole("heading", {
        name: "Access denied",
      }),
    ).toBeInTheDocument();
  });
});
