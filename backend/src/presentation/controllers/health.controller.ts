import { Response } from "express";

import { DatabaseService } from "../../infrastructure/database/database.service";


export class HealthController {


    constructor(

        private readonly database:
            DatabaseService,

    ) {}



    async check(

        _req: any,

        res: Response,

    ): Promise<void> {


        let databaseStatus = "disconnected";


        try {

            await this.database.prisma.$queryRaw`SELECT 1`;

            databaseStatus = "connected";

        }

        catch {

            databaseStatus = "unavailable";

        }



        res.json({

            status:
                databaseStatus === "connected"
                    ? "ok"
                    : "degraded",

            service:
                "titan-core-backend",

            database:
                databaseStatus,

            timestamp:
                new Date().toISOString(),

        });


    }


}
