import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  MemoryRouter,
} from "react-router-dom";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import AccountAssistancePage from "./AccountAssistancePage";
import {
  requestAccountAssistance,
} from "./auth.api";

vi.mock("./auth.api", () => ({
  requestAccountAssistance:
    vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Account assistance page", () => {
  it(
    "requests no personal or Tenant identity",
    () => {
      render(
        <MemoryRouter>
          <AccountAssistancePage />
        </MemoryRouter>,
      );

      expect(
        screen.queryByRole("textbox"),
      ).not.toBeInTheDocument();

      expect(
        screen.queryByLabelText(/tenant/i),
      ).not.toBeInTheDocument();

      expect(
        screen.queryByLabelText(/password/i),
      ).not.toBeInTheDocument();
    },
  );

  it(
    "creates and displays an opaque reference",
    async () => {
      vi.mocked(
        requestAccountAssistance,
      ).mockResolvedValue({
        data: {
          reference:
            "ABCDEFGHIJKLMNOPQRSTUV",
          expiresAt:
            "2026-09-18T18:00:00.000Z",
          message:
            "Your account-assistance request has been created.",
        },
      });

      render(
        <MemoryRouter>
          <AccountAssistancePage />
        </MemoryRouter>,
      );

      fireEvent.click(
        screen.getByRole("button", {
          name:
            "Create assistance reference",
        }),
      );

      await waitFor(() => {
        expect(
          requestAccountAssistance,
        ).toHaveBeenCalledWith();
      });

      expect(
        await screen.findByText(
          "ABCDEFGHIJKLMNOPQRSTUV",
        ),
      ).toBeInTheDocument();

      expect(
        screen.getByRole("status"),
      ).toHaveTextContent(
        "has been created",
      );
    },
  );

  it(
    "shows a controlled unavailable state",
    async () => {
      vi.mocked(
        requestAccountAssistance,
      ).mockRejectedValue(
        new Error("Unavailable"),
      );

      render(
        <MemoryRouter>
          <AccountAssistancePage />
        </MemoryRouter>,
      );

      fireEvent.click(
        screen.getByRole("button", {
          name:
            "Create assistance reference",
        }),
      );

      expect(
        await screen.findByRole("alert"),
      ).toHaveTextContent(
        "temporarily unavailable",
      );
    },
  );
});
