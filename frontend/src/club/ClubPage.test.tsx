import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ClubPage from "./ClubPage";
import * as api from "./club.api";

describe("Mission 070 club structure", () => {
  afterEach(() => vi.restoreAllMocks());

  it("loads rehabilitation staff only with the independent permission", async () => {
    vi.spyOn(api, "getClubExecutives").mockResolvedValue({
      organisationId: "club-1", organisationName: "Club", activeChildOrganisationCount: 0,
      executives: [], nextCursor: null,
    });
    const rehabilitation = vi.spyOn(api, "getClubRehabilitation")
      .mockResolvedValueOnce({ organisationId: "club-1", rehabilitation: [{ id: "one", name: "First Rehabilitation Professional" }], nextCursor: "one" })
      .mockResolvedValueOnce({ organisationId: "club-1", rehabilitation: [{ id: "two", name: "Second Rehabilitation Professional" }], nextCursor: null });
    const view = render(<ClubPage />);
    expect(await screen.findByText("No active executives assigned to this club.")).toBeTruthy();
    expect(rehabilitation).not.toHaveBeenCalled();
    view.rerender(<ClubPage canReadRehabilitation />);
    expect(await screen.findByText("First Rehabilitation Professional")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Load more rehabilitation staff" }));
    await waitFor(() => expect(screen.getByText("Second Rehabilitation Professional")).toBeTruthy());
    expect(rehabilitation).toHaveBeenCalledWith("one");
  });

  it("hides rehabilitation staff returned from another club", async () => {
    vi.spyOn(api, "getClubExecutives").mockResolvedValue({
      organisationId: "club-1", organisationName: "Club", activeChildOrganisationCount: 0,
      executives: [], nextCursor: null,
    });
    vi.spyOn(api, "getClubRehabilitation").mockResolvedValue({
      organisationId: "other", rehabilitation: [{ id: "one", name: "Foreign Rehabilitation Professional" }], nextCursor: null,
    });
    render(<ClubPage canReadRehabilitation />);
    expect(await screen.findByText("Club rehabilitation staff are unavailable.")).toBeTruthy();
    expect(screen.queryByText("Foreign Rehabilitation Professional")).toBeNull();
  });

  it("loads nutrition staff only with the independent permission", async () => {
    vi.spyOn(api, "getClubExecutives").mockResolvedValue({
      organisationId: "club-1", organisationName: "Club", activeChildOrganisationCount: 0,
      executives: [], nextCursor: null,
    });
    const nutrition = vi.spyOn(api, "getClubNutrition")
      .mockResolvedValueOnce({ organisationId: "club-1", nutrition: [{ id: "one", name: "First Nutrition Professional" }], nextCursor: "one" })
      .mockResolvedValueOnce({ organisationId: "club-1", nutrition: [{ id: "two", name: "Second Nutrition Professional" }], nextCursor: null });
    const view = render(<ClubPage />);
    expect(await screen.findByText("No active executives assigned to this club.")).toBeTruthy();
    expect(nutrition).not.toHaveBeenCalled();
    view.rerender(<ClubPage canReadNutrition />);
    expect(await screen.findByText("First Nutrition Professional")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Load more nutrition staff" }));
    await waitFor(() => expect(screen.getByText("Second Nutrition Professional")).toBeTruthy());
    expect(nutrition).toHaveBeenCalledWith("one");
  });

  it("hides nutrition staff returned from another club", async () => {
    vi.spyOn(api, "getClubExecutives").mockResolvedValue({
      organisationId: "club-1", organisationName: "Club", activeChildOrganisationCount: 0,
      executives: [], nextCursor: null,
    });
    vi.spyOn(api, "getClubNutrition").mockResolvedValue({
      organisationId: "other", nutrition: [{ id: "one", name: "Foreign Nutrition Professional" }], nextCursor: null,
    });
    render(<ClubPage canReadNutrition />);
    expect(await screen.findByText("Club nutrition staff are unavailable.")).toBeTruthy();
    expect(screen.queryByText("Foreign Nutrition Professional")).toBeNull();
  });

  it("loads conditioning staff only with the independent permission", async () => {
    vi.spyOn(api, "getClubExecutives").mockResolvedValue({
      organisationId: "club-1", organisationName: "Club", activeChildOrganisationCount: 0,
      executives: [], nextCursor: null,
    });
    const conditioning = vi.spyOn(api, "getClubConditioning")
      .mockResolvedValueOnce({ organisationId: "club-1", conditioning: [{ id: "one", name: "First Professional" }], nextCursor: "one" })
      .mockResolvedValueOnce({ organisationId: "club-1", conditioning: [{ id: "two", name: "Second Professional" }], nextCursor: null });
    const view = render(<ClubPage />);
    expect(await screen.findByText("No active executives assigned to this club.")).toBeTruthy();
    expect(conditioning).not.toHaveBeenCalled();
    view.rerender(<ClubPage canReadConditioning />);
    expect(await screen.findByText("First Professional")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Load more conditioning staff" }));
    await waitFor(() => expect(screen.getByText("Second Professional")).toBeTruthy());
    expect(conditioning).toHaveBeenCalledWith("one");
  });

  it("hides conditioning staff returned from another club", async () => {
    vi.spyOn(api, "getClubExecutives").mockResolvedValue({
      organisationId: "club-1", organisationName: "Club", activeChildOrganisationCount: 0,
      executives: [], nextCursor: null,
    });
    vi.spyOn(api, "getClubConditioning").mockResolvedValue({
      organisationId: "other", conditioning: [{ id: "one", name: "Foreign Professional" }], nextCursor: null,
    });
    render(<ClubPage canReadConditioning />);
    expect(await screen.findByText("Club conditioning staff are unavailable.")).toBeTruthy();
    expect(screen.queryByText("Foreign Professional")).toBeNull();
  });

  it("pages scientists only when the scientist permission is present", async () => {
    vi.spyOn(api, "getClubExecutives").mockResolvedValue({
      organisationId: "club-1", organisationName: "Club", activeChildOrganisationCount: 0,
      executives: [], nextCursor: null,
    });
    const scientists = vi.spyOn(api, "getClubScientists")
      .mockResolvedValueOnce({ organisationId: "club-1", scientists: [{ id: "one", name: "First Scientist" }], nextCursor: "one" })
      .mockResolvedValueOnce({ organisationId: "club-1", scientists: [{ id: "two", name: "Second Scientist" }], nextCursor: null });
    const view = render(<ClubPage />);
    expect(await screen.findByText("No active executives assigned to this club.")).toBeTruthy();
    expect(scientists).not.toHaveBeenCalled();
    view.rerender(<ClubPage canReadScientists />);
    expect(await screen.findByText("First Scientist")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Load more scientists" }));
    await waitFor(() => expect(screen.getByText("Second Scientist")).toBeTruthy());
    expect(scientists).toHaveBeenCalledWith("one");
  });

  it("hides scientists returned from another club", async () => {
    vi.spyOn(api, "getClubExecutives").mockResolvedValue({
      organisationId: "club-1", organisationName: "Club", activeChildOrganisationCount: 0,
      executives: [], nextCursor: null,
    });
    vi.spyOn(api, "getClubScientists").mockResolvedValue({
      organisationId: "other", scientists: [{ id: "one", name: "Foreign Scientist" }], nextCursor: null,
    });
    render(<ClubPage canReadScientists />);
    expect(await screen.findByText("Club scientists are unavailable.")).toBeTruthy();
    expect(screen.queryByText("Foreign Scientist")).toBeNull();
  });

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
