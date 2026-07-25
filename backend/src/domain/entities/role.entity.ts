import { randomUUID } from "crypto";

export class Role {

    private constructor(

        public readonly id: string,

        public name: string,

        public description: string | null,

        public readonly createdAt: Date,

        public updatedAt: Date,

    ) {}

    static create(

        name: string,

        description: string | null,

    ): Role {

        const now = new Date();

        return new Role(

            randomUUID(),

            name,

            description,

            now,

            now,

        );

    }

    static restore(

        id: string,

        name: string,

        description: string | null,

        createdAt: Date,

        updatedAt: Date,

    ): Role {

        return new Role(

            id,

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
