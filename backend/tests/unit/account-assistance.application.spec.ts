import {
    describe,
    expect,
    it,
    vi,
} from "vitest";

import {
    AccountAssistanceTransaction,
} from "../../src/application/ports/account-assistance.transaction";
import {
    RequestAccountAssistanceUseCase,
} from "../../src/application/use-cases/request-account-assistance.use-case";
import {
    hashAccountAssistanceReference,
} from "../../src/security/account-assistance-reference.security";

describe(
    "Account assistance application boundary",
    () => {
        it(
            "persists only the hash and returns the opaque reference once",
            async () => {
                const transaction:
                    AccountAssistanceTransaction = {
                        openForConsumer:
                            vi.fn(
                                async () => ({
                                    requestId:
                                        "request-1",
                                    tenantId:
                                        "tenant-1",
                                }),
                            ),
                    };

                const createdAt =
                    new Date(
                        "2026-09-15T18:00:00.000Z",
                    );

                const useCase =
                    new RequestAccountAssistanceUseCase(
                        transaction,
                        "titan-health-consumer",
                        () => createdAt,
                    );

                const result =
                    await useCase.execute();

                expect(result.isSuccess)
                    .toBe(true);

                const input =
                    vi.mocked(
                        transaction
                            .openForConsumer,
                    ).mock.calls[0][1];

                expect(
                    input.referenceHash,
                ).toBe(
                    hashAccountAssistanceReference(
                        result.value!.reference,
                    ),
                );

                expect(
                    JSON.stringify(input),
                ).not.toContain(
                    result.value!.reference,
                );

                expect(
                    transaction.openForConsumer,
                ).toHaveBeenCalledWith(
                    "titan-health-consumer",
                    expect.any(Object),
                );
            },
        );

        it(
            "returns a controlled unavailable result",
            async () => {
                const transaction:
                    AccountAssistanceTransaction = {
                        openForConsumer:
                            vi.fn(
                                async () => null,
                            ),
                    };

                const result =
                    await new RequestAccountAssistanceUseCase(
                        transaction,
                        "missing-consumer",
                    ).execute();

                expect(result.isSuccess)
                    .toBe(false);
                expect(result.error).toBe(
                    "Account assistance is temporarily unavailable.",
                );
            },
        );
    },
);
