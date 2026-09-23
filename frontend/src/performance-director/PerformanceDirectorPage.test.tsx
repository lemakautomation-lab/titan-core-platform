import { render, screen } from "@testing-library/react";
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
});
