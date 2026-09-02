import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { CreatePerformanceMeasurementUseCase } from "../../application/use-cases/create-performance-measurement.use-case";
import { CreatePerformanceMeasurementCorrectionUseCase } from "../../application/use-cases/create-performance-measurement-correction.use-case";
import { ListRecentPerformanceMeasurementsUseCase } from "../../application/use-cases/list-recent-performance-measurements.use-case";
import { PerformanceMeasurementMapper } from "../../application/mappers/performance-measurement.mapper";

export class PerformanceMeasurementController {
    constructor(
        private readonly createUseCase: CreatePerformanceMeasurementUseCase,
        private readonly correctionUseCase: CreatePerformanceMeasurementCorrectionUseCase,
        private readonly listUseCase: ListRecentPerformanceMeasurementsUseCase,
    ) {}

    async create(req: AuthRequest, res: Response) {
        if (!req.user) return void res.status(401).json({ error: "Unauthorized" });
        if (!this.hasStrings(req.body, ["athleteId", "metricId", "sourceType", "sourceId", "sourceObservationId"])) {
            return void res.status(400).json({ error: "Missing required performance measurement fields." });
        }
        if (typeof req.body.value !== "number" || !Number.isFinite(req.body.value)) {
            return void res.status(400).json({ error: "Invalid performance measurement value." });
        }
        if (req.body.correctsMeasurementId !== undefined) {
            return void res.status(400).json({ error: "correctsMeasurementId is not accepted for normal observations." });
        }
        const recordedAt = this.date(req.body.recordedAt);
        if (recordedAt === null) return void res.status(400).json({ error: "Invalid recordedAt." });
        const result = await this.createUseCase.execute({
            tenantId: req.user.tenantId,
            athleteId: this.string(req.body.athleteId),
            metricId: this.string(req.body.metricId),
            value: Number(req.body.value),
            recordedAt,
            sourceType: this.string(req.body.sourceType),
            sourceId: this.string(req.body.sourceId),
            sourceObservationId: this.string(req.body.sourceObservationId),
        });
        this.respondCreate(res, result);
    }

    async correct(req: AuthRequest, res: Response) {
        if (!req.user) return void res.status(401).json({ error: "Unauthorized" });
        if (!this.hasStrings(req.body, ["athleteId", "metricId", "sourceObservationId"])) {
            return void res.status(400).json({ error: "Missing required correction fields." });
        }
        if (typeof req.body.value !== "number" || !Number.isFinite(req.body.value)) {
            return void res.status(400).json({ error: "Invalid performance measurement value." });
        }
        if (req.body.sourceType !== undefined || req.body.sourceId !== undefined ||
            req.body.correctsMeasurementId !== undefined || req.body.actorUserId !== undefined) {
            return void res.status(400).json({ error: "Correction provenance and target are server-derived." });
        }
        const recordedAt = this.date(req.body.recordedAt);
        if (recordedAt === null) return void res.status(400).json({ error: "Invalid recordedAt." });
        const result = await this.correctionUseCase.execute({
            tenantId: req.user.tenantId,
            actorUserId: req.user.userId,
            correctsMeasurementId: String(req.params.id),
            athleteId: this.string(req.body.athleteId),
            metricId: this.string(req.body.metricId),
            value: Number(req.body.value),
            recordedAt,
            sourceObservationId: this.string(req.body.sourceObservationId),
        });
        this.respondCreate(res, result);
    }

    async list(req: AuthRequest, res: Response) {
        if (!req.user) return void res.status(401).json({ error: "Unauthorized" });
        if (typeof req.query.athleteId !== "string" || !req.query.athleteId ||
            typeof req.query.metricId !== "string" || !req.query.metricId) {
            return void res.status(400).json({ error: "athleteId and metricId are required." });
        }
        const view = req.query.view === undefined ? "effective" : String(req.query.view);
        if (view !== "raw" && view !== "effective") {
            return void res.status(400).json({ error: "view must be effective or raw." });
        }
        const limit = req.query.limit === undefined ? 25 : Number(req.query.limit);
        if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
            return void res.status(400).json({ error: "limit must be an integer between 1 and 100." });
        }
        const result = await this.listUseCase.execute({
            tenantId: req.user.tenantId,
            athleteId: this.string(req.query.athleteId),
            metricId: this.string(req.query.metricId),
            view, limit,
        });
        if (!result.isSuccess) return void res.status(this.notFound(result.error) ? 404 : 400).json({ error: result.error });
        res.status(200).json({ data: result.value?.map(PerformanceMeasurementMapper.toDto) ?? [] });
    }

    private respondCreate(res: Response, result: Awaited<ReturnType<CreatePerformanceMeasurementUseCase["execute"]>>) {
        if (!result.isSuccess || !result.value) {
            const status = this.conflict(result.error) ? 409 : this.notFound(result.error) ? 404 :
                this.badRequest(result.error) ? 400 : 500;
            res.status(status).json({ error: result.error });
            return;
        }
        res.status(result.value.replayed ? 200 : 201).json({
            data: PerformanceMeasurementMapper.toDto(result.value.measurement),
            replayed: result.value.replayed,
        });
    }

    private string(value: unknown) { return typeof value === "string" ? value : ""; }
    private hasStrings(body: Record<string, unknown>, fields: string[]) {
        return fields.every(field => typeof body[field] === "string" && body[field] !== "");
    }
    private date(value: unknown): Date | undefined | null {
        if (value === undefined) return undefined;
        if (typeof value !== "string") return null;
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    }
    private conflict(error?: string) {
        return error === "Performance observation identity already exists with different data." ||
            error === "Performance measurement has already been corrected.";
    }
    private notFound(error?: string) {
        return ["Athlete not found.", "Performance metric not found.",
            "Performance metric does not belong to athlete.", "Correction target not found."].includes(error ?? "");
    }
    private badRequest(error?: string) {
        return error === "Performance measurement value must be finite." ||
            error === "INTEGER performance measurements must be integral." ||
            error === "Complete performance measurement provenance is required." ||
            error === "Performance measurement date is invalid.";
    }
}
