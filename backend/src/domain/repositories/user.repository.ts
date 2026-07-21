export interface UserRepository {
  findById(id: string): Promise<unknown | null>;

  findByEmail(email: string): Promise<unknown | null>;

  findAllByTenantId(
    tenantId: string
  ): Promise<unknown[]>;

  create(data: unknown): Promise<unknown>;

  update(
    id: string,
    data: unknown
  ): Promise<unknown>;

  delete(id: string): Promise<void>;
}