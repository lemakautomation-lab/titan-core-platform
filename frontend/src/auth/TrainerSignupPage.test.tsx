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

import TrainerSignupPage from "./TrainerSignupPage";
import { registerTrainer } from "./auth.service";

vi.mock("./auth.service", () => ({
  registerTrainer: vi.fn(),
}));

describe("TrainerSignupPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates and authenticates a Trainer without requesting protected fields", async () => {
    const user = {
      id: "trainer-user-1",
      tenantId: "tenant-1",
      email: "trainer@example.com",
      roles: [],
      permissions: [],
    };

    vi.mocked(registerTrainer)
      .mockResolvedValue(user);

    const onAuthenticated = vi.fn();

    render(
      <MemoryRouter>
        <TrainerSignupPage
          onAuthenticated={onAuthenticated}
        />
      </MemoryRouter>,
    );

    expect(
      screen.queryByLabelText("Tenant ID"),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByLabelText("Country code"),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByLabelText("Date of birth"),
    ).not.toBeInTheDocument();

    const values: Array<[string, string]> = [
      ["First name", "Titan"],
      ["Last name", "Trainer"],
      ["Email", "trainer@example.com"],
      ["Password", "Password123!"],
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
        name: "Create Trainer account",
      }),
    );

    await waitFor(() => {
      expect(registerTrainer)
        .toHaveBeenCalledWith({
          firstName: "Titan",
          lastName: "Trainer",
          email: "trainer@example.com",
          password: "Password123!",
        });

      expect(onAuthenticated)
        .toHaveBeenCalledWith(user);
    });
  });

  it("fails safely when registration is rejected", async () => {
    vi.mocked(registerTrainer)
      .mockRejectedValue(
        new Error("Registration rejected"),
      );

    render(
      <MemoryRouter>
        <TrainerSignupPage
          onAuthenticated={vi.fn()}
        />
      </MemoryRouter>,
    );

    const values: Array<[string, string]> = [
      ["First name", "Titan"],
      ["Last name", "Trainer"],
      ["Email", "trainer@example.com"],
      ["Password", "Password123!"],
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
        name: "Create Trainer account",
      }),
    );

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent(
      "Unable to create your Trainer account",
    );
  });

  it("provides a route back to sign in", () => {
    render(
      <MemoryRouter>
        <TrainerSignupPage
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