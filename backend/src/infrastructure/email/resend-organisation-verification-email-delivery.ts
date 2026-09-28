import { Resend } from "resend";
import { OrganisationVerificationEmailDelivery } from "../onboarding/organisation-email-verification.service";

export class ResendOrganisationVerificationEmailDelivery
implements OrganisationVerificationEmailDelivery {
    constructor(private readonly client: Resend, private readonly fromEmail: string) {}

    async deliver(message: Readonly<{
        recipientEmail: string;
        verificationUrl: string;
        expiresAt: Date;
    }>): Promise<void> {
        const result = await this.client.emails.send({
            from: this.fromEmail,
            to: [message.recipientEmail],
            subject: "Verify your TITAN organisation email",
            text: [
                "Verify this email address to continue your TITAN organisation registration.",
                "",
                `Verify email: ${message.verificationUrl}`,
                "",
                `This link expires at ${message.expiresAt.toISOString()}.`,
                "If you did not register, ignore this email.",
            ].join("\n"),
        });
        if (result.error) {
            throw new Error("Organisation verification email delivery failed.", { cause: result.error });
        }
    }
}
