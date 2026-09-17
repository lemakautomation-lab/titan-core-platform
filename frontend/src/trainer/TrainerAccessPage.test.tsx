import {
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import TrainerAccessPage from "./TrainerAccessPage";
import * as trainerAccessApi from "./trainer-access.api";

describe("TrainerAccessPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows active Trainer access when entitlement is valid", async () => {
    vi.spyOn(
      trainerAccessApi,
      "getMyTrainerAccess",
    ).mockResolvedValue({
      accessGranted: true,
      reason: "GRANTED",
    });

    render(<TrainerAccessPage />);

    expect(
      screen.getByText(
        "Checking Trainer subscription access...",
      ),
    ).toBeTruthy();

    expect(
      await screen.findByText(
        /Your Trainer subscription is active/,
      ),
    ).toBeTruthy();
  });

  it("requires Trainer user type when the account is not a Trainer", async () => {
    vi.spyOn(
      trainerAccessApi,
      "getMyTrainerAccess",
    ).mockResolvedValue({
      accessGranted: false,
      reason: "TRAINER_TYPE_REQUIRED",
    });

    render(<TrainerAccessPage />);

    expect(
      await screen.findByText(
        "Trainer access requires the Trainer user type.",
      ),
    ).toBeTruthy();
  });

  it("requires an active Trainer subscription when entitlement is missing", async () => {
    vi.spyOn(
      trainerAccessApi,
      "getMyTrainerAccess",
    ).mockResolvedValue({
      accessGranted: false,
      reason:
        "ACTIVE_TRAINER_ENTITLEMENT_REQUIRED",
    });

    render(<TrainerAccessPage />);

    expect(
      await screen.findByText(
        /An active Trainer subscription is required/,
      ),
    ).toBeTruthy();
  });

  it("fails safely when Trainer access cannot be determined", async () => {
    vi.spyOn(
      trainerAccessApi,
      "getMyTrainerAccess",
    ).mockRejectedValue(
      new Error("Unavailable"),
    );

    render(<TrainerAccessPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("alert"),
      ).toHaveTextContent(
        "Trainer access is temporarily unavailable.",
      );
    });
  });
});
