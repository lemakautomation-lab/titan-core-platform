export interface TenantRepository {

    findById(
        id: string
    ): Promise<unknown | null>;


    findAll(): Promise<unknown[]>;


    create(
        data: unknown
    ): Promise<unknown>;


    update(
        id: string,
        data: unknown
    ): Promise<unknown>;


    delete(
        id: string
    ): Promise<void>;

}