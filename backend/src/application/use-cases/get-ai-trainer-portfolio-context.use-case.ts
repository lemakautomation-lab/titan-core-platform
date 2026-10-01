import { Result } from "../common/result";
import { ListMyTrainerClientsQuery } from "../queries/trainer/list-my-trainer-clients.query";
import type { ListMyTrainerClientsUseCase } from "./list-my-trainer-clients.use-case";

export interface AiTrainerPortfolioContextDto {
    version: 1;
    accessMode: "TRAINER_PORTFOLIO";
    clientCount: number;
    clients: Array<{
        athleteId: string;
        firstName: string;
        lastName: string;
        status: string;
        relationshipStatus: string;
    }>;
    generatedAt: string;
}

export class GetAiTrainerPortfolioContextUseCase {
    constructor(
        private readonly clients: Pick<ListMyTrainerClientsUseCase, "execute">,
    ) {}

    async execute(input: Readonly<{
        tenantId: string;
        userId: string;
    }>): Promise<Result<AiTrainerPortfolioContextDto>> {
        const result = await this.clients.execute(
            new ListMyTrainerClientsQuery(
                input.userId,
                input.tenantId,
            ),
        );

        if (!result.isSuccess || !result.value) {
            return Result.failure(
                result.error ?? "Trainer portfolio could not be loaded.",
            );
        }

        return Result.success({
            version: 1 as const,
            accessMode: "TRAINER_PORTFOLIO" as const,
            clientCount: result.value.length,
            clients: result.value.map(client => ({
                athleteId: client.athleteId,
                firstName: client.firstName,
                lastName: client.lastName,
                status: client.status,
                relationshipStatus: client.relationshipStatus,
            })),
            generatedAt: new Date().toISOString(),
        });
    }
}
