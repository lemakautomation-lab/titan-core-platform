import { Result } from "../common/result";
import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { AthleteRelationshipRepository } from "../../domain/repositories/athlete-relationship.repository";
import { AthleteRelationshipType } from "../../domain/enums/athlete-relationship-type.enum";
import { GetMyTrainerAccessUseCase } from "./get-my-trainer-access.use-case";
import { TrainerClientDto } from "../dto/trainer/trainer-client.dto";
import { ListMyTrainerClientsQuery } from "../queries/trainer/list-my-trainer-clients.query";

export class ListMyTrainerClientsUseCase {
    constructor(
        private readonly relationshipRepository: AthleteRelationshipRepository,
        private readonly athleteRepository: AthleteRepository,
        private readonly trainerAccess: GetMyTrainerAccessUseCase,
    ) {}

    async execute(
        query: Readonly<ListMyTrainerClientsQuery>,
    ): Promise<Result<TrainerClientDto[]>> {
        const access = await this.trainerAccess.execute({
            userId: query.userId,
            tenantId: query.tenantId,
        });

        if (!access.isSuccess) {
            return Result.failure(access.error ?? "Trainer access could not be determined.");
        }

        if (
            !access.value ||
            !access.value.accessGranted
        ) {
            return Result.failure(
                "Active Trainer access is required.",
            );
        }

        const result =
            await this.relationshipRepository.findAllByRelatedEntity(
                query.userId,
                AthleteRelationshipType.TRAINER,
                query.tenantId,
            );

        const clients: TrainerClientDto[] = [];

        for (const relationship of result) {
            if (!relationship.isActive()) {
                continue;
            }

            const athlete =
                await this.athleteRepository.findById(
                    relationship.athleteId,
                    query.tenantId,
                );

            if (!athlete) {
                continue;
            }

            clients.push({
                athleteId: athlete.id,
                firstName: athlete.firstName,
                lastName: athlete.lastName,
                countryCode: athlete.countryCode,
                status: athlete.status,
                relationshipId: relationship.id,
                relationshipStatus: relationship.status,
                startsAt: relationship.startsAt,
                endsAt: relationship.endsAt,
            });
        }

        return Result.success(clients);
    }
}
