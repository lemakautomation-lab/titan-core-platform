import {
  fireEvent,
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

import TrainerProfessionalProfile from "./TrainerProfessionalProfile";
import * as profileApi from "./trainer-profile.api";

describe("TrainerProfessionalProfile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads an existing professional profile", async () => {
    vi.spyOn(
      profileApi,
      "getMyTrainerProfile",
    ).mockResolvedValue({
      id: "profile-1",
      professionalTitle: "Performance Coach",
      bio: "Coach bio",
      qualifications: "Qualification",
      specialisations: "Strength",
      yearsExperience: 8,
      countryCode: "ZA",
      websiteUrl: "https://example.com",
      createdAt: "2026-09-18T00:00:00.000Z",
      updatedAt: "2026-09-18T00:00:00.000Z",
    });

    render(<TrainerProfessionalProfile />);

    expect(
      screen.getByText(
        "Loading your professional profile...",
      ),
    ).toBeTruthy();

    expect(
      await screen.findByDisplayValue(
        "Performance Coach",
      ),
    ).toBeTruthy();

    expect(
      screen.getByDisplayValue("8"),
    ).toBeTruthy();

    expect(
      screen.getByDisplayValue("ZA"),
    ).toBeTruthy();
  });

  it("supports a new Trainer with no existing profile", async () => {
    vi.spyOn(
      profileApi,
      "getMyTrainerProfile",
    ).mockResolvedValue(null);

    render(<TrainerProfessionalProfile />);

    expect(
      await screen.findByRole(
        "button",
        {
          name: "Save professional profile",
        },
      ),
    ).toBeTruthy();
  });

  it("saves professional profile fields", async () => {
    vi.spyOn(
      profileApi,
      "getMyTrainerProfile",
    ).mockResolvedValue(null);

    const update =
      vi.spyOn(
        profileApi,
        "updateMyTrainerProfile",
      )
        .mockResolvedValue({
          id: "profile-1",
          professionalTitle: "Performance Coach",
          bio: null,
          qualifications: null,
          specialisations: null,
          yearsExperience: 8,
          countryCode: "ZA",
          websiteUrl: null,
          createdAt:
            "2026-09-18T00:00:00.000Z",
          updatedAt:
            "2026-09-18T00:00:00.000Z",
        });

    render(<TrainerProfessionalProfile />);

    const title =
      await screen.findByLabelText(
        "Professional title",
      );

    fireEvent.change(title, {
      target: {
        value: "Performance Coach",
      },
    });

    fireEvent.change(
      screen.getByLabelText(
        "Years of experience",
      ),
      {
        target: {
          value: "8",
        },
      },
    );

    fireEvent.change(
      screen.getByLabelText(
        "Country code",
      ),
      {
        target: {
          value: "za",
        },
      },
    );

    fireEvent.click(
      screen.getByRole(
        "button",
        {
          name: "Save professional profile",
        },
      ),
    );

    await waitFor(() => {
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          professionalTitle:
            "Performance Coach",
          yearsExperience: 8,
          countryCode: "ZA",
        }),
      );
    });

    expect(
      await screen.findByText(
        "Professional profile saved.",
      ),
    ).toBeTruthy();
  });

  it("rejects invalid years of experience before API submission", async () => {
    vi.spyOn(
      profileApi,
      "getMyTrainerProfile",
    ).mockResolvedValue(null);

    const update =
      vi.spyOn(
        profileApi,
        "updateMyTrainerProfile",
      );

    render(<TrainerProfessionalProfile />);

    const years =
      await screen.findByLabelText(
        "Years of experience",
      );

    fireEvent.change(years, {
      target: {
        value: "101",
      },
    });

    const saveButton =
      screen.getByRole(
        "button",
        {
          name: "Save professional profile",
        },
      );

    const form =
      saveButton.closest("form");

    expect(form).not.toBeNull();

    if (!form) {
      throw new Error(
        "Professional profile form not found.",
      );
    }

    fireEvent.submit(form);

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent(
      "Years of experience must be a whole number between 0 and 100.",
    );

    expect(update).not.toHaveBeenCalled();
  });

  it("fails safely when the profile cannot be loaded", async () => {
    vi.spyOn(
      profileApi,
      "getMyTrainerProfile",
    ).mockRejectedValue(
      new Error("Unavailable"),
    );

    render(<TrainerProfessionalProfile />);

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent(
      "Your professional profile is temporarily unavailable.",
    );
  });
});
