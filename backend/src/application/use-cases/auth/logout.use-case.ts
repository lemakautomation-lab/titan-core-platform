import { SessionRepository } from "../../../domain/repositories/session.repository";

import { LogoutCommand } from "./logout.command";


export class LogoutUseCase {


    constructor(

        private readonly sessionRepository: SessionRepository,

    ) {}


    async execute(
        command: LogoutCommand,
    ): Promise<void> {


        const session =
            await this.sessionRepository.findById(
                command.sessionId,
            );


        if (!session) {

            return;

        }


        await this.sessionRepository.revoke(
            session.id,
        );


    }


}