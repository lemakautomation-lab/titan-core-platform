export interface PermissionRepository {
  findById(id: string): Promise<unknown | null>;

  findAll(): Promise<unknown[]>;

  findByName(
    name: string
  ): Promise<unknown | null>;

  create(data: unknown): Promise<unknown>;

  update(
    id: string,
    data: unknown
  ): Promise<unknown>;

  delete(id: string): Promise<void>;
}