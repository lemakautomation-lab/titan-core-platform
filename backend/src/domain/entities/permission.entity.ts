import { randomUUID } from "crypto";

export class Permission {

    constructor(

        public readonly id: string,

        public code: string,

        public name: string,

        public description: string,

        public readonly createdAt: Date,

        public updatedAt: Date,

    ) {}



    static create(

        code: string,

        name: string,

        description?: string | null,

    ): Permission {

        return new Permission(

            randomUUID(),

            code,

            name,

            description ?? "",

            new Date(),

            new Date(),

        );

    }



    static restore(

        id: string,

        code: string,

        name: string,

        description: string | null,

        createdAt: Date,

        updatedAt?: Date,

    ): Permission {

        return new Permission(

            id,

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
