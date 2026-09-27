import {randomUUID} from "node:crypto";
import {afterAll, describe, expect, it} from "vitest";
import {DatabaseService} from "../../src/infrastructure/database/database.service";
import {OrganisationRegistrationService} from "../../src/infrastructure/onboarding/organisation-registration.service";
import {testPrisma} from "../helpers/prisma-test.client";

const service = new OrganisationRegistrationService(new DatabaseService());
const plans: string[] = [];
const requestIds: string[] = [];

afterAll(async () => {
    await testPrisma.organisationOnboardingApplication.deleteMany({where: {requestId: {in: requestIds}}});
    await testPrisma.organisationOnboardingPlan.deleteMany({where: {id: {in: plans}}});
});

async function plan(status: "ACTIVE" | "INACTIVE" = "ACTIVE",
    interval: "MONTHLY" | "ANNUALLY" = "MONTHLY") {
    const row = await testPrisma.organisationOnboardingPlan.create({data: {
        code: `organisation-${randomUUID()}`, name: "Organisation monthly",
        amountMinor: 59000, currency: "ZAR", billingInterval: interval, status,
    }});
    plans.push(row.id);
    return row;
}

const input = (planId: string) => ({
    requestId: randomUUID(), organisationName: "TITAN Athletics",
    administratorEmail: "Admin@Example.test", planId,
});

describe("Pending organisation registration", () => {
    it("snapshots an active plan without provisioning a tenant or administrator", async () => {
        const selected = await plan();
        const data = input(selected.id);
        requestIds.push(data.requestId);
        const before = {
            tenants: await testPrisma.tenant.count(), users: await testPrisma.user.count(),
        };
        const first = await service.prepare(data);
        const again = await service.prepare(data);
        expect(again.id).toBe(first.id);
        expect(first).toMatchObject({
            organisationSlug: "titan-athletics", administratorEmail: "admin@example.test",
            amountMinor: 59000, currency: "ZAR", billingInterval: "MONTHLY",
            status: "PENDING_VERIFICATION",
        });
        expect(await testPrisma.tenant.count()).toBe(before.tenants);
        expect(await testPrisma.user.count()).toBe(before.users);
        await testPrisma.organisationOnboardingPlan.update({
            where: {id: selected.id}, data: {amountMinor: 79000},
        });
        expect((await testPrisma.organisationOnboardingApplication.findUniqueOrThrow({
            where: {id: first.id},
        })).amountMinor).toBe(59000);
        await expect(service.prepare({...data, organisationName: "Another company"}))
            .rejects.toThrow("already used");
    });

    it("rejects inactive plans, unsupported intervals and invalid registration input", async () => {
        const inactive = await plan("INACTIVE");
        await expect(service.prepare(input(inactive.id))).rejects.toThrow("unavailable");
        const active = await plan();
        await expect(service.prepare({...input(active.id), administratorEmail: "invalid"}))
            .rejects.toThrow("invalid");
        await expect(service.prepare({...input(active.id), requestId: "not-a-uuid"}))
            .rejects.toThrow("request ID");
        await expect(testPrisma.organisationOnboardingPlan.update({
            where: {id: active.id}, data: {billingInterval: "ONE_TIME"},
        })).rejects.toThrow();
    });

    it("supports an annual plan with a separate immutable price snapshot", async () => {
        const annual = await plan("ACTIVE", "ANNUALLY");
        const data = input(annual.id);
        requestIds.push(data.requestId);
        const application = await service.prepare(data);
        expect(application).toMatchObject({
            planId: annual.id, amountMinor: 59000, currency: "ZAR",
            billingInterval: "ANNUALLY", status: "PENDING_VERIFICATION",
        });
    });
});
