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

import ForgotPasswordPage from "./ForgotPasswordPage";
import ResetPasswordPage from "./ResetPasswordPage";
import {
  completePasswordReset,
  requestPasswordReset,
} from "./auth.api";

vi.mock("./auth.api", () => ({
  requestPasswordReset: vi.fn(),
  completePasswordReset: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Password recovery pages", () => {
  it(
    "submits recovery without requesting a tenant ID",
    async () => {
      vi.mocked(requestPasswordReset)
        .mockResolvedValue({
          message:
            "If an eligible account exists, password-reset instructions will be sent.",
        });

      render(
        <MemoryRouter>
          <ForgotPasswordPage />
        </MemoryRouter>,
      );

      expect(
        screen.queryByLabelText(/tenant/i),
      ).not.toBeInTheDocument();

      fireEvent.change(
        screen.getByLabelText(
          "Email address",
        ),
        {
          target: {
            value:
              "athlete@example.com",
          },
        },
      );

      fireEvent.click(
        screen.getByRole("button", {
          name:
            "Send reset instructions",
        }),
      );

      await waitFor(() => {
        expect(requestPasswordReset)
          .toHaveBeenCalledWith({
            email:
              "athlete@example.com",
          });
      });

      expect(
        await screen.findByRole("status"),
      ).toHaveTextContent(
        "If an eligible account exists",
      );
    },
  );

  it(
    "disables reset when the URL has no token",
    () => {
      render(
        <MemoryRouter
          initialEntries={[
            "/reset-password",
          ]}
        >
          <ResetPasswordPage />
        </MemoryRouter>,
      );

      expect(
        screen.getByRole("button", {
          name: "Reset password",
        }),
      ).toBeDisabled();

      expect(
        screen.getByRole("alert"),
      ).toHaveTextContent(
        "invalid or expired",
      );
    },
  );

  it(
    "completes reset and returns the User to sign in",
    async () => {
      vi.mocked(completePasswordReset)
        .mockResolvedValue({
          message:
            "Password reset completed.",
        });

      render(
        <MemoryRouter
          initialEntries={[
            "/reset-password?token=secure-token",
          ]}
        >
          <ResetPasswordPage />
        </MemoryRouter>,
      );

      fireEvent.change(
        screen.getByLabelText(
          "New password",
        ),
        {
          target: {
            value:
              "Password123!",
          },
        },
      );

      fireEvent.change(
        screen.getByLabelText(
          "Confirm new password",
        ),
        {
          target: {
            value:
              "Password123!",
          },
        },
      );

      fireEvent.click(
        screen.getByRole("button", {
          name: "Reset password",
        }),
      );

      await waitFor(() => {
        expect(completePasswordReset)
          .toHaveBeenCalledWith({
            token:
              "secure-token",
            newPassword:
              "Password123!",
          });
      });

      expect(
        await screen.findByRole("heading", {
          name:
            "Password reset complete",
        }),
      ).toBeInTheDocument();

      expect(
        screen.getByRole("link", {
          name:
            "Sign in with your new password",
        }),
      ).toHaveAttribute(
        "href",
        "/login",
      );
    },
  );

  it(
    "shows a safe invalid-token failure",
    async () => {
      vi.mocked(completePasswordReset)
        .mockRejectedValue(
          new Error("Request failed"),
        );

      render(
        <MemoryRouter
          initialEntries={[
            "/reset-password?token=invalid-token",
          ]}
        >
          <ResetPasswordPage />
        </MemoryRouter>,
      );

      for (
        const label of [
          "New password",
          "Confirm new password",
        ]
      ) {
        fireEvent.change(
          screen.getByLabelText(label),
          {
            target: {
              value:
                "Password123!",
            },
          },
        );
      }

      fireEvent.click(
        screen.getByRole("button", {
          name: "Reset password",
        }),
      );

      expect(
        await screen.findByRole("alert"),
      ).toHaveTextContent(
        "invalid or expired",
      );
    },
  );
});
