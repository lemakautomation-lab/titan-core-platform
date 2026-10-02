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

import CoachAiAssistant from "./CoachAiAssistant";
import * as aiApi from "./ai-coach-assistant.api";

const athletes = [{
  athleteId:
    "11111111-1111-4111-8111-111111111111",
  firstName: "Alice",
  lastName: "Athlete",
  countryCode: "ZA",
  status: "ACTIVE",
  relationshipId: "relationship-1",
  relationshipStatus: "ACTIVE",
  startsAt: null,
  endsAt: null,
}];

const squads = [{
  id:
    "22222222-2222-4222-8222-222222222222",
  name: "First Squad",
  description: null,
  status: "ACTIVE",
}];

describe("CoachAiAssistant", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requires explicit acknowledgement before generation", () => {
    render(
      <CoachAiAssistant
        athletes={athletes}
        squads={squads}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: "Generate Coach support",
      }),
    ).toBeDisabled();
  });

  it("generates squad intelligence and displays explanation and limitations", async () => {
    const generate = vi.spyOn(
      aiApi,
      "generateCoachAiAssistance",
    ).mockResolvedValue({
      data: {
        status: "GENERATED",
        queryType:
          "SQUAD_INTELLIGENCE",
        targetType: "SQUAD",
        assistance: {
          summary:
            "Squad records require Coach review.",
          observations: [
            "Two authorised members are represented.",
          ],
          considerations: [
            "Review the underlying source records.",
          ],
        },
        explanation: {
          version: 1,
          retrievedAt:
            "2026-10-01T08:00:00.000Z",
          facts: {
            targetType: "SQUAD",
            athlete: null,
            squad: {
              memberCount: 2,
              performanceMetricCount: 2,
              performanceMeasurementCount: 3,
              workoutProgrammeCount: 2,
              trendMetrics: [],
              trainingLoad: {
                athletesWithObservations: 2,
                observationCount: 3,
                latestAverageValue: 70,
              },
            },
          },
          sources: {
            squad: "USED",
            performance: "USED",
            trainingLoad: "USED",
            programmes: "USED",
          },
        },
        limitations: {
          confidence: "NOT_ASSESSED",
          notices: [
            "AI output requires Coach review.",
          ],
        },
        generatedAt:
          "2026-10-01T08:01:00.000Z",
      },
    });

    render(
      <CoachAiAssistant
        athletes={athletes}
        squads={squads}
      />,
    );

    fireEvent.click(
      screen.getByRole("checkbox"),
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Generate Coach support",
      }),
    );

    await waitFor(() => {
      expect(generate).toHaveBeenCalledWith(
        squads[0].id,
        "SQUAD_INTELLIGENCE",
      );
    });

    expect(
      await screen.findByText(
        "Squad records require Coach review.",
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("region", {
        name:
          "Coach AI source explanation",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Confidence: not assessed.",
      ),
    ).toBeInTheDocument();
  });
});
