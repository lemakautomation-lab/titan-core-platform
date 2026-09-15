import {
    PasswordResetEmail,
    PasswordResetEmailDelivery,
} from "../../application/ports/password-reset-email-delivery";

export class UnavailablePasswordResetEmailDelivery
implements PasswordResetEmailDelivery {
    async deliver(
        _message: Readonly<PasswordResetEmail>,
    ): Promise<void> {
        throw new Error(
            "Password-reset email delivery is unavailable.",
        );
    }
}
