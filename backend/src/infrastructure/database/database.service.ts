import prisma from "./prisma.client";
import { Prisma } from "../../generated/prisma/client";


export class DatabaseService {

    private readonly client = prisma;


    get prisma() {
        return this.client;
    }


    async connect(): Promise<void> {

        await this.client.$connect();

    }


    async disconnect(): Promise<void> {

        await this.client.$disconnect();

    }


    async transaction<T>(
        callback: (
            tx: Prisma.TransactionClient
        ) => Promise<T>
    ): Promise<T> {

        return this.client.$transaction(callback);

    }

}