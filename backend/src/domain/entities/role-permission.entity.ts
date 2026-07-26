import { randomUUID } from "crypto";

export class RolePermission {

    private constructor(

        public readonly id: string,

        public readonly roleId: string,

        public readonly permissionId: string,

        public readonly createdAt: Date,

    ) {}


    static create(

        roleId: string,

        permissionId: string,

    ): RolePermission {

        return new RolePermission(

            randomUUID(),

            roleId,

            permissionId,

            new Date(),

        );

    }


    static restore(

        id: string,

        roleId: string,

        permissionId: string,

        createdAt: Date,

    ): RolePermission {

        return new RolePermission(

            id,

            roleId,

            permissionId,

            createdAt,

        );

    }

}
