import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import AthleteSignupPage from "./AthleteSignupPage";
import { registerAthlete } from "./auth.service";

vi.mock("./auth.service", () => ({
  registerAthlete: vi.fn(),
}));

describe("AthleteSignupPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates and authenticates an Athlete without requesting a tenant ID", async () => {
    const user = {
      id: "user-1",
      tenantId: "tenant-1",
      email: "athlete@example.com",
      roles: [],
      permissions: [],
    };

    vi.mocked(registerAthlete)
      .mockResolvedValue(user);

    const onAuthenticated = vi.fn();

    render(
      <MemoryRouter>
        <AthleteSignupPage
          onAuthenticated={onAuthenticated}
        />
      </MemoryRouter>,
    );

    expect(
      screen.queryByLabelText("Tenant ID"),
    ).not.toBeInTheDocument();

    fireEvent.change(
      screen.getByLabelText("First name"),
      {
        target: {
          value: "Titan",
        },
      },
    );

    fireEvent.change(
      screen.getByLabelText("Last name"),
      {
        target: {
          value: "Athlete",
        },
      },
    );

    fireEvent.change(
      screen.getByLabelText("Email"),
      {
        target: {
          value: "athlete@example.com",
        },
      },
    );

    fireEvent.change(
      screen.getByLabelText("Password"),
      {
        target: {
          value: "Password123!",
        },
      },
    );

    fireEvent.change(
      screen.getByLabelText("Country code"),
      {
        target: {
          value: "za",
        },
      },
    );

    fireEvent.change(
      screen.getByLabelText("Date of birth"),
      {
        target: {
          value: "1995-01-01",
        },
      },
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Create Athlete account",
      }),
    );

    await waitFor(() => {
      expect(registerAthlete)
        .toHaveBeenCalledWith({
          firstName: "Titan",
          lastName: "Athlete",
          email: "athlete@example.com",
          password: "Password123!",
          countryCode: "ZA",
          dateOfBirth: "1995-01-01",
        });

      expect(onAuthenticated)
        .toHaveBeenCalledWith(user);
    });
  });

  it("fails safely when registration is rejected", async () => {
    vi.mocked(registerAthlete)
      .mockRejectedValue(
        new Error("Registration rejected"),
      );

    render(
      <MemoryRouter>
        <AthleteSignupPage
          onAuthenticated={vi.fn()}
        />
      </MemoryRouter>,
    );

    const values: Array<[string, string]> = [
      ["First name", "Titan"],
      ["Last name", "Athlete"],
      ["Email", "athlete@example.com"],
      ["Password", "Password123!"],
      ["Country code", "ZA"],
      ["Date of birth", "1995-01-01"],
    ];

    for (const [label, value] of values) {
      fireEvent.change(
        screen.getByLabelText(label),
        {
          target: {
            value,
          },
        },
      );
    }

    fireEvent.click(
      screen.getByRole("button", {
        name: "Create Athlete account",
      }),
    );

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent(
      "Unable to create your account",
    );
  });

  it("provides a route back to sign in", () => {
    render(
      <MemoryRouter>
        <AthleteSignupPage
          onAuthenticated={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("link", {
        name: "Sign in",
      }),
    ).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
