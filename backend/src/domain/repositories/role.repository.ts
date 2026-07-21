export interface RoleRepository {
  findById(id: string): Promise<unknown | null>;

  findAllByTenantId(
    tenantId: string
  ): Promise<unknown[]>;

  findByName(
    name: string,
    tenantId: string
  ): Promise<unknown | null>;

  create(data: unknown): Promise<unknown>;

  update(
    id: string,
    data: unknown
  ): Promise<unknown>;

  delete(id: string): Promise<void>;
}