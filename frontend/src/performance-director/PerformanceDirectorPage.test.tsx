import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PerformanceDirectorPage from "./PerformanceDirectorPage";
import * as api from "./performance-director.api";

describe("Performance Director command centre", () => {
  afterEach(() => vi.restoreAllMocks());

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
});
