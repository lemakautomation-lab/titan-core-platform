import type { AthleteRepository } from "../../domain/repositories/athlete.repository";
import type { PerformanceMetricRepository } from "../../domain/repositories/performance-metric.repository";
import type { PerformanceMeasurementRepository } from "../../domain/repositories/performance-measurement/performance-measurement.repository";
import { AthleteImprovementDetector, type ImprovementDirection } from "../../domain/services/athlete-improvement-detector.service";

export class DetectAthleteImprovementUseCase {
  constructor(
    private readonly athletes: AthleteRepository,
    private readonly metrics: PerformanceMetricRepository,
    private readonly measurements: PerformanceMeasurementRepository,
    private readonly detector = new AthleteImprovementDetector(),
  ) {}

  async execute(input: { tenantId: string; athleteId: string; metricId: string;
    direction: ImprovementDirection; windowDays: number; minimumSamplesPerWindow: number },
    asOf: Date = new Date()) {
    if (!(asOf instanceof Date) || !Number.isFinite(asOf.getTime()) || asOf.getTime() > Date.now()) {
      throw new Error("Trend asOf must be a valid date no later than now.");
    }
    // Validate before any repository call, including authorization lookups.
    this.detector.detect({ ...input, asOf, measurements: [] });
    if (!await this.athletes.findById(input.athleteId, input.tenantId)) throw new Error("Athlete not found.");
    const metric = await this.metrics.findById(input.metricId, input.tenantId);
    if (!metric || metric.athleteId !== input.athleteId) throw new Error("Performance metric not found for athlete.");
    const history = await this.measurements.listEffectiveHistoryForBaseline(
      input.tenantId, input.athleteId, input.metricId, asOf, input.windowDays * 2,
    );
    return { ...this.detector.detect({ ...input, asOf, measurements: history }),
      athleteId: input.athleteId, metricId: input.metricId, direction: input.direction,
      asOf, windowDays: input.windowDays };
  }
}
