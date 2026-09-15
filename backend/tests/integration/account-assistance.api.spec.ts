import request from "supertest";
import {
    afterAll,
    beforeAll,
    describe,
    expect,
    it,
} from "vitest";

import app from "../../src/app";
import {
    getConsumerTenantSlug,
} from "../../src/config/consumer-tenant.config";
import {
    hashAccountAssistanceReference,
} from "../../src/security/account-assistance-reference.security";
import {
    testPrisma,
} from "../helpers/prisma-test.client";

const slug =
    getConsumerTenantSlug();

let tenantId: string;
let createdTenant = false;
const referenceHashes: string[] = [];

beforeAll(async () => {
    let tenant =
        await testPrisma.tenant.findUnique({
            where: {
                slug,
            },
        });

    if (!tenant) {
        tenant =
            await testPrisma.tenant.create({
                data: {
                    name:
                        "Account Assistance Consumer",
                    slug,
                },
            });

        createdTenant = true;
    }

    tenantId = tenant.id;
});

afterAll(async () => {
    await testPrisma
        .accountAssistanceRequest
        .deleteMany({
            where: {
                referenceHash: {
                    in:
                        referenceHashes,
                },
            },
        });

    if (createdTenant) {
        await testPrisma.tenant.delete({
            where: {
                id:
                    tenantId,
            },
        });
    }
});

describe(
    "Account assistance HTTP boundary",
    () => {
        it(
            "creates an anonymous tenant-owned reference",
            async () => {
                const response =
                    await request(app)
                        .post(
                            "/api/v1/auth/account-assistance/request",
                        )
                        .send({});

                expect(response.status)
                    .toBe(201);
                expect(response.headers[
                    "cache-control"
                ]).toContain("no-store");

                const reference =
                    response.body.data.reference;

                expect(reference)
                    .toMatch(
                        /^[A-Za-z0-9_-]{22}$/,
                    );

                expect(response.body.data)
                    .not.toHaveProperty("tenantId");
                expect(response.body.data)
                    .not.toHaveProperty("userId");
                expect(response.body.data)
                    .not.toHaveProperty("email");

                const referenceHash =
                    hashAccountAssistanceReference(
                        reference,
                    );

                referenceHashes.push(
                    referenceHash,
                );

                const stored =
                    await testPrisma
                        .accountAssistanceRequest
                        .findUniqueOrThrow({
                            where: {
                                referenceHash,
                            },
                        });

                expect(stored.tenantId)
                    .toBe(tenantId);
                expect(stored.status)
                    .toBe("OPEN");
            },
        );

        it(
            "rejects identity and authority fields",
            async () => {
                const response =
                    await request(app)
                        .post(
                            "/api/v1/auth/account-assistance/request",
                        )
                        .send({
                            email:
                                "claimed@example.com",
                            tenantId:
                                "claimed-tenant",
                            userId:
                                "claimed-user",
                            role:
                                "ADMIN",
                        });

                expect(response.status)
                    .toBe(400);
                expect(response.headers[
                    "cache-control"
                ]).toContain("no-store");
            },
        );
    },
);
