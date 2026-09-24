import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PerformanceDirectorPage from "./PerformanceDirectorPage";
import * as api from "./performance-director.api";

describe("Performance Director command centre", () => {
  afterEach(() => vi.restoreAllMocks());

  it("loads the aggregate report only with the reporting permission", async () => {
    vi.spyOn(api, "getDepartmentCommandCentre").mockResolvedValue({
      organisationId: "department-1", organisationName: "Department", staffCount: 2, athleteCount: 3,
    });
    const load = vi.spyOn(api, "getDepartmentRoleReport").mockResolvedValue({
      organisationId: "department-1", organisationName: "Department", days: 30,
      staffCount: 2, activeAthleteCount: 3, measuredAthleteCount: 1,
      effectiveMeasurementCount: 2, latestMeasurementAt: null,
    });
    const view = render(<PerformanceDirectorPage />);
    expect(await screen.findByRole("heading", { name: "Department" })).toBeTruthy();
    expect(load).not.toHaveBeenCalled();
    view.rerender(<PerformanceDirectorPage canReadReport />);
    expect(await screen.findByRole("region", { name: "Director role report" })).toHaveTextContent("Effective measurements: 2");
    fireEvent.change(screen.getByLabelText("Report window"), { target: { value: "7" } });
    await waitFor(() => expect(load).toHaveBeenCalledWith(7));
  });

  it("hides report values if report retrieval fails", async () => {
    vi.spyOn(api, "getDepartmentCommandCentre").mockResolvedValue({
      organisationId: "department-1", organisationName: "Department", staffCount: 2, athleteCount: 3,
    });
    vi.spyOn(api, "getDepartmentRoleReport").mockRejectedValue(new Error("Unavailable"));
    render(<PerformanceDirectorPage canReadReport />);
    expect(await screen.findByText("Department report is unavailable.")).toBeTruthy();
    expect(screen.queryByText("Effective measurements: 2")).toBeNull();
  });

  it("shows only the department summary returned by the API", async () => {
    vi.spyOn(api, "getDepartmentCommandCentre").mockResolvedValue({
      organisationId: "department-1",
      organisationName: "Performance Department",
      staffCount: 2,
      athleteCount: 5,
    });
    render(<PerformanceDirectorPage />);
    expect(await screen.findByRole("heading", { name: "Performance Department" })).toBeTruthy();
    expect(screen.getByText("Staff: 2")).toBeTruthy();
    expect(screen.getByText("Athletes: 5")).toBeTruthy();
  });

  it("handles a failed department lookup without exposing data", async () => {
    vi.spyOn(api, "getDepartmentCommandCentre").mockRejectedValue(new Error("Unavailable"));
    render(<PerformanceDirectorPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Department data is unavailable.");
  });

  it("loads bounded measurement activity only with the intelligence permission", async () => {
    vi.spyOn(api, "getDepartmentCommandCentre").mockResolvedValue({
      organisationId: "department-1", organisationName: "Department",
      staffCount: 1, athleteCount: 2,
    });
    const load = vi.spyOn(api, "getDepartmentPerformanceIntelligence")
      .mockImplementation(async (days) => ({
        organisationId: "department-1", days,
        activeAthleteCount: 2, measuredAthleteCount: 1,
        effectiveMeasurementCount: 3, latestMeasurementAt: null,
      }));

    const view = render(<PerformanceDirectorPage />);
    expect(await screen.findByRole("heading", { name: "Department" })).toBeTruthy();
    expect(load).not.toHaveBeenCalled();

    view.rerender(<PerformanceDirectorPage canReadIntelligence />);
    expect(await screen.findByText("Effective measurements: 3")).toBeTruthy();
    expect(load).toHaveBeenCalledWith(30);
    fireEvent.change(screen.getByLabelText("Reporting window"), { target: { value: "7" } });
    await waitFor(() => expect(load).toHaveBeenCalledWith(7));
  });

  it("handles intelligence lookup failure without displaying observations", async () => {
    vi.spyOn(api, "getDepartmentCommandCentre").mockResolvedValue({
      organisationId: "department-1", organisationName: "Department",
      staffCount: 1, athleteCount: 2,
    });
    vi.spyOn(api, "getDepartmentPerformanceIntelligence")
      .mockRejectedValue(new Error("Unavailable"));
    render(<PerformanceDirectorPage canReadIntelligence />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Measurement activity is unavailable.");
    expect(screen.queryByText(/Effective measurements:/)).toBeNull();
  });

  it("pages across authorised teams only when the teams grant is present", async () => {
    vi.spyOn(api, "getDepartmentCommandCentre").mockResolvedValue({
      organisationId: "department-1", organisationName: "Department",
      staffCount: 2, athleteCount: 3,
    });
    const loadTeams = vi.spyOn(api, "getDepartmentTeams")
      .mockImplementation(async (cursor) => cursor ? {
        organisationId: "department-1",
        teams: [{ id: "team-2", name: "Team B" }], nextCursor: null,
      } : {
        organisationId: "department-1",
        teams: [{ id: "team-1", name: "Team A" }], nextCursor: "team-1",
      });

    const view = render(<PerformanceDirectorPage />);
    expect(await screen.findByRole("heading", { name: "Department" })).toBeTruthy();
    expect(loadTeams).not.toHaveBeenCalled();
    view.rerender(<PerformanceDirectorPage canReadTeams />);
    expect(await screen.findByText("Team A")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Load more teams" }));
    expect(await screen.findByText("Team B")).toBeTruthy();
    expect(loadTeams).toHaveBeenCalledWith("team-1");
  });

  it("shows a safe failure when team retrieval is unavailable", async () => {
    vi.spyOn(api, "getDepartmentCommandCentre").mockResolvedValue({
      organisationId: "department-1", organisationName: "Department",
      staffCount: 1, athleteCount: 0,
    });
    vi.spyOn(api, "getDepartmentTeams").mockRejectedValue(new Error("Unavailable"));
    render(<PerformanceDirectorPage canReadTeams />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Department teams are unavailable.");
    expect(screen.queryByText("Team A")).toBeNull();
  });
});
