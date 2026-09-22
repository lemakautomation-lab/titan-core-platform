import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import PerformanceProfessionalPage from "./PerformanceProfessionalPage";
import * as professionalApi from "./performance-professional.api";

describe("PerformanceProfessionalPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not submit an empty Athlete ID", async () => {
    const getWorkflow = vi.spyOn(
      professionalApi,
      "getSportsScientistWorkflow",
    );

    render(<PerformanceProfessionalPage />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Load workflow",
      }),
    );

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent(
      "Enter an Athlete ID before loading the workflow.",
    );

    expect(getWorkflow).not.toHaveBeenCalled();
  });

  it("loads the bounded Sports Scientist workflow", async () => {
    vi.spyOn(
      professionalApi,
      "getStrengthConditioningWorkflow",
    ).mockResolvedValue({
      athleteId: "athlete-1",
      trainingStress: [],
      workoutProgrammes: [],
    });

    const getWorkflow = vi.spyOn(
      professionalApi,
      "getSportsScientistWorkflow",
    ).mockResolvedValue({
      athleteId: "athlete-1",
      performance: [
        {
          metric: {},
          measurements: [],
        },
      ],
      recovery: [{ id: "recovery-1" }],
      trainingStress: [
        { id: "stress-1" },
        { id: "stress-2" },
      ],
      workoutProgrammes: [
        { id: "programme-1" },
      ],
    });

    render(<PerformanceProfessionalPage />);

    fireEvent.change(
      screen.getByLabelText("Athlete ID"),
      {
        target: {
          value: "athlete-1",
        },
      },
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Load workflow",
      }),
    );

    await waitFor(() => {
      expect(getWorkflow)
        .toHaveBeenCalledWith("athlete-1");
    });

    expect(
      await screen.findByRole("region", {
        name: "Athlete workflow",
      }),
    ).toBeInTheDocument();

    const sportsScientistRegion =
      screen.getByRole("region", {
        name: "Athlete workflow",
      });

    expect(
      within(sportsScientistRegion)
        .getByText("athlete-1"),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Performance metrics",
      ).nextElementSibling,
    ).toHaveTextContent("1");

    expect(
      screen.getByText(
        "Recovery observations",
      ).nextElementSibling,
    ).toHaveTextContent("1");

    expect(
      screen.getByText(
        "Training stress observations",
      ).nextElementSibling,
    ).toHaveTextContent("2");

    expect(
      screen.getByText(
        "Workout programmes",
      ).nextElementSibling,
    ).toHaveTextContent("1");
  });

  it("fails safely when workflow access fails", async () => {
    vi.spyOn(
      professionalApi,
      "getStrengthConditioningWorkflow",
    ).mockResolvedValue({
      athleteId: "athlete-1",
      trainingStress: [],
      workoutProgrammes: [],
    });

    vi.spyOn(
      professionalApi,
      "getSportsScientistWorkflow",
    ).mockRejectedValue(
      new Error("Unavailable"),
    );

    render(<PerformanceProfessionalPage />);

    fireEvent.change(
      screen.getByLabelText("Athlete ID"),
      {
        target: {
          value: "athlete-1",
        },
      },
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Load workflow",
      }),
    );

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent(
      "The Performance Professional workflow is temporarily unavailable.",
    );
  });

  it("loads the bounded Strength & Conditioning workflow", async () => {
    vi.spyOn(
      professionalApi,
      "getSportsScientistWorkflow",
    ).mockResolvedValue({
      athleteId: "athlete-1",
      performance: [],
      recovery: [],
      trainingStress: [],
      workoutProgrammes: [],
    });

    const getStrengthConditioning =
      vi.spyOn(
        professionalApi,
        "getStrengthConditioningWorkflow",
      ).mockResolvedValue({
        athleteId: "athlete-1",
        trainingStress: [
          { id: "stress-1" },
          { id: "stress-2" },
        ],
        workoutProgrammes: [
          { id: "programme-1" },
        ],
      });

    render(<PerformanceProfessionalPage />);

    fireEvent.change(
      screen.getByLabelText("Athlete ID"),
      {
        target: {
          value: "athlete-1",
        },
      },
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Load workflow",
      }),
    );

    await waitFor(() => {
      expect(getStrengthConditioning)
        .toHaveBeenCalledWith("athlete-1");
    });

    expect(
      await screen.findByRole("region", {
        name: "Strength and Conditioning workflow",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Strength & Conditioning Workflow",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Strength & Conditioning training stress observations",
      ).nextElementSibling,
    ).toHaveTextContent("2");

    expect(
      screen.getByText(
        "Strength & Conditioning workout programmes",
      ).nextElementSibling,
    ).toHaveTextContent("1");
  });
});
