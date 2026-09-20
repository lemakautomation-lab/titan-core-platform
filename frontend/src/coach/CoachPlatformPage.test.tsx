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

import CoachPlatformPage from "./CoachPlatformPage";
import * as api from "./coach.api";

function mockBase() {
  vi.spyOn(api, "getCoachSquads")
    .mockResolvedValue([]);
  vi.spyOn(api, "getCoachTeams")
    .mockResolvedValue([]);
  vi.spyOn(api, "getCoachAthletes")
    .mockResolvedValue([]);
}

describe("CoachPlatformPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads Coach operations", async () => {
    mockBase();

    render(<CoachPlatformPage />);

    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: "Coach operations",
      }),
    ).toBeTruthy();

    expect(screen.getByText("No squads yet."))
      .toBeTruthy();
    expect(screen.getByText("No teams yet."))
      .toBeTruthy();
    expect(
      screen.getByText("No active Coach Athletes yet."),
    ).toBeTruthy();
  });

  it("adds an Athlete", async () => {
    mockBase();

    const add = vi.spyOn(api, "addCoachAthlete")
      .mockResolvedValue({
        relationshipId: "relationship-1",
      });

    render(<CoachPlatformPage />);

    await screen.findByText("No active Coach Athletes yet.");

    fireEvent.change(
      screen.getByLabelText("Athlete ID"),
      { target: { value: "athlete-1" } },
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Add Athlete",
      }),
    );

    await waitFor(() => {
      expect(add).toHaveBeenCalledWith("athlete-1");
    });
  });

  it("loads authorised performance monitoring", async () => {
    vi.spyOn(api, "getCoachSquads")
      .mockResolvedValue([]);
    vi.spyOn(api, "getCoachTeams")
      .mockResolvedValue([]);
    vi.spyOn(api, "getCoachAthletes")
      .mockResolvedValue([{
        athleteId: "athlete-1",
        firstName: "Alice",
        lastName: "Athlete",
        countryCode: "ZA",
        status: "ACTIVE",
        relationshipId: "relationship-1",
        relationshipStatus: "ACTIVE",
        startsAt: null,
        endsAt: null,
      }]);

    vi.spyOn(api, "getCoachAthleteMonitoring")
      .mockResolvedValue({
        athleteId: "athlete-1",
        performance: [],
        recovery: [],
        trainingStress: [],
        workoutProgrammes: [],
      });

    render(<CoachPlatformPage />);

    await screen.findByText("Alice Athlete");

    fireEvent.click(
      screen.getByRole("button", {
        name: "View performance",
      }),
    );

    expect(
      await screen.findByRole("region", {
        name: "Performance monitoring",
      }),
    ).toBeTruthy();
  });

  it("fails safely when Coach operations cannot load", async () => {
    vi.spyOn(api, "getCoachSquads")
      .mockRejectedValue(new Error("Unavailable"));
    vi.spyOn(api, "getCoachTeams")
      .mockResolvedValue([]);
    vi.spyOn(api, "getCoachAthletes")
      .mockResolvedValue([]);

    render(<CoachPlatformPage />);

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent(
      "Coach operations are temporarily unavailable.",
    );
  });
});
