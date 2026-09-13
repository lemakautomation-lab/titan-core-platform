import { randomUUID } from "crypto";

export class RolePermission {

    private constructor(

        public readonly id: string,
        public readonly tenantId: string,
        public readonly roleId: string,

        public readonly permissionId: string,

        public readonly createdAt: Date,

    ) {}


    static create(
        tenantId: string,
        roleId: string,

        permissionId: string,

    ): RolePermission {

        return new RolePermission(

            randomUUID(),
            tenantId,
            roleId,

            permissionId,

            new Date(),

        );

    }


    static restore(
        id: string,
        tenantId: string,
        roleId: string,

        permissionId: string,

        createdAt: Date,

    ): RolePermission {

        return new RolePermission(
            id,
            tenantId,
            roleId,

            permissionId,

            createdAt,

        );

    }

}
