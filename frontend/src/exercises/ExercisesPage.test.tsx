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

import ExercisesPage from "./ExercisesPage";

vi.mock("./exercises.api", () => ({
  listExercises: vi.fn(),
}));

import { listExercises } from "./exercises.api";

const listExercisesMock =
  vi.mocked(listExercises);

const exercises = [
  {
    id: "exercise-1",
    tenantId: "tenant-1",
    name: "Back Squat",
    slug: "back-squat",
    description: "Barbell squat",
    movement: "Squat",
    muscleGroups: ["Quadriceps", "Glutes"],
    equipment: ["Barbell"],
    trainingObjective: "Strength",
    difficulty: "INTERMEDIATE",
    trainingPhase: "Strength",
    sportId: "sport-1",
    status: "ACTIVE",
    createdAt: "2026-08-29T00:00:00.000Z",
    updatedAt: "2026-08-29T00:00:00.000Z",
  },
];

describe("ExercisesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state", () => {
    listExercisesMock.mockReturnValue(
      new Promise(() => {}),
    );

    render(<ExercisesPage />);

    expect(
      screen.getByText("Loading exercises..."),
    ).toBeInTheDocument();
  });

  it("loads and renders exercises", async () => {
    listExercisesMock.mockResolvedValue(
      exercises,
    );

    render(<ExercisesPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Back Squat"),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText("1 exercise"),
    ).toBeInTheDocument();
  });

  it("calls the exercise API once", async () => {
    listExercisesMock.mockResolvedValue([]);

    render(<ExercisesPage />);

    await waitFor(() => {
      expect(
        listExercisesMock,
      ).toHaveBeenCalledTimes(1);
    });
  });

  it("renders empty state", async () => {
    listExercisesMock.mockResolvedValue([]);

    render(<ExercisesPage />);

    expect(
      await screen.findByText(
        "No exercises found.",
      ),
    ).toBeInTheDocument();
  });

  it("renders generic error", async () => {
    listExercisesMock.mockRejectedValue(
      new Error("Unauthorized"),
    );

    render(<ExercisesPage />);

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent(
      "Unable to load exercises. Please try again.",
    );
  });
});
