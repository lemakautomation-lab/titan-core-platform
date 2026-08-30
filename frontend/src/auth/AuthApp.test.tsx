import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import AuthApp from "./AuthApp";

const baseUser = {
  id: "user-1",
  tenantId: "tenant-1",
  email: "admin@titan.test",
  roles: ["ADMIN"],
};

function createUser(
  permissions: string[] = [],
) {
  return {
    ...baseUser,
    permissions,
  };
}

function LocationProbe() {
  const location = useLocation();

  return (
    <div data-testid="location">
      {location.pathname}
    </div>
  );
}

function renderAuthApp(
  permissions: string[] = [],
) {
  return render(
    <MemoryRouter initialEntries={["/users"]}>
      <Routes>
        <Route
          element={
            <AuthApp
              user={createUser(permissions)}
              onLogout={vi.fn()}
              loggingOut={false}
            />
          }
        >
          <Route
            path="*"
            element={<LocationProbe />}
          />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("AuthApp canonical navigation authorization", () => {
  it("renders Users navigation when users.read is granted", () => {
    renderAuthApp(["users.read"]);

    expect(
      screen.getByRole("button", {
        name: "Users",
      }),
    ).toBeInTheDocument();
  });

  it("renders Training navigation when exercises.read is granted", () => {
    renderAuthApp(["exercises.read"]);

    expect(
      screen.getByRole("button", {
        name: "Training",
      }),
    ).toBeInTheDocument();
  });

  it("renders Performance navigation when sports.read is granted", () => {
    renderAuthApp(["sports.read"]);

    expect(
      screen.getByRole("button", {
        name: "Performance",
      }),
    ).toBeInTheDocument();
  });

  it("renders Performance navigation when performance-metrics.read is granted", () => {
    renderAuthApp(["performance-metrics.read"]);

    expect(
      screen.getByRole("button", {
        name: "Performance",
      }),
    ).toBeInTheDocument();
  });
  it("does not render Users navigation without users.read", () => {
    renderAuthApp(["exercises.read"]);

    expect(
      screen.queryByRole("button", {
        name: "Users",
      }),
    ).not.toBeInTheDocument();
  });

  it("does not render Training navigation without exercises.read", () => {
    renderAuthApp(["users.read"]);

    expect(
      screen.queryByRole("button", {
        name: "Training",
      }),
    ).not.toBeInTheDocument();
  });

  it("does not render Performance navigation without sports.read", () => {
    renderAuthApp(["users.read"]);

    expect(
      screen.queryByRole("button", {
        name: "Performance",
      }),
    ).not.toBeInTheDocument();
  });

  it("renders no permission-controlled navigation for a user with no permissions", () => {
    renderAuthApp([]);

    expect(
      screen.getByRole("button", {
        name: "Dashboard",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Training",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Performance",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Users",
      }),
    ).not.toBeInTheDocument();
  });

  it("normalizes navigation permissions before authorization", () => {
    renderAuthApp([
      "  USERS.READ  ",
      "EXERCISES.READ",
      " Sports.Read ",
    ]);

    expect(
      screen.getByRole("button", {
        name: "Users",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Training",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Performance",
      }),
    ).toBeInTheDocument();
  });

  it("navigates to the canonical Training route", () => {
    renderAuthApp(["exercises.read"]);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Training",
      }),
    );

    expect(
      screen.getByTestId("location"),
    ).toHaveTextContent("/exercises");
  });

  it("navigates to the canonical Performance route", () => {
    renderAuthApp(["sports.read"]);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Performance",
      }),
    );

    expect(
      screen.getByTestId("location"),
    ).toHaveTextContent("/sports");
  });

  it("navigates performance-metrics users to the performance metrics route", () => {
    renderAuthApp(["performance-metrics.read"]);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Performance",
      }),
    );

    expect(
      screen.getByTestId("location"),
    ).toHaveTextContent("/performance-metrics");
  });

  it("navigates to the canonical Dashboard route", () => {
    renderAuthApp(["users.read"]);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Dashboard",
      }),
    );

    expect(
      screen.getByTestId("location"),
    ).toHaveTextContent("/dashboard");
  });
});
