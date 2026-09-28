import express from "express";
import request from "supertest";
import {
    afterAll,
    describe,
    expect,
    it,
} from "vitest";
import { randomUUID } from "node:crypto";

import { DatabaseService } from "../../src/infrastructure/database/database.service";
import { createOrganisationOnboardingRoutes } from "../../src/modules/organisation-onboarding/organisation-onboarding.routes";
import { OrganisationVerificationEmailDelivery } from "../../src/infrastructure/onboarding/organisation-email-verification.service";
import { testPrisma } from "../helpers/prisma-test.client";

const database = new DatabaseService();
const verificationEmails: Array<{ recipientEmail: string; verificationUrl: string }> = [];
const delivery: OrganisationVerificationEmailDelivery = {
    async deliver(message) {
        verificationEmails.push({
            recipientEmail: message.recipientEmail,
            verificationUrl: message.verificationUrl,
        });
    },
};

const app = express();
app.use(express.json());
app.use(
    "/api/v1/organisation-onboarding",
    createOrganisationOnboardingRoutes(database, delivery),
);

const planIds: string[] = [];
const requestIds: string[] = [];

async function createPlan(
    status: "ACTIVE" | "INACTIVE" = "ACTIVE",
    billingInterval: "MONTHLY" | "ANNUALLY" = "MONTHLY",
) {
    const plan =
        await testPrisma.organisationOnboardingPlan.create({
            data: {
                code:
                    `public-${randomUUID()}`,
                name:
                    "Public organisation plan",
                amountMinor:
                    billingInterval === "MONTHLY"
                        ? 59900
                        : 599000,
                currency: "ZAR",
                billingInterval,
                status,
            },
        });

    planIds.push(plan.id);

    return plan;
}

afterAll(async () => {
    await testPrisma.organisationOnboardingEmailVerificationToken.deleteMany({
        where: { application: { requestId: { in: requestIds } } },
    });
    await testPrisma.organisationOnboardingApplication.deleteMany({
        where: {
            requestId: {
                in: requestIds,
            },
        },
    });

    await testPrisma.organisationOnboardingPlan.deleteMany({
        where: {
            id: {
                in: planIds,
            },
        },
    });
});

describe(
    "Public organisation onboarding API",
    () => {
        it(
            "publishes only active supported organisation plans",
            async () => {
                const monthly =
                    await createPlan(
                        "ACTIVE",
                        "MONTHLY",
                    );

                const annual =
                    await createPlan(
                        "ACTIVE",
                        "ANNUALLY",
                    );

                const inactive =
                    await createPlan(
                        "INACTIVE",
                        "MONTHLY",
                    );

                const response =
                    await request(app)
                        .get(
                            "/api/v1/organisation-onboarding/plans",
                        )
                        .expect(200);

                const ids =
                    response.body.plans.map(
                        (plan: { id: string }) =>
                            plan.id,
                    );

                expect(ids).toContain(
                    monthly.id,
                );
                expect(ids).toContain(
                    annual.id,
                );
                expect(ids).not.toContain(
                    inactive.id,
                );

                const published =
                    response.body.plans.find(
                        (plan: { id: string }) =>
                            plan.id === monthly.id,
                    );

                expect(published).toMatchObject({
                    amountMinor: 59900,
                    currency: "ZAR",
                    billingInterval:
                        "MONTHLY",
                });
            },
        );

        it(
            "registers idempotently without provisioning tenant or user",
            async () => {
                const plan =
                    await createPlan();

                const requestId =
                    randomUUID();

                requestIds.push(
                    requestId,
                );

                const payload = {
                    requestId,
                    organisationName:
                        "TITAN Athletics",
                    administratorEmail:
                        "Admin@Example.test",
                    planId:
                        plan.id,
                };

                const before = {
                    tenants:
                        await testPrisma.tenant.count(),
                    users:
                        await testPrisma.user.count(),
                };

                const first =
                    await request(app)
                        .post(
                            "/api/v1/organisation-onboarding/register",
                        )
                        .send(payload)
                        .expect(201);

                const again =
                    await request(app)
                        .post(
                            "/api/v1/organisation-onboarding/register",
                        )
                        .send(payload)
                        .expect(201);

                expect(
                    again.body.application.id,
                ).toBe(
                    first.body.application.id,
                );

                expect(
                    first.body.application,
                ).toMatchObject({
                    administratorEmail:
                        "admin@example.test",
                    planId:
                        plan.id,
                    amountMinor:
                        59900,
                    currency:
                        "ZAR",
                    billingInterval:
                        "MONTHLY",
                    status:
                        "PENDING_VERIFICATION",
                });

                expect(
                    await testPrisma.tenant.count(),
                ).toBe(
                    before.tenants,
                );

                expect(
                    await testPrisma.user.count(),
                ).toBe(
                    before.users,
                );
                const firstToken = new URL(verificationEmails.at(-2)!.verificationUrl)
                    .searchParams.get("token");
                const secondEmail = verificationEmails.at(-1)!;
                expect(secondEmail.recipientEmail).toBe("admin@example.test");
                expect(first.body).not.toHaveProperty("token");
                await request(app)
                    .post("/api/v1/organisation-onboarding/verify-email")
                    .send({ token: firstToken })
                    .expect(400);
                const token = new URL(secondEmail.verificationUrl)
                    .searchParams.get("token");
                const verified = await request(app)
                    .post("/api/v1/organisation-onboarding/verify-email")
                    .send({ token })
                    .expect(200);
                expect(verified.body).toMatchObject({
                    applicationId: first.body.application.id,
                    status: "PENDING_PAYMENT",
                });
                await request(app)
                    .post("/api/v1/organisation-onboarding/verify-email")
                    .send({ token })
                    .expect(400);
                expect(await testPrisma.tenant.count()).toBe(before.tenants);
            },
        );

        it(
            "rejects invalid registration, inactive plans and conflicting idempotency reuse",
            async () => {
                const inactive =
                    await createPlan(
                        "INACTIVE",
                    );

                await request(app)
                    .post(
                        "/api/v1/organisation-onboarding/register",
                    )
                    .send({
                        requestId:
                            randomUUID(),
                        organisationName:
                            "TITAN Athletics",
                        administratorEmail:
                            "admin@example.test",
                        planId:
                            inactive.id,
                    })
                    .expect(400);

                const active =
                    await createPlan();

                const requestId =
                    randomUUID();

                requestIds.push(
                    requestId,
                );

                const original = {
                    requestId,
                    organisationName:
                        "TITAN Athletics",
                    administratorEmail:
                        "admin@example.test",
                    planId:
                        active.id,
                };

                await request(app)
                    .post(
                        "/api/v1/organisation-onboarding/register",
                    )
                    .send(original)
                    .expect(201);

                await request(app)
                    .post(
                        "/api/v1/organisation-onboarding/register",
                    )
                    .send({
                        ...original,
                        organisationName:
                            "Different Organisation",
                    })
                    .expect(409);

                await request(app)
                    .post(
                        "/api/v1/organisation-onboarding/register",
                    )
                    .send({
                        ...original,
                        requestId:
                            "invalid",
                    })
                    .expect(400);
            },
        );
    },
);
