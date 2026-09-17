import {
  cleanup,
  render,
  screen,
} from "@testing-library/react";
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock("../exercises/exercises.api", () => ({
  listExercises: vi.fn(),
}));

import {
  listExercises,
} from "../exercises/exercises.api";
import TrainingOverviewPanel from "./TrainingOverviewPanel";

const listExercisesMock=vi.mocked(listExercises);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const exercises=[
  {
    id: "exercise-1",
    tenantId: "tenant-1",
    name: "Squat",
    slug: "squat",
    description: null,
    movement: "SQUAT",
    muscleGroups: ["Quadriceps","Glutes"],
    equipment: ["Barbell"],
    trainingObjective: "STRENGTH",
    difficulty: "INTERMEDIATE",
    trainingPhase: null,
    sportId: null,
    status: "ACTIVE",
    createdAt: "2026-09-01T10:00:00+02:00",
    updatedAt: "2026-09-13T10:00:00+02:00",
  },
  {
    id: "exercise-2",
    tenantId: "tenant-1",
    name: "Sprint",
    slug: "sprint",
    description: null,
    movement: "RUN",
    muscleGroups: ["Quadriceps","Hamstrings"],
    equipment: [],
    trainingObjective: "SPEED",
    difficulty: "ADVANCED",
    trainingPhase: null,
    sportId: "sport-1",
    status: "INACTIVE",
    createdAt: "2026-09-01T10:00:00+02:00",
    updatedAt: "2026-09-13T10:00:00+02:00",
  },
];

describe("TrainingOverviewPanel", () => {
  it("does not load data without permission", () => {
    render(
      <TrainingOverviewPanel permissions={[]} />,
    );

    expect(screen.getByRole("status"))
      .toHaveTextContent("exercises.read permission");

    expect(listExercisesMock).not.toHaveBeenCalled();
  });

  it("summarises authorised training records", async () => {
    listExercisesMock.mockResolvedValue(exercises);

    render(
      <TrainingOverviewPanel
        permissions={["exercises.read"]}
      />,
    );

    const summary=await screen.findByLabelText(
      "Training summary",
    );

    expect(summary)
      .toHaveTextContent("Available exercises2");
    expect(summary)
      .toHaveTextContent("Active exercises1");
    expect(summary)
      .toHaveTextContent("Training objectives2");
    expect(summary)
      .toHaveTextContent("Muscle groups covered3");

    expect(summary).toHaveClass("titan-dashboard-summary");
  });

  it("renders a safe empty state", async () => {
    listExercisesMock.mockResolvedValue([]);

    render(
      <TrainingOverviewPanel
        permissions={["EXERCISES.READ"]}
      />,
    );

    expect(
      await screen.findByText(
        "No training exercises are available.",
      ),
    ).toBeInTheDocument();
  });

  it("fails safely when training data cannot load", async () => {
    listExercisesMock.mockRejectedValue(
      new Error("Unavailable"),
    );

    render(
      <TrainingOverviewPanel
        permissions={["exercises.read"]}
      />,
    );

    expect(await screen.findByRole("alert"))
      .toHaveTextContent(
        "Training overview is temporarily unavailable.",
      );
  });
});
