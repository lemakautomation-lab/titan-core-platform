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

import TrainerClientManagement from "./TrainerClientManagement";
import * as clientApi from "./trainer-clients.api";

const client = {
  athleteId: "athlete-1",
  firstName: "Alice",
  lastName: "Athlete",
  countryCode: "ZA",
  status: "ACTIVE",
  relationshipId: "relationship-1",
  relationshipStatus: "ACTIVE",
  startsAt: "2026-09-18T00:00:00.000Z",
  endsAt: null,
};

describe("TrainerClientManagement", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads the active Trainer client roster", async () => {
    vi.spyOn(
      clientApi,
      "getMyTrainerClients",
    ).mockResolvedValue([
      client,
    ]);

    render(<TrainerClientManagement />);

    expect(
      screen.getByText(
        "Loading your client roster...",
      ),
    ).toBeTruthy();

    expect(
      await screen.findByText(
        "Alice Athlete",
      ),
    ).toBeTruthy();

    expect(
      screen.getByText(
        "Country: ZA",
      ),
    ).toBeTruthy();
  });

  it("loads the bounded client profile", async () => {
    vi.spyOn(
      clientApi,
      "getMyTrainerClients",
    ).mockResolvedValue([
      client,
    ]);

    const getProfile =
      vi.spyOn(
        clientApi,
        "getMyTrainerClientProfile",
      )
        .mockResolvedValue({
          athleteId: "athlete-1",
          firstName: "Alice",
          lastName: "Athlete",
          countryCode: "ZA",
          status: "ACTIVE",
          relationshipId:
            "relationship-1",
          relationshipStatus:
            "ACTIVE",
          relationshipStartsAt:
            "2026-09-18T00:00:00.000Z",
        });

    render(<TrainerClientManagement />);

    await screen.findByText(
      "Alice Athlete",
    );

    fireEvent.click(
      screen.getByRole(
        "button",
        {
          name: "View profile",
        },
      ),
    );

    await waitFor(() => {
      expect(
        getProfile,
      ).toHaveBeenCalledWith(
        "athlete-1",
      );
    });

    expect(
      await screen.findByRole(
        "region",
        {
          name: "Client profile",
        },
      ),
    ).toBeTruthy();

    expect(
      screen.getByText(
        "Relationship: ACTIVE",
      ),
    ).toBeTruthy();

    expect(
      screen.getByRole(
        "button",
        {
          name: "Close profile",
        },
      ),
    ).toBeTruthy();
  });
  it("shows the empty roster state", async () => {
    vi.spyOn(
      clientApi,
      "getMyTrainerClients",
    ).mockResolvedValue([]);

    render(<TrainerClientManagement />);

    expect(
      await screen.findByText(
        "You do not have any active clients yet.",
      ),
    ).toBeTruthy();
  });

  it("adds an Athlete and refreshes the roster", async () => {
    const getClients =
      vi.spyOn(
        clientApi,
        "getMyTrainerClients",
      )
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          client,
        ]);

    const addClient =
      vi.spyOn(
        clientApi,
        "addMyTrainerClient",
      )
        .mockResolvedValue({
          relationshipId:
            "relationship-1",
        });

    render(<TrainerClientManagement />);

    await screen.findByText(
      "You do not have any active clients yet.",
    );

    fireEvent.change(
      screen.getByLabelText(
        "Athlete ID",
      ),
      {
        target: {
          value: "athlete-1",
        },
      },
    );

    fireEvent.click(
      screen.getByRole(
        "button",
        {
          name: "Add client",
        },
      ),
    );

    await waitFor(() => {
      expect(
        addClient,
      ).toHaveBeenCalledWith(
        "athlete-1",
      );
    });

    expect(
      await screen.findByText(
        "Alice Athlete",
      ),
    ).toBeTruthy();

    expect(
      getClients,
    ).toHaveBeenCalledTimes(2);
  });

  it("does not submit an empty Athlete ID", async () => {
    vi.spyOn(
      clientApi,
      "getMyTrainerClients",
    ).mockResolvedValue([]);

    const addClient =
      vi.spyOn(
        clientApi,
        "addMyTrainerClient",
      );

    render(<TrainerClientManagement />);

    await screen.findByText(
      "You do not have any active clients yet.",
    );

    fireEvent.click(
      screen.getByRole(
        "button",
        {
          name: "Add client",
        },
      ),
    );

    expect(
      await screen.findByRole(
        "alert",
      ),
    ).toHaveTextContent(
      "Enter an Athlete ID before adding a client.",
    );

    expect(
      addClient,
    ).not.toHaveBeenCalled();
  });

  it("removes a client from the active roster", async () => {
    vi.spyOn(
      clientApi,
      "getMyTrainerClients",
    ).mockResolvedValue([
      client,
    ]);

    const removeClient =
      vi.spyOn(
        clientApi,
        "removeMyTrainerClient",
      )
        .mockResolvedValue();

    render(<TrainerClientManagement />);

    await screen.findByText(
      "Alice Athlete",
    );

    fireEvent.click(
      screen.getByRole(
        "button",
        {
          name: "Remove client",
        },
      ),
    );

    await waitFor(() => {
      expect(
        removeClient,
      ).toHaveBeenCalledWith(
        "athlete-1",
      );
    });

    await waitFor(() => {
      expect(
        screen.queryByText(
          "Alice Athlete",
        ),
      ).toBeNull();
    });
  });

  it("fails safely when the roster cannot be loaded", async () => {
    vi.spyOn(
      clientApi,
      "getMyTrainerClients",
    ).mockRejectedValue(
      new Error("Unavailable"),
    );

    render(<TrainerClientManagement />);

    expect(
      await screen.findByRole(
        "alert",
      ),
    ).toHaveTextContent(
      "Your client roster is temporarily unavailable.",
    );
  });
});
