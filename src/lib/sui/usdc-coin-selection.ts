export type UsdcCoin = {
  coinObjectId: string;
  balance: string;
};

export type SelectedUsdcCoins = {
  selectedIds: string[];
  selectedBalance: bigint;
  totalAvailable: bigint;
};

export function selectUsdcCoins(
  coins: readonly UsdcCoin[],
  requiredBalance: bigint,
): SelectedUsdcCoins {
  if (requiredBalance <= 0n) {
    throw new Error("Required USDC balance must be positive.");
  }

  const normalized = coins.map((coin) => {
    if (!/^\d+$/.test(coin.balance)) {
      throw new Error("USDC coin balance must be an unsigned integer.");
    }
    return { ...coin, atomicBalance: BigInt(coin.balance) };
  });
  const totalAvailable = normalized.reduce(
    (total, coin) => total + coin.atomicBalance,
    0n,
  );
  if (totalAvailable < requiredBalance) {
    throw new Error(
      `Insufficient Testnet USDC: required ${requiredBalance}, available ${totalAvailable}.`,
    );
  }

  normalized.sort((left, right) => {
    if (left.atomicBalance === right.atomicBalance) {
      return left.coinObjectId.localeCompare(right.coinObjectId);
    }
    return left.atomicBalance > right.atomicBalance ? -1 : 1;
  });

  const selectedIds: string[] = [];
  let selectedBalance = 0n;
  for (const coin of normalized) {
    selectedIds.push(coin.coinObjectId);
    selectedBalance += coin.atomicBalance;
    if (selectedBalance >= requiredBalance) break;
  }

  return { selectedIds, selectedBalance, totalAvailable };
}
