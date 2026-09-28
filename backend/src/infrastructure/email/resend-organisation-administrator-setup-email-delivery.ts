import { Resend } from "resend";
import { OrganisationAdministratorSetupEmailDelivery } from "../onboarding/organisation-administrator-setup.service";

export class ResendOrganisationAdministratorSetupEmailDelivery
implements OrganisationAdministratorSetupEmailDelivery {
    constructor(private readonly client: Resend, private readonly fromEmail: string) {}

    async deliver(message: Readonly<{
        recipientEmail: string;
        setupUrl: string;
        expiresAt: Date;
    }>): Promise<void> {
        const result = await this.client.emails.send({
            from: this.fromEmail,
            to: [message.recipientEmail],
            subject: "Set up your TITAN organisation administrator account",
            text: [
                "Your organisation payment and account provisioning have been confirmed.",
                "Set your administrator password to finish account activation:",
                message.setupUrl,
                "",
                `This link expires at ${message.expiresAt.toISOString()}.`,
                "If you did not request this, ignore this email.",
            ].join("\n"),
        });
        if (result.error) throw new Error("Administrator setup email delivery failed.", { cause: result.error });
    }
}
