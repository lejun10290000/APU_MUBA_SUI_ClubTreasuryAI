import "server-only";

import type { PaymentChainStatusProvider } from "./contracts";

const unavailableProvider: PaymentChainStatusProvider = {
  async getStatus() {
    throw new Error(
      "Sui payment reconciliation is not configured in this checkpoint.",
    );
  },
};

export function getPaymentChainStatusProvider(): PaymentChainStatusProvider {
  return unavailableProvider;
}

