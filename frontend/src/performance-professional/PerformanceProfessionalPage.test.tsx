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

function mockRehabilitationWorkflow() {
  return vi.spyOn(
    professionalApi,
    "getRehabilitationProfessionalWorkflow",
  ).mockResolvedValue({
    athleteId: "athlete-1",
    recovery: [],
  });
}

function mockNutritionWorkflow() {
  return vi.spyOn(
    professionalApi,
    "getNutritionProfessionalWorkflow",
  ).mockResolvedValue({
    athleteId: "athlete-1",
    latestNutritionPlan: null,
  });
}

function mockAiReadyWorkflows() {
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

  vi.spyOn(
    professionalApi,
    "getStrengthConditioningWorkflow",
  ).mockResolvedValue({
    athleteId: "athlete-1",
    trainingStress: [],
    workoutProgrammes: [],
  });

  mockNutritionWorkflow();
  mockRehabilitationWorkflow();
}

describe("PerformanceProfessionalPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not submit an empty Athlete ID", async () => {
    const getWorkflow = vi.spyOn(
      professionalApi,
      "getSportsScientistWorkflow",
    );

    mockNutritionWorkflow();

    mockRehabilitationWorkflow();

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

    mockNutritionWorkflow();

    mockRehabilitationWorkflow();

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

    mockNutritionWorkflow();

    mockRehabilitationWorkflow();

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

    mockNutritionWorkflow();

    mockRehabilitationWorkflow();

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

  it("loads the authorised Nutrition Professional workflow", async () => {
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

    vi.spyOn(
      professionalApi,
      "getStrengthConditioningWorkflow",
    ).mockResolvedValue({
      athleteId: "athlete-1",
      trainingStress: [],
      workoutProgrammes: [],
    });

    const getNutrition = vi.spyOn(
      professionalApi,
      "getNutritionProfessionalWorkflow",
    ).mockResolvedValue({
      athleteId: "athlete-1",
      latestNutritionPlan: {
        id: "plan-1",
        athleteId: "athlete-1",
        generatorId: "titan-nutrition",
        generatorVersion: "1",
        planSnapshot: {
          planType: "AUTOMATED_NUTRITION_PLAN",
          goalClassification: "SPORT_PERFORMANCE",
          macroTargets: {
            caloriesKcal: 2800,
            proteinGrams: 180,
            carbohydrateGrams: 340,
            fatGrams: 80,
          },
          hydrationGuidance: {
            dailyWaterLitres: 3,
            unit: "LITRES_PER_DAY",
          },
          guidance: [
            "Performance nutrition guidance.",
          ],
        },
        createdAt: "2026-09-22T12:00:00.000Z",
      },
    });

    mockRehabilitationWorkflow();

    render(<PerformanceProfessionalPage />);

    fireEvent.change(
      screen.getByLabelText("Athlete ID"),
      {
        target: { value: "athlete-1" },
      },
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Load workflow",
      }),
    );

    await waitFor(() => {
      expect(getNutrition)
        .toHaveBeenCalledWith("athlete-1");
    });

    expect(
      await screen.findByRole("region", {
        name: "Nutrition Professional workflow",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("SPORT_PERFORMANCE"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("2800 kcal"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("3 L"),
    ).toBeInTheDocument();
  });

  it("loads the bounded Rehabilitation Professional workflow", async () => {
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

    vi.spyOn(
      professionalApi,
      "getStrengthConditioningWorkflow",
    ).mockResolvedValue({
      athleteId: "athlete-1",
      trainingStress: [],
      workoutProgrammes: [],
    });

    mockNutritionWorkflow();

    const getRehabilitation = vi.spyOn(
      professionalApi,
      "getRehabilitationProfessionalWorkflow",
    ).mockResolvedValue({
      athleteId: "athlete-1",
      recovery: [
        { id: "recovery-1" },
        { id: "recovery-2" },
      ],
    });

    render(<PerformanceProfessionalPage />);

    fireEvent.change(
      screen.getByLabelText("Athlete ID"),
      {
        target: { value: "athlete-1" },
      },
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Load workflow",
      }),
    );

    await waitFor(() => {
      expect(getRehabilitation)
        .toHaveBeenCalledWith("athlete-1");
    });

    expect(
      await screen.findByRole("region", {
        name: "Rehabilitation Professional workflow",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Rehabilitation Professional Workflow",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Rehabilitation recovery observations",
      ).nextElementSibling,
    ).toHaveTextContent("2");
  });

  it("requires explicit acknowledgement before requesting AI assistance", async () => {
    mockAiReadyWorkflows();

    const generate = vi.spyOn(
      professionalApi,
      "generatePerformanceProfessionalAiAssistance",
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

    await screen.findByRole("region", {
      name: "AI Performance Professional assistance",
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Generate AI assistance",
      }),
    );

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent(
      "Acknowledge the bounded AI data transfer before requesting assistance.",
    );

    expect(generate)
      .not.toHaveBeenCalled();
  });

  it("renders bounded AI decision support and human oversight controls", async () => {
    mockAiReadyWorkflows();

    const generate = vi.spyOn(
      professionalApi,
      "generatePerformanceProfessionalAiAssistance",
    ).mockResolvedValue({
      data: {
        status: "GENERATED",
        assistance: {
          summary:
            "Review the authorised TITAN observations.",
          observations: [
            "One bounded performance observation is available.",
          ],
          considerations: [
            "Review the observation in the Athlete's wider training context.",
          ],
        },
        confidence: "NOT_ASSESSED",
        professionalReviewRequired: true,
        automaticAction: false,
        explanation: {
          retrievedAt:
            "2026-10-02T20:00:00.000Z",
          provenance: {
            performanceMetricCount: 1,
            performanceMeasurementCount: 2,
            recoveryObservationCount: 3,
            trainingStressObservationCount: 4,
            workoutProgrammeCount: 1,
          },
        },
        limitations: [
          "A qualified Performance Professional remains the decision authority.",
        ],
        generatedAt:
          "2026-10-02T20:00:01.000Z",
      },
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

    await screen.findByRole("region", {
      name: "AI Performance Professional assistance",
    });

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /I acknowledge the bounded Athlete data/i,
      }),
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Generate AI assistance",
      }),
    );

    await waitFor(() => {
      expect(generate)
        .toHaveBeenCalledWith(
          "athlete-1",
        );
    });

    const result =
      await screen.findByRole(
        "region",
        {
          name: "AI assistance result",
        },
      );

    expect(
      within(result)
        .getByText("GENERATED"),
    ).toBeInTheDocument();

    expect(
      within(result)
        .getByText("NOT_ASSESSED"),
    ).toBeInTheDocument();

    expect(
      within(result)
        .getByText(
          "Review the authorised TITAN observations.",
        ),
    ).toBeInTheDocument();

    expect(
      within(result)
        .getByText(
          "One bounded performance observation is available.",
        ),
    ).toBeInTheDocument();

    expect(
      within(result)
        .getByText(
          "A qualified Performance Professional remains the decision authority.",
        ),
    ).toBeInTheDocument();

    expect(
      within(result)
        .getByText(
          "Professional review required",
        ).nextElementSibling,
    ).toHaveTextContent("Yes");

    expect(
      within(result)
        .getByText(
          "Autonomous action",
        ).nextElementSibling,
    ).toHaveTextContent(
      "Disabled",
    );

    expect(
      within(result)
        .getByText(
          "Performance measurements",
        ).nextElementSibling,
    ).toHaveTextContent("2");

    expect(
      within(result)
        .getByText(
          "AI recovery observations",
        ).nextElementSibling,
    ).toHaveTextContent("3");

    expect(
      within(result)
        .getByText(
          "AI training stress observations",
        ).nextElementSibling,
    ).toHaveTextContent("4");
  });
});
