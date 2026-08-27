import { describe, expect, it, afterAll } from "vitest";

import { PrismaAthleteDigitalTwinRepository } from "../../../src/infrastructure/repositories/athlete-digital-twin.repository";
import { AthleteDigitalTwin } from "../../../src/domain/entities/athlete-digital-twin.entity";

import { testPrisma } from "../../helpers/prisma-test.client";
import { DatabaseService } from "../../../src/infrastructure/database/database.service";

describe("AthleteDigitalTwinRepository", () => {

    const database = new DatabaseService();

    const repository =
        new PrismaAthleteDigitalTwinRepository(
            database,
        );

    afterAll(async () => {
        await testPrisma.$disconnect();
    });

    it("enforces tenant isolation", async () => {

        const tenantA =
            await testPrisma.tenant.create({
                data: {
                    name: "Digital Twin Test A",
                    slug: `digital-twin-test-a-${Date.now()}`,
                },
            });

        const tenantB =
            await testPrisma.tenant.create({
                data: {
                    name: "Digital Twin Test B",
                    slug: `digital-twin-test-b-${Date.now()}`,
                },
            });

        const athlete =
            await testPrisma.athlete.create({
                data: {
                    tenantId: tenantA.id,
                    firstName: "Twin",
                    lastName: "Athlete",
                },
            });

        const twin =
            AthleteDigitalTwin.create(
                tenantA.id,
                athlete.id,
            );

        await repository.create(twin);

        const found =
            await repository.findById(
                twin.id,
                tenantA.id,
            );

        expect(found).not.toBeNull();
        expect(found?.tenantId).toBe(tenantA.id);
        expect(found?.athleteId).toBe(athlete.id);

        const crossTenant =
            await repository.findById(
                twin.id,
                tenantB.id,
            );

        expect(crossTenant).toBeNull();

        const crossTenantAthleteLookup =
            await repository.findByAthleteId(
                athlete.id,
                tenantB.id,
            );

        expect(
            crossTenantAthleteLookup,
        ).toBeNull();

        await testPrisma.athleteDigitalTwin.delete({
            where: {
                id: twin.id,
            },
        });

        await testPrisma.athlete.delete({
            where: {
                id: athlete.id,
            },
        });

        await testPrisma.tenant.deleteMany({
            where: {
                id: {
                    in: [
                        tenantA.id,
                        tenantB.id,
                    ],
                },
            },
        });

    });

});
