import { Result } from "../common/result";
import { TrainerClientAiAssistanceDto } from "../dto/trainer/trainer-client-ai-assistance.dto";
import { TrainerAiAssistancePort } from "../ports/trainer-ai-assistance.port";
import { GetTrainerClientAiAssistanceQuery } from "../queries/trainer/get-trainer-client-ai-assistance.query";
import { GetTrainerClientReportUseCase } from "./get-trainer-client-report.use-case";

export class GetTrainerClientAiAssistanceUseCase {
    constructor(
        private readonly report: GetTrainerClientReportUseCase,
        private readonly ai: TrainerAiAssistancePort,
    ) {}

    async execute(
        query: Readonly<GetTrainerClientAiAssistanceQuery>,
    ): Promise<Result<TrainerClientAiAssistanceDto>> {
        const reportResult = await this.report.execute(query);

        if (!reportResult.isSuccess || !reportResult.value) {
            return Result.failure(
                reportResult.error ?? "Client report could not be loaded.",
            );
        }

        try {
            const generated = await this.ai.generate({
                report: reportResult.value,
            });

            return Result.success({
                athleteId: reportResult.value.athleteId,
                generatedAt: new Date().toISOString(),
                assistance: generated.assistance,
            });
        } catch (error) {
            return Result.failure(
                error instanceof Error
                    ? error.message
                    : "AI assistance is unavailable.",
            );
        }
    }
}
