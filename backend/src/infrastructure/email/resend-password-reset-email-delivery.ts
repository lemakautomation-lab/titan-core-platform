import {
    Resend,
} from "resend";

import {
    PasswordResetEmail,
    PasswordResetEmailDelivery,
} from "../../application/ports/password-reset-email-delivery";

function escapeHtml(
    value: string,
): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

export class ResendPasswordResetEmailDelivery
implements PasswordResetEmailDelivery {
    constructor(
        private readonly client: Resend,
        private readonly fromEmail: string,
    ) {}

    async deliver(
        message: Readonly<PasswordResetEmail>,
    ): Promise<void> {
        const result =
            await this.client.emails.send({
                from:
                    this.fromEmail,
                to: [
                    message.recipientEmail,
                ],
                subject:
                    "Reset your TITAN Health password",
                text:
                    [
                        "A password reset was requested for your TITAN Health account.",
                        "",
                        `Reset your password: ${message.resetUrl}`,
                        "",
                        `This link expires at ${message.expiresAt.toISOString()}.`,
                        "If you did not request this reset, ignore this email.",
                    ].join("\n"),
                html:
                    [
                        "<p>A password reset was requested for your TITAN Health account.</p>",
                        `<p><a href="${escapeHtml(message.resetUrl)}">Reset your password</a></p>`,
                        `<p>This link expires at ${escapeHtml(message.expiresAt.toISOString())}.</p>`,
                        "<p>If you did not request this reset, ignore this email.</p>",
                    ].join(""),
            });

        if (result.error) {
            throw new Error(
                "Password-reset email delivery failed.",
                {
                    cause:
                        result.error,
                },
            );
        }
    }
}

export function createResendPasswordResetEmailDelivery(
    apiKey: string,
    fromEmail: string,
): PasswordResetEmailDelivery {
    return new ResendPasswordResetEmailDelivery(
        new Resend(apiKey),
        fromEmail,
    );
}
