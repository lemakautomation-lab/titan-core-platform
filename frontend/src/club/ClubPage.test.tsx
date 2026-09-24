import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ClubPage from "./ClubPage";
import * as api from "./club.api";

describe("Mission 070 club structure", () => {
  afterEach(() => vi.restoreAllMocks());

  it("pages coaches only when their independent permission is present", async () => {
    vi.spyOn(api, "getClubExecutives").mockResolvedValue({
      organisationId: "club-1", organisationName: "Club", activeChildOrganisationCount: 0,
      executives: [], nextCursor: null,
    });
    const coaches = vi.spyOn(api, "getClubCoaches")
      .mockResolvedValueOnce({ organisationId: "club-1", coaches: [{ id: "one", name: "First Coach" }], nextCursor: "one" })
      .mockResolvedValueOnce({ organisationId: "club-1", coaches: [{ id: "two", name: "Second Coach" }], nextCursor: null });
    const view = render(<ClubPage />);
    expect(await screen.findByText("No active executives assigned to this club.")).toBeTruthy();
    expect(coaches).not.toHaveBeenCalled();
    view.rerender(<ClubPage canReadCoaches />);
    expect(await screen.findByText("First Coach")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Load more coaches" }));
    await waitFor(() => expect(screen.getByText("Second Coach")).toBeTruthy());
    expect(coaches).toHaveBeenCalledWith("one");
  });

  it("hides coaches returned from another club", async () => {
    vi.spyOn(api, "getClubExecutives").mockResolvedValue({
      organisationId: "club-1", organisationName: "Club", activeChildOrganisationCount: 0,
      executives: [], nextCursor: null,
    });
    vi.spyOn(api, "getClubCoaches").mockResolvedValue({
      organisationId: "other", coaches: [{ id: "one", name: "Foreign Coach" }], nextCursor: null,
    });
    render(<ClubPage canReadCoaches />);
    expect(await screen.findByText("Club coaches are unavailable.")).toBeTruthy();
    expect(screen.queryByText("Foreign Coach")).toBeNull();
  });

  it("loads only authorised Performance Directors and their next page", async () => {
    vi.spyOn(api, "getClubExecutives").mockResolvedValue({
      organisationId: "club-1", organisationName: "Club", activeChildOrganisationCount: 0,
      executives: [], nextCursor: null,
    });
    const directors = vi.spyOn(api, "getClubDirectors")
      .mockResolvedValueOnce({ organisationId: "club-1", directors: [{ id: "one", name: "First Director" }], nextCursor: "one" })
      .mockResolvedValueOnce({ organisationId: "club-1", directors: [{ id: "two", name: "Second Director" }], nextCursor: null });
    const view = render(<ClubPage />);
    expect(await screen.findByText("No active executives assigned to this club.")).toBeTruthy();
    expect(directors).not.toHaveBeenCalled();
    view.rerender(<ClubPage canReadDirectors />);
    expect(await screen.findByText("First Director")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Load more directors" }));
    await waitFor(() => expect(screen.getByText("Second Director")).toBeTruthy());
    expect(directors).toHaveBeenCalledWith("one");
  });

  it("hides a director page from a different club", async () => {
    vi.spyOn(api, "getClubExecutives").mockResolvedValue({
      organisationId: "club-1", organisationName: "Club", activeChildOrganisationCount: 0,
      executives: [], nextCursor: null,
    });
    vi.spyOn(api, "getClubDirectors").mockResolvedValue({
      organisationId: "other-club", directors: [{ id: "other", name: "Other Director" }], nextCursor: null,
    });
    render(<ClubPage canReadDirectors />);
    expect(await screen.findByText("Club directors are unavailable.")).toBeTruthy();
    expect(screen.queryByText("Other Director")).toBeNull();
  });

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
