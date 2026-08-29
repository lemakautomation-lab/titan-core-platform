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

import SportsPage from "./SportsPage";

vi.mock("./sports.api", () => ({
  listSports: vi.fn(),
}));

import { listSports } from "./sports.api";

const listSportsMock = vi.mocked(listSports);

const tenantId = "tenant-1";

const sports = [
  {
    id: "sport-1",
    tenantId,
    name: "Football",
    slug: "football",
    status: "ACTIVE",
    createdAt: "2026-08-25T00:00:00.000Z",
    updatedAt: "2026-08-25T00:00:00.000Z",
  },
  {
    id: "sport-2",
    tenantId,
    name: "Athletics",
    slug: "athletics",
    status: "ACTIVE",
    createdAt: "2026-08-25T00:00:00.000Z",
    updatedAt: "2026-08-25T00:00:00.000Z",
  },
];

describe("SportsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state", () => {
    listSportsMock.mockReturnValue(
      new Promise(() => {}),
    );

    render(<SportsPage tenantId={tenantId} />);

    expect(
      screen.getByText("Loading sports..."),
    ).toBeInTheDocument();
  });

  it("loads and renders sports", async () => {
    listSportsMock.mockResolvedValue(sports);

    render(<SportsPage tenantId={tenantId} />);

    await waitFor(() => {
      expect(
        screen.getByText("Football"),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText("Athletics"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("2 sports"),
    ).toBeInTheDocument();
  });

  it("passes tenant id to API", async () => {
    listSportsMock.mockResolvedValue([]);

    render(<SportsPage tenantId={tenantId} />);

    await waitFor(() => {
      expect(listSportsMock).toHaveBeenCalledTimes(1);
    });

    expect(listSportsMock).toHaveBeenCalledWith(tenantId);
  });

  it("renders empty state", async () => {
    listSportsMock.mockResolvedValue([]);

    render(<SportsPage tenantId={tenantId} />);

    expect(
      await screen.findByText(
        "No sports found for this tenant.",
      ),
    ).toBeInTheDocument();
  });

  it("renders generic error", async () => {
    listSportsMock.mockRejectedValue(
      new Error("Unauthorized"),
    );

    render(<SportsPage tenantId={tenantId} />);

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent(
      "Unable to load sports. Please try again.",
    );
  });
});
