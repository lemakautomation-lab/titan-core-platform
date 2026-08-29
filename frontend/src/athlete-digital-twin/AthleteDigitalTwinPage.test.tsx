import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import AthleteDigitalTwinPage from "./AthleteDigitalTwinPage";

vi.mock("./athlete-digital-twin.api", () => ({
  getAthleteDigitalTwinByAthleteId: vi.fn(),
}));

import {
  getAthleteDigitalTwinByAthleteId,
} from "./athlete-digital-twin.api";

const getTwinMock =
  vi.mocked(getAthleteDigitalTwinByAthleteId);

const twin = {
  id: "twin-1",
  tenantId: "tenant-1",
  athleteId: "athlete-1",
  status: "ACTIVE",
  createdAt: "2026-08-29T00:00:00.000Z",
  updatedAt: "2026-08-29T00:00:00.000Z",
};

describe("AthleteDigitalTwinPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state", () => {
    getTwinMock.mockReturnValue(
      new Promise(() => {}),
    );

    render(
      <AthleteDigitalTwinPage athleteId="athlete-1" />,
    );

    expect(
      screen.getByText("Loading digital twin..."),
    ).toBeInTheDocument();
  });

  it("loads and renders the digital twin", async () => {
    getTwinMock.mockResolvedValue(twin);

    render(
      <AthleteDigitalTwinPage athleteId="athlete-1" />,
    );

    await waitFor(() => {
      expect(
        screen.getByText("twin-1"),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText("athlete-1"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("ACTIVE"),
    ).toBeInTheDocument();
  });

  it("calls the API with the athlete id", async () => {
    getTwinMock.mockResolvedValue(twin);

    render(
      <AthleteDigitalTwinPage athleteId="athlete-1" />,
    );

    await waitFor(() => {
      expect(
        getTwinMock,
      ).toHaveBeenCalledWith("athlete-1");
    });
  });

  it("renders generic error", async () => {
    getTwinMock.mockRejectedValue(
      new Error("Unauthorized"),
    );

    render(
      <AthleteDigitalTwinPage athleteId="athlete-1" />,
    );

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent(
      "Unable to load athlete digital twin. Please try again.",
    );
  });

  it("renders empty state", async () => {
    getTwinMock.mockRejectedValue(
      new Error("Athlete Digital Twin not found."),
    );

    render(
      <AthleteDigitalTwinPage athleteId="athlete-1" />,
    );

    expect(
      await screen.findByRole("alert"),
    ).toBeInTheDocument();
  });
});
