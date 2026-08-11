import { randomUUID } from "crypto";

export class Role {

    private constructor(

        public readonly id: string,

        public readonly tenantId: string,

        public name: string,

        public description: string | null,

        public readonly createdAt: Date,

        public updatedAt: Date,

    ) {}

    static create(

        tenantId: string,

        name: string,

        description: string | null,

    ): Role {

        const now = new Date();

        return new Role(

            randomUUID(),

            tenantId,

            name,

            description,

            now,

            now,

        );

    }

    static restore(

        id: string,

        tenantId: string,

        name: string,

        description: string | null,

        createdAt: Date,

        updatedAt: Date,

    ): Role {

        return new Role(

            id,

            tenantId,

            name,

            description,

            createdAt,

            updatedAt,

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

        this.description = description;

        this.updatedAt = new Date();

    }

}
