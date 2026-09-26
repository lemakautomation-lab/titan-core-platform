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
  it.each(["/", "/dashboard", "/club"])(
    "keeps an onboarding-only Athlete on onboarding when visiting %s",
    (path) => {
      render(
        <MemoryRouter initialEntries={[path]}>
          <AppRouter
            authState="authenticated"
            user={{
              id: "athlete-1",
              tenantId: "tenant-1",
              email: "athlete@example.com",
              roles: [],
              permissions: [],
            }}
            onAuthenticated={vi.fn()}
            onLogout={async () => undefined}
            loggingOut={false}
          />
        </MemoryRouter>,
      );

      expect(
        screen.getByRole("heading", { name: "Athlete Onboarding" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: "Dashboard" }),
      ).not.toBeInTheDocument();
    },
  );

  it("requires the club executive permission for direct club access", () => {
    renderRouter("/club", true, []);
    expect(screen.getByRole("heading", { name: "Access denied" })).toBeInTheDocument();
  });

  it.each([
    "club.directors.read", "club.coaches.read", "club.scientists.read",
    "club.conditioning.read", "club.nutrition.read", "club.rehabilitation.read",
    "club.teams.read", "club.athletes.read",
  ])("does not open the club page with only %s", (permission) => {
    renderRouter("/club", true, [permission]);
    expect(screen.getByRole("heading", { name: "Access denied" })).toBeInTheDocument();
  });

  it("renders the club executive page with the dedicated permission", () => {
    renderRouter("/club", true, ["club.executives.read"]);
    expect(screen.getByRole("heading", { name: "Club executive structure" })).toBeInTheDocument();
  });
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


  it("renders the Performance Professional route with both required permissions", () => {
    renderRouter(
      "/performance-professional",
      true,
      [
        "performance-measurements.read",
        "workout-programmes.read",
      ],
    );

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Sports Scientist Workflow",
      }),
    ).toBeInTheDocument();
  });

  it("denies Performance Professional access without performance-measurements.read", () => {
    renderRouter(
      "/performance-professional",
      true,
      ["workout-programmes.read"],
    );

    expect(
      screen.getByRole("heading", {
        name: "Access denied",
      }),
    ).toBeInTheDocument();
  });

  it("denies Performance Professional access without workout-programmes.read", () => {
    renderRouter(
      "/performance-professional",
      true,
      ["performance-measurements.read"],
    );

    expect(
      screen.getByRole("heading", {
        name: "Access denied",
      }),
    ).toBeInTheDocument();
  });

  it("renders public Athlete signup without a tenant field", () => {
    renderRouter(
      "/signup/athlete",
      false,
    );

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Create your Athlete account",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByLabelText("Tenant ID"),
    ).not.toBeInTheDocument();
  });

  it("renders public Trainer signup without protected fields", () => {
    renderRouter(
      "/signup/trainer",
      false,
    );

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Create your Trainer account",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByLabelText("Tenant ID"),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByLabelText("Country code"),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByLabelText("Date of birth"),
    ).not.toBeInTheDocument();
  });

  it("links the sign-in page to Athlete signup", () => {
    renderRouter(
      "/login",
      false,
    );

    expect(
      screen.getByRole("link", {
        name: "Create an account",
      }),
    ).toHaveAttribute(
      "href",
      "/signup/athlete",
    );
  });

  it("redirects an authenticated onboarding-only Athlete away from signup", () => {
    render(
      <MemoryRouter
        initialEntries={[
          "/signup/athlete",
        ]}
      >
        <AppRouter
          authState="authenticated"
          user={{
            id: "athlete-user-1",
            tenantId: "tenant-1",
            email: "athlete@example.com",
            roles: [],
            permissions: [],
          }}
          onAuthenticated={vi.fn()}
          onLogout={async () => undefined}
          loggingOut={false}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Athlete Onboarding",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Your Athlete account is ready",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /Paid performance features remain locked/,
      ),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Dashboard",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Onboarding",
      }),
    ).toBeInTheDocument();
  });

  it("redirects onboarding-only Athletes from login to onboarding", () => {
    render(
      <MemoryRouter
        initialEntries={[
          "/login",
        ]}
      >
        <AppRouter
          authState="authenticated"
          user={{
            id: "athlete-user-1",
            tenantId: "tenant-1",
            email: "athlete@example.com",
            roles: [],
            permissions: [],
          }}
          onAuthenticated={vi.fn()}
          onLogout={async () => undefined}
          loggingOut={false}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Athlete Onboarding",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("heading", {
        level: 2,
        name: "Sign in",
      }),
    ).not.toBeInTheDocument();
  });
});
