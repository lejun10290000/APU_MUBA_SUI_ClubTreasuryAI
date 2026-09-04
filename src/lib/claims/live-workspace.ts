import { asMinorAmount } from "@/src/domain/money";

export type LiveClaimWorkspace = {
  treasuryId: string;
  externalReference: string;
  name: string;
  totalBudgetMinor: number;
  treasuryObjectId: string | null;
  categories: Array<{
    externalReference: string;
    name: string;
    allocatedMinor: number;
    spentMinor: number;
  }>;
};

type TreasuryRecord = {
  id: string;
  external_reference: string;
  name: string;
  total_budget_minor: number;
  sui_treasury_object_id: string | null;
};

type CategoryRecord = {
  external_reference: string;
  name: string;
  allocated_minor: number;
  spent_minor: number;
};

export function mapLiveClaimWorkspace(
  treasury: TreasuryRecord,
  categories: CategoryRecord[],
): LiveClaimWorkspace {
  return {
    treasuryId: treasury.id,
    externalReference: treasury.external_reference,
    name: treasury.name,
    totalBudgetMinor: asMinorAmount(treasury.total_budget_minor),
    treasuryObjectId: treasury.sui_treasury_object_id,
    categories: categories.map((category) => ({
      externalReference: category.external_reference,
      name: category.name,
      allocatedMinor: asMinorAmount(category.allocated_minor),
      spentMinor: asMinorAmount(category.spent_minor),
    })),
  };
}
