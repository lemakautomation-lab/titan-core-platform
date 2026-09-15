import {
    PasswordResetEmail,
    PasswordResetEmailDelivery,
} from "../../src/application/ports/password-reset-email-delivery";

export class FakePasswordResetEmailDelivery
implements PasswordResetEmailDelivery {
    public readonly messages:
        Readonly<PasswordResetEmail>[] = [];

    public failDelivery = false;

    async deliver(
        message: Readonly<PasswordResetEmail>,
    ): Promise<void> {
        if (this.failDelivery) {
            throw new Error(
                "Fake password-reset delivery failed.",
            );
        }

        this.messages.push(message);
    }
}
