import {
    TrainerAiAssistancePort,
    TrainerAiAssistanceRequest,
    TrainerAiAssistanceResponse,
} from "../../application/ports/trainer-ai-assistance.port";

export class UnavailableTrainerAiAssistance
implements TrainerAiAssistancePort {
    async generate(
        _request: Readonly<TrainerAiAssistanceRequest>,
    ): Promise<TrainerAiAssistanceResponse> {
        throw new Error("AI assistance is unavailable.");
    }
}
