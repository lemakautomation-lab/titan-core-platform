import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ClubPage from "./ClubPage";
import * as api from "./club.api";

describe("Mission 070.1 club executive structure", () => {
  afterEach(() => vi.restoreAllMocks());

  it("shows an authorised page and retrieves only its next page", async () => {
    const fetchPage = vi.spyOn(api, "getClubExecutives")
      .mockResolvedValueOnce({
        organisationId: "club-1", organisationName: "Club", activeChildOrganisationCount: 2,
        executives: [{ id: "one", name: "First Executive" }], nextCursor: "one",
      }).mockResolvedValueOnce({
        organisationId: "club-1", organisationName: "Club", activeChildOrganisationCount: 2,
        executives: [{ id: "two", name: "Second Executive" }], nextCursor: null,
      });
    render(<ClubPage />);
    expect(await screen.findByText("First Executive")).toBeTruthy();
    expect(screen.getByText("Active direct units: 2")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Load more executives" }));
    await waitFor(() => expect(screen.getByText("Second Executive")).toBeTruthy());
    expect(fetchPage).toHaveBeenCalledWith("one");
  });

  it("fails safely when the club cannot be loaded", async () => {
    vi.spyOn(api, "getClubExecutives").mockRejectedValue(new Error("Unavailable"));
    render(<ClubPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Club structure is unavailable.");
    expect(screen.queryByText("First Executive")).toBeNull();
  });
});
