import { describe, expect, it, afterAll } from "vitest";

import { PrismaAthleteRelationshipRepository } from "../../../src/infrastructure/repositories/athlete-relationship.repository";
import { AthleteRelationship } from "../../../src/domain/entities/athlete-relationship.entity";
import { AthleteRelationshipType } from "../../../src/domain/enums/athlete-relationship-type.enum";
import { RecordStatus } from "../../../src/domain/enums/record-status.enum";
import { testPrisma } from "../../helpers/prisma-test.client";
import { DatabaseService } from "../../../src/infrastructure/database/database.service";

describe("AthleteRelationshipRepository", () => {

    const database = new DatabaseService();
    const repository =
        new PrismaAthleteRelationshipRepository(database);

    afterAll(async () => {
        await testPrisma.$disconnect();
    });

    it("enforces tenant isolation", async () => {

        const tenantA = await testPrisma.tenant.create({
            data: {
                name: "Relationship Test A",
                slug: `relationship-test-a-${Date.now()}`,
            },
        });

        const tenantB = await testPrisma.tenant.create({
            data: {
                name: "Relationship Test B",
                slug: `relationship-test-b-${Date.now()}`,
            },
        });

        const athlete = await testPrisma.athlete.create({
            data: {
                tenantId: tenantA.id,
                firstName: "Test",
                lastName: "Athlete",
            },
        });

        const relationship =
            AthleteRelationship.create(
                tenantA.id,
                athlete.id,
                AthleteRelationshipType.COACH,
                "related-entity-test",
                new Date(),
            );

        await repository.create(relationship);

        const found =
            await repository.findById(
                relationship.id,
                tenantA.id,
            );

        expect(found).not.toBeNull();
        expect(found?.tenantId).toBe(tenantA.id);

        const crossTenant =
            await repository.findById(
                relationship.id,
                tenantB.id,
            );

        expect(crossTenant).toBeNull();

        await testPrisma.athleteRelationship.delete({
            where: { id: relationship.id },
        });

        await testPrisma.athlete.delete({
            where: { id: athlete.id },
        });

        await testPrisma.tenant.deleteMany({
            where: {
                id: {
                    in: [tenantA.id, tenantB.id],
                },
            },
        });
    });

});
