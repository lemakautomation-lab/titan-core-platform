declare global {

    namespace Express {

        interface Request {

            user?: {

                userId: string;

                tenantId: string;

                roles: string[];

            };

        }

    }

}

export {};
