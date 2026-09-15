import {
    describe,
    expect,
    it,
    vi,
} from "vitest";
import {
    Resend,
} from "resend";

import {
    getResendPasswordResetConfig,
} from "../../src/config/password-reset.config";
import {
    ResendPasswordResetEmailDelivery,
} from "../../src/infrastructure/email/resend-password-reset-email-delivery";

describe(
    "Resend password-reset delivery",
    () => {
        it(
            "fails closed when production configuration is missing",
            () => {
                expect(
                    () =>
                        getResendPasswordResetConfig(
                            undefined,
                            undefined,
                            "production",
                        ),
                ).toThrow(
                    "Production password-reset email delivery is not configured.",
                );

                expect(
                    getResendPasswordResetConfig(
                        undefined,
                        undefined,
                        "test",
                    ),
                ).toBeNull();
            },
        );

        it(
            "rejects sender-header injection",
            () => {
                expect(
                    () =>
                        getResendPasswordResetConfig(
                            "test-key",
                            "sender@titan.test\r\nBcc: attacker@example.com",
                            "production",
                        ),
                ).toThrow(
                    "Password-reset sender email is invalid.",
                );
            },
        );

        it(
            "sends through the injected Resend client",
            async () => {
                const send =
                    vi.fn(
                        async () => ({
                            data: {
                                id: "email-1",
                            },
                            error: null,
                        }),
                    );

                const client = {
                    emails: {
                        send,
                    },
                } as unknown as Resend;

                const delivery =
                    new ResendPasswordResetEmailDelivery(
                        client,
                        "TITAN Health <reset@titan.test>",
                    );

                const expiresAt =
                    new Date(
                        "2026-09-15T12:15:00.000Z",
                    );

                await delivery.deliver({
                    recipientEmail:
                        "athlete@example.com",
                    resetUrl:
                        "https://health.titan.test/reset-password?token=secure-token",
                    expiresAt,
                });

                expect(send)
                    .toHaveBeenCalledOnce();

                const input =
                    send.mock.calls[0][0];

                expect(input.from).toBe(
                    "TITAN Health <reset@titan.test>",
                );
                expect(input.to).toEqual([
                    "athlete@example.com",
                ]);
                expect(input.subject).toBe(
                    "Reset your TITAN Health password",
                );
                expect(input.text).toContain(
                    "secure-token",
                );
                expect(input.html).toContain(
                    "secure-token",
                );
            },
        );

        it(
            "converts a provider rejection into a controlled failure",
            async () => {
                const send =
                    vi.fn(
                        async () => ({
                            data: null,
                            error: {
                                message:
                                    "Provider rejected request",
                                name:
                                    "validation_error",
                            },
                        }),
                    );

                const client = {
                    emails: {
                        send,
                    },
                } as unknown as Resend;

                const delivery =
                    new ResendPasswordResetEmailDelivery(
                        client,
                        "reset@titan.test",
                    );

                await expect(
                    delivery.deliver({
                        recipientEmail:
                            "athlete@example.com",
                        resetUrl:
                            "https://health.titan.test/reset-password?token=secure-token",
                        expiresAt:
                            new Date(
                                "2026-09-15T12:15:00.000Z",
                            ),
                    }),
                ).rejects.toThrow(
                    "Password-reset email delivery failed.",
                );
            },
        );
    },
);
