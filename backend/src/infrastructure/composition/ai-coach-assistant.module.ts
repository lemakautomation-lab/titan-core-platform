import { GetAiCoachContextUseCase } from "../../application/use-cases/get-ai-coach-context.use-case";
import { GenerateCoachAiAssistanceUseCase } from "../../application/use-cases/generate-coach-ai-assistance.use-case";
import { OpenAiCoachAssistance } from "../ai/openai-coach-assistance";
import { auditLogModule } from "./audit-log.module";
import { coachModule } from "./coach.module";

const model =
    process.env.OPENAI_MODEL ??
    "gpt-4.1-mini-2025-04-14";

const provider =
    new OpenAiCoachAssistance({
        enabled:
            process.env.COACH_AI_ENABLED ===
            "true",
        apiKey: process.env.OPENAI_API_KEY,
        model,
    });

export const aiCoachAssistantModule = {
    context: new GetAiCoachContextUseCase(
        coachModule.listMyCoachAthletesUseCase,
        coachModule.listCoachSquadsUseCase,
        coachModule.listCoachTeamsUseCase,
    ),
    assistance:
        new GenerateCoachAiAssistanceUseCase(
            coachModule
                .getCoachSquadPerformanceDashboardUseCase,
            coachModule
                .getCoachSquadTeamTrendsUseCase,
            coachModule
                .getCoachSquadTrainingLoadUseCase,
            coachModule
                .getCoachAthleteMonitoringUseCase,
            provider,
            auditLogModule.auditLogService,
            {
                provider: "OPENAI",
                model,
                policyVersion:
                    "TITAN-AI-COACH-76.7-v1",
            },
        ),
};
