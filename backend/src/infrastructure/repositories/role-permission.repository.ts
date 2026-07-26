import { RolePermission } from "../../domain/entities/role-permission.entity";

import { RolePermissionRepository } from "../../domain/repositories/role-permission.repository";

import { DatabaseService } from "../database/database.service";

import { RolePermissionMapper } from "../mappers/role-permission.mapper";


export class PrismaRolePermissionRepository
implements RolePermissionRepository {


    constructor(

        private readonly database: DatabaseService,

    ) {}



    async create(

        rolePermission: RolePermission,

    ): Promise<RolePermission> {


        const created =

            await this.database.prisma.rolePermission.create({

                data:
                    RolePermissionMapper.toPersistence(
                        rolePermission,
                    ),

            });


        return RolePermissionMapper.toDomain(
            created,
        );

    }



    async findByRoleAndPermission(

        roleId: string,

        permissionId: string,

    ): Promise<RolePermission | null> {


        const existing =

            await this.database.prisma.rolePermission.findUnique({

                where: {

                    roleId_permissionId: {

                        roleId,

                        permissionId,

                    },

                },

            });



        return existing

            ? RolePermissionMapper.toDomain(
                existing,
            )

            : null;

    }



    async findAllByRoleId(

        roleId: string,

    ): Promise<RolePermission[]> {


        const items =

            await this.database.prisma.rolePermission.findMany({

                where: {

                    roleId,

                },

            });



        return items.map(

            RolePermissionMapper.toDomain,

        );

    }



    async delete(

        roleId: string,

        permissionId: string,

    ): Promise<void> {


        await this.database.prisma.rolePermission.delete({

            where: {

                roleId_permissionId: {

                    roleId,

                    permissionId,

                },

            },

        });


    }


}
