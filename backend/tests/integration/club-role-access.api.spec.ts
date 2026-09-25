import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app";
import { createTestUser } from "../factories/user.factory";
import { rateLimitModule } from "../../src/infrastructure/composition/rate-limit.module";

const sections = [
    "executives", "directors", "coaches", "scientists", "conditioning",
    "nutrition", "rehabilitation", "teams", "athletes",
] as const;

async function tokenFor(identity: Awaited<ReturnType<typeof createTestUser>>) {
    await rateLimitModule.resetAuthRateLimiter();
    const response = await request(app).post("/api/v1/auth/login").send({
        tenantId: identity.tenant.id, email: identity.user.email, password: identity.password,
    });
    expect(response.status).toBe(200);
    return response.body.data.accessToken as string;
}

describe("Mission 070.10 club role access", () => {
    it("keeps each section behind its own tenant role permission", async () => {
        for (const grantedSection of sections) {
            const actor = await createTestUser({ permissions: [`club.${grantedSection}.read`] });
            const token = await tokenFor(actor);
            for (const section of sections) {
                const result = await request(app).get(`/api/v1/club/${section}`)
                    .set("Authorization", `Bearer ${token}`);
                if (section === grantedSection) {
                    // Grant passes authorization; no club assignment still hides all data.
                    expect(result.status, `${grantedSection} own section`).toBe(404);
                    expect(result.body).toEqual({ error: "Club page not found." });
                } else {
                    expect(result.status, `${grantedSection} cannot read ${section}`).toBe(403);
                }
            }
        }
    }, 60000);
});
