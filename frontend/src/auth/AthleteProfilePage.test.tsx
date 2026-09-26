import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AthleteProfilePage from "./AthleteProfilePage";
import { getMyPersonalDetails, updateMyPersonalDetails } from "./athlete-profile.api";

vi.mock("./athlete-profile.api", () => ({
  getMyPersonalDetails: vi.fn(), updateMyPersonalDetails: vi.fn(),
}));

const details = {
  userId: "user-1", athleteId: "athlete-1", tenantId: "tenant-1",
  firstName: "Synthetic", lastName: "Athlete", email: "athlete@example.com",
  contactNumber: null, countryCode: "ZA", dateOfBirth: "1995-01-01T00:00:00.000Z",
};

describe("AthleteProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMyPersonalDetails).mockResolvedValue(details);
    vi.mocked(updateMyPersonalDetails).mockResolvedValue(details);
  });

  it("loads and saves the current Athlete's details", async () => {
    render(<AthleteProfilePage />);
    expect(await screen.findByRole("heading", { name: "My Athlete profile" })).toBeInTheDocument();
    expect(await screen.findByDisplayValue("Synthetic")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("First name"), { target: { value: "Updated" } });
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    expect(await screen.findByText("Profile saved.")).toBeInTheDocument();
    expect(updateMyPersonalDetails).toHaveBeenCalledWith(expect.objectContaining({
      firstName: "Updated", email: details.email, dateOfBirth: "1995-01-01",
    }));
  });

  it("does not show an empty editor when loading fails", async () => {
    vi.mocked(getMyPersonalDetails).mockRejectedValue(new Error("Unavailable"));
    render(<AthleteProfilePage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to load your profile.");
    expect(screen.queryByRole("button", { name: "Save profile" })).not.toBeInTheDocument();
  });
});
