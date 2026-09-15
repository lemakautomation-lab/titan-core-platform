export class CompletePasswordResetCommand {
    constructor(
        public readonly token: string,
        public readonly newPassword: string,
    ) {}
}
