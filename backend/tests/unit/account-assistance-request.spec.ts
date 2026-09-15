import {
    describe,
    expect,
    it,
} from "vitest";

import {
    AccountAssistanceRequest,
} from "../../src/domain/entities/account-assistance-request.entity";
import {
    generateAccountAssistanceReference,
    hashAccountAssistanceReference,
} from "../../src/security/account-assistance-reference.security";

describe("Account assistance foundation", () => {
    it(
        "opens a tenant-owned request for 72 hours",
        () => {
            const createdAt =
                new Date(
                    "2026-09-15T18:00:00.000Z",
                );

            const request =
                AccountAssistanceRequest.open(
                    "tenant-1",
                    "a".repeat(64),
                    createdAt,
                );

            expect(request.status).toBe("OPEN");
            expect(request.closedAt).toBeNull();
            expect(request.expiresAt).toEqual(
                new Date(
                    "2026-09-18T18:00:00.000Z",
                ),
            );
        },
    );

    it(
        "rejects missing ownership and malformed hashes",
        () => {
            expect(
                () =>
                    AccountAssistanceRequest.open(
                        " ",
                        "a".repeat(64),
                    ),
            ).toThrow(
                "Account-assistance tenant ownership is required.",
            );

            expect(
                () =>
                    AccountAssistanceRequest.open(
                        "tenant-1",
                        "raw-reference",
                    ),
            ).toThrow(
                "Account-assistance reference hash is invalid.",
            );
        },
    );

    it(
        "enforces a maximum seven-day lifetime",
        () => {
            expect(
                () =>
                    AccountAssistanceRequest.open(
                        "tenant-1",
                        "a".repeat(64),
                        new Date(),
                        169,
                    ),
            ).toThrow(
                "Account-assistance expiry is invalid.",
            );
        },
    );

    it("closes an active request once", () => {
        const createdAt =
            new Date(
                "2026-09-15T18:00:00.000Z",
            );

        const request =
            AccountAssistanceRequest.open(
                "tenant-1",
                "a".repeat(64),
                createdAt,
            );

        request.close(
            new Date(
                "2026-09-15T19:00:00.000Z",
            ),
        );

        expect(request.status).toBe("CLOSED");

        expect(
            () => request.close(new Date()),
        ).toThrow(
            "Account-assistance request is unavailable.",
        );
    });

    it("expires only after its deadline", () => {
        const createdAt =
            new Date(
                "2026-09-15T18:00:00.000Z",
            );

        const request =
            AccountAssistanceRequest.open(
                "tenant-1",
                "a".repeat(64),
                createdAt,
                1,
            );

        request.expire(
            new Date(
                "2026-09-15T18:30:00.000Z",
            ),
        );
        expect(request.status).toBe("OPEN");

        request.expire(
            new Date(
                "2026-09-15T19:00:00.000Z",
            ),
        );
        expect(request.status).toBe("EXPIRED");
    });

    it(
        "generates an opaque reference and stores only its hash",
        () => {
            const generated =
                generateAccountAssistanceReference();

            expect(generated.rawReference)
                .toMatch(
                    /^[A-Za-z0-9_-]{22}$/,
                );
            expect(generated.referenceHash)
                .toMatch(
                    /^[0-9a-f]{64}$/,
                );
            expect(
                hashAccountAssistanceReference(
                    generated.rawReference,
                ),
            ).toBe(generated.referenceHash);
            expect(Object.isFrozen(generated))
                .toBe(true);
        },
    );

    it("rejects malformed references", () => {
        expect(
            () =>
                hashAccountAssistanceReference(
                    "invalid",
                ),
        ).toThrow(
            "Account-assistance reference is invalid.",
        );
    });
});
