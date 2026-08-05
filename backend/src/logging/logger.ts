import { requestContextService } from "../shared/context/request-context.service";


type LogMetadata = Record<string, unknown>;


class Logger {


    private buildEntry(
        level: string,
        message: string,
        metadata?: LogMetadata,
    ) {

        const context =
            requestContextService.get();


        return {

            timestamp:
                new Date().toISOString(),

            level,

            message,

            requestId:
                context?.requestId ?? null,

            userId:
                context?.security?.userId ?? null,

            tenantId:
                context?.security?.tenantId ?? null,

            ...metadata,

        };

    }


    info(
        message: string,
        metadata?: LogMetadata,
    ): void {

        console.log(
            JSON.stringify(
                this.buildEntry(
                    "INFO",
                    message,
                    metadata,
                ),
            ),
        );

    }


    warn(
        message: string,
        metadata?: LogMetadata,
    ): void {

        console.warn(
            JSON.stringify(
                this.buildEntry(
                    "WARN",
                    message,
                    metadata,
                ),
            ),
        );

    }


    error(
        message: string,
        metadata?: LogMetadata,
    ): void {

        console.error(
            JSON.stringify(
                this.buildEntry(
                    "ERROR",
                    message,
                    metadata,
                ),
            ),
        );

    }


}


export const logger =
    new Logger();
