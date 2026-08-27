export interface TreasuryRepository {
  healthCheck(): Promise<{ ok: boolean }>;
}

export class UnconfiguredTreasuryRepository implements TreasuryRepository {
  async healthCheck(): Promise<{ ok: boolean }> {
    return { ok: true };
  }
}
