import { NutritionPlan } from "../../domain/entities/nutrition-plan/nutrition-plan.entity";
import { GenerateNutritionPlanCommand } from "../commands/generate-nutrition-plan.command";
import { NutritionPlanDto, NutritionPlanMapper } from "../dto/nutrition-plan/nutrition-plan.dto";
import { NutritionPlanGenerationTransaction } from "../ports/nutrition-plan-generation.transaction";
import { NutritionPlanGenerator } from "../ports/nutrition-plan-generator.port";
import { NutritionPlanGenerationFingerprintService } from "../services/nutrition-plan-generation-fingerprint.service";

export class GenerateNutritionPlanUseCase {
    constructor(
        private readonly generator: NutritionPlanGenerator,
        private readonly transaction: NutritionPlanGenerationTransaction,
    ) {}

    async execute(
        command: GenerateNutritionPlanCommand,
    ): Promise<{
        status: "created" | "replayed";
        plan: NutritionPlanDto;
    }> {
        if (!(command instanceof GenerateNutritionPlanCommand)) {
            throw new Error("Nutrition plan generation command is required.");
        }

        const fingerprint =
            NutritionPlanGenerationFingerprintService.request(command);

        const generated =
            await this.generator.generate(command.input);

        const plan =
            NutritionPlan.create(
                command.tenantId,
                command.input.athleteId,
                command.idempotencyKey,
                fingerprint.fingerprint,
                fingerprint.fingerprintVersion,
                generated.generatorId,
                generated.generatorVersion,
                fingerprint.snapshot,
                generated.planSnapshot,
            );

        const outcome =
            await this.transaction.execute(Object.freeze({
                tenantId: command.tenantId,
                actorUserId: command.actorUserId,
                idempotencyKey: command.idempotencyKey,
                requestFingerprint: fingerprint.fingerprint,
                requestFingerprintVersion:
                    fingerprint.fingerprintVersion,
                plan,
            }));

        return {
            status: outcome.status,
            plan: NutritionPlanMapper.toDto(outcome.plan),
        };
    }
}
