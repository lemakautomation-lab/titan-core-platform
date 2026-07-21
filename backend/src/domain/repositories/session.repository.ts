export interface SessionRepository {
  findById(id: string): Promise<unknown | null>;

  findByUserId(
    userId: string
  ): Promise<unknown[]>;

  findActiveByToken(
    token: string
  ): Promise<unknown | null>;

  create(data: unknown): Promise<unknown>;

  revoke(
    id: string
  ): Promise<void>;

  delete(
    id: string
  ): Promise<void>;
}