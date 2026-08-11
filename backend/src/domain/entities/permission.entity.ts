import { randomUUID } from "crypto";

export class Permission {

    constructor(

        public readonly id: string,

        public readonly tenantId: string,

        public code: string,

        public name: string,

        public description: string,

        public readonly createdAt: Date,

        public updatedAt: Date,

    ) {}

    static create(

        tenantId: string,

        code: string,

        name: string,

        description?: string | null,

    ): Permission {

        const now = new Date();

        return new Permission(

            randomUUID(),

            tenantId,

            code,

            name,

            description ?? "",

            now,

            now,

        );

    }

    static restore(

        id: string,

        tenantId: string,

        code: string,

        name: string,

        description: string | null,

        createdAt: Date,

        updatedAt?: Date,

    ): Permission {

        return new Permission(

            id,

            tenantId,

            code,

            name,

            description ?? "",

            createdAt,

            updatedAt ?? createdAt,

        );

    }

    rename(

        name: string,

    ): void {

        this.name = name;

        this.updatedAt = new Date();

    }

    updateDescription(

        description: string | null,

    ): void {

        this.description = description ?? "";

        this.updatedAt = new Date();

    }

    update(

        name: string,

        description?: string | null,

    ): void {

        this.rename(name);

        this.updateDescription(description ?? "");

    }

    getCode(): string {

        return this.code;

    }

}
