import { GetAiTrainerPortfolioContextUseCase } from "../../application/use-cases/get-ai-trainer-portfolio-context.use-case";
import { GenerateTrainerAiAssistanceUseCase } from "../../application/use-cases/generate-trainer-ai-assistance.use-case";
import { OpenAiTrainerAssistance } from "../ai/openai-trainer-assistance";
import { auditLogModule } from "./audit-log.module";
import { authModule } from "./auth.module";
import { workoutProgrammeModule } from "./workout-programme.module";

const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini-2025-04-14";

const provider = new OpenAiTrainerAssistance({
    enabled: process.env.TRAINER_AI_ENABLED === "true",
    apiKey: process.env.OPENAI_API_KEY,
    model,
});

export const aiTrainerAssistantModule = {
    context: new GetAiTrainerPortfolioContextUseCase(
        authModule.listMyTrainerClientsUseCase,
    ),
    assistance: new GenerateTrainerAiAssistanceUseCase(
        workoutProgrammeModule.getTrainerClientReportUseCase,
        workoutProgrammeModule.listTrainerSessionSchedulesUseCase,
        provider,
        auditLogModule.auditLogService,
        {
            provider: "OPENAI",
            model,
            policyVersion: "TITAN-AI-TRAINER-75.8-v1",
        },
    ),
};
