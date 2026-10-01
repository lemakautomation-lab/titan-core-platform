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

import TrainerAiAssistant from "./TrainerAiAssistant";
import * as aiApi from "./ai-trainer-assistant.api";

const clients = [
  {
    athleteId: "11111111-1111-4111-8111-111111111111",
    firstName: "Alice",
    lastName: "Athlete",
    countryCode: "ZA",
    status: "ACTIVE",
    relationshipId: "relationship-1",
    relationshipStatus: "ACTIVE",
    startsAt: "2026-09-18T00:00:00.000Z",
    endsAt: null,
  },
];

describe("TrainerAiAssistant", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requires explicit consent before generation", () => {
    render(
      <TrainerAiAssistant clients={clients} />,
    );

    expect(
      screen.getByRole("button", {
        name: "Generate Trainer support",
      }),
    ).toBeDisabled();
  });

  it("generates a selected Trainer AI task and displays explanation and limitations", async () => {
    const generate = vi.spyOn(
      aiApi,
      "generateTrainerAiAssistance",
    ).mockResolvedValue({
      data: {
        status: "GENERATED",
        queryType: "PROGRESS_REPORT",
        assistance: {
          summary: "Client progress requires Trainer review.",
          observations: [
            "One numeric trend snapshot is available.",
          ],
          considerations: [
            "Review the current programme before changes.",
          ],
        },
        explanation: {
          version: 1,
          retrievedAt: "2026-09-30T20:00:00.000Z",
          facts: {
            adherence: {
              windowDays: 28,
              totalPastSessions: 2,
              completedSessions: 1,
              cancelledSessions: 1,
              unresolvedPastSessions: 0,
              completionRatePercent: 50,
            },
            performanceTrends: [
              {
                metricSlug: "sprint-20m",
                unit: "s",
                latestValue: 3.1,
                previousValue: 3.2,
                delta: -0.1,
                direction: "DOWN",
                measurementCount: 2,
              },
            ],
            programmes: [
              {
                trainingFrequency: 4,
                sessionDurationMinutes: 60,
                status: "ACTIVE",
              },
            ],
          },
          sources: {
            adherence: "USED",
            performance: "USED",
            programmes: "USED",
          },
        },
        limitations: {
          confidence: "NOT_ASSESSED",
          notices: [
            "AI output requires Trainer review.",
          ],
        },
        generatedAt: "2026-09-30T21:00:00.000Z",
      },
    });

    render(
      <TrainerAiAssistant clients={clients} />,
    );

    fireEvent.change(
      screen.getByLabelText("Assistant task"),
      {
        target: {
          value: "PROGRESS_REPORT",
        },
      },
    );

    fireEvent.click(
      screen.getByRole("checkbox"),
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Generate Trainer support",
      }),
    );

    await waitFor(() => {
      expect(generate).toHaveBeenCalledWith(
        clients[0].athleteId,
        "PROGRESS_REPORT",
      );
    });

    expect(
      await screen.findByText(
        "Client progress requires Trainer review.",
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("region", {
        name: "Trainer AI source explanation",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Confidence: not assessed."),
    ).toBeInTheDocument();
  });
});
