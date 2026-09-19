import { TrainerClientReportDto } from "../dto/trainer/trainer-client-report.dto";

export interface TrainerAiAssistanceRequest {
    report: TrainerClientReportDto;
}

export interface TrainerAiAssistanceResponse {
    assistance: string;
}

export interface TrainerAiAssistancePort {
    generate(
        request: Readonly<TrainerAiAssistanceRequest>,
    ): Promise<TrainerAiAssistanceResponse>;
}
