export interface PasswordResetEmail {
    recipientEmail: string;
    resetUrl: string;
    expiresAt: Date;
}

export interface PasswordResetEmailDelivery {
    deliver(
        message: Readonly<PasswordResetEmail>,
    ): Promise<void>;
}
