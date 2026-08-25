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

import UsersPage from "./UsersPage";

vi.mock("./users.api", () => ({
  listUsers: vi.fn(),
}));

import { listUsers } from "./users.api";

const listUsersMock =
  vi.mocked(listUsers);

const tenantId = "tenant-1";

const users = [
  {
    id: "user-1",
    tenantId,
    organisationId: "org-1",
    email: "admin@titan.test",
    firstName: "Admin",
    lastName: "User",
    status: "ACTIVE",
    createdAt: "2026-08-25T00:00:00.000Z",
    updatedAt: "2026-08-25T00:00:00.000Z",
  },
  {
    id: "user-2",
    tenantId,
    organisationId: null,
    email: "athlete@titan.test",
    firstName: "Athlete",
    lastName: "User",
    status: "ACTIVE",
    createdAt: "2026-08-25T00:00:00.000Z",
    updatedAt: "2026-08-25T00:00:00.000Z",
  },
];

describe("UsersPage", () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the loading state while users are loading", () => {

    listUsersMock.mockReturnValue(
      new Promise(() => {}),
    );

    render(
      <UsersPage tenantId={tenantId} />,
    );

    expect(
      screen.getByText("Loading users..."),
    ).toBeInTheDocument();

  });

  it("loads and renders tenant users", async () => {

    listUsersMock.mockResolvedValue(users);

    render(
      <UsersPage tenantId={tenantId} />,
    );

    await waitFor(() => {
      expect(
        screen.getByText("admin@titan.test"),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText("Admin User"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Athlete User"),
    ).toBeInTheDocument();

    expect(
      screen.getAllByText("ACTIVE"),
    ).toHaveLength(2);

    expect(
      screen.getByText("2 users"),
    ).toBeInTheDocument();

  });

  it("passes the authenticated tenant id to the users API", async () => {

    listUsersMock.mockResolvedValue([]);

    render(
      <UsersPage tenantId={tenantId} />,
    );

    await waitFor(() => {
      expect(
        listUsersMock,
      ).toHaveBeenCalledTimes(1);
    });

    expect(
      listUsersMock,
    ).toHaveBeenCalledWith(tenantId);

  });

  it("renders the empty state when no users exist", async () => {

    listUsersMock.mockResolvedValue([]);

    render(
      <UsersPage tenantId={tenantId} />,
    );

    expect(
      await screen.findByText(
        "No users found for this tenant.",
      ),
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Loading users..."),
    ).not.toBeInTheDocument();

  });

  it("renders a generic error when loading users fails", async () => {

    listUsersMock.mockRejectedValue(
      new Error("Unauthorized"),
    );

    render(
      <UsersPage tenantId={tenantId} />,
    );

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent(
      "Unable to load users. Please try again.",
    );

  });

});