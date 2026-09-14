import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock("../api/client", () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from "../api/client";
import {
  getMyPerformanceBodyProfile,
  updateMyPerformanceBodyModel,
} from "./athlete-performance-body.api";

const requestMock =
  vi.mocked(apiRequest);

describe("Athlete performance-body API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads the authenticated Athlete profile", async () => {
    requestMock.mockResolvedValue({
      athleteId: "athlete-1",
      tenantId: "tenant-1",
      modelType: "FEMALE",
      measurements: [],
    });

    await expect(
      getMyPerformanceBodyProfile(),
    ).resolves.toMatchObject({
      athleteId: "athlete-1",
      modelType: "FEMALE",
    });

    expect(requestMock).toHaveBeenCalledWith(
      "/auth/me/performance-body",
      {
        method: "GET",
      },
    );
  });

  it("updates only an explicit model type", async () => {
    requestMock.mockResolvedValue({
      athleteId: "athlete-1",
      tenantId: "tenant-1",
      modelType: "MALE",
    });

    await updateMyPerformanceBodyModel("MALE");

    expect(requestMock).toHaveBeenCalledWith(
      "/auth/me/body-model",
      {
        method: "PUT",
        body: JSON.stringify({
          modelType: "MALE",
        }),
      },
    );
  });
});