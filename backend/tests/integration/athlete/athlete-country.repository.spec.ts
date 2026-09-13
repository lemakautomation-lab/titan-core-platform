import {
    afterAll,
    describe,
    expect,
    it,
} from "vitest";

import {
    Athlete,
} from "../../../src/domain/entities/athlete.entity";
import {
    DatabaseService,
} from "../../../src/infrastructure/database/database.service";
import {
    PrismaAthleteRepository,
} from "../../../src/infrastructure/repositories/athlete.repository";
import {
    testPrisma,
} from "../../helpers/prisma-test.client";

describe("Athlete country repository", () => {

    const database=new DatabaseService();
    const repository=
        new PrismaAthleteRepository(database);

    afterAll(async () => {
        await testPrisma.$disconnect();
    });

    it("persists and retrieves the normalized country code", async () => {

        const tenant=await testPrisma.tenant.create({
            data: {
                name: "Athlete Country Test",
                slug: `athlete-country-${Date.now()}`,
            },
        });

        const athlete=Athlete.create(
            tenant.id,
            null,
            null,
            "Country",
            "Athlete",
            null,
            " za ",
        );

        try {
            const created=
                await repository.create(athlete);

            const found=
                await repository.findById(
                    created.id,
                    tenant.id,
                );

            expect(found).not.toBeNull();
            expect(found?.countryCode).toBe("ZA");
        }
        finally {
            await testPrisma.athlete.deleteMany({
                where: {
                    tenantId: tenant.id,
                },
            });

            await testPrisma.tenant.delete({
                where: {
                    id: tenant.id,
                },
            });
        }

    });

});
