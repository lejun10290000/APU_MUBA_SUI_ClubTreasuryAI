import { asMinorAmount } from "@/src/domain/money";
import type {
  BudgetCategoryRow,
  TreasuryRow,
} from "@/src/lib/supabase/database.types";

export type PersistedTreasuryRole = "owner" | "treasurer" | "member";

export type PersistedBudgetCategory = {
  id: string;
  externalReference: string;
  name: string;
  allocatedMinor: number;
  spentMinor: number;
};

export type PersistedTreasuryWorkspace = {
  id: string;
  externalReference: string;
  name: string;
  totalBudgetMinor: number;
  suiTreasuryObjectId: string | null;
  linkedToSui: boolean;
  joinCode?: string;
  role: PersistedTreasuryRole;
  categories: PersistedBudgetCategory[];
};

export type SuiTreasuryLinkInput = {
  treasuryObjectId: string;
  treasurerCapObjectId: string;
};

export function mapPersistedBudgetCategory(
  category: BudgetCategoryRow,
): PersistedBudgetCategory {
  return {
    id: category.id,
    externalReference: category.external_reference,
    name: category.name,
    allocatedMinor: asMinorAmount(category.allocated_minor),
    spentMinor: asMinorAmount(category.spent_minor),
  };
}

export function mapPersistedTreasuryWorkspace({
  treasury,
  categories,
  role,
}: {
  treasury: TreasuryRow;
  categories: BudgetCategoryRow[];
  role: PersistedTreasuryRole;
}): PersistedTreasuryWorkspace {
  const workspace: PersistedTreasuryWorkspace = {
    id: treasury.id,
    externalReference: treasury.external_reference,
    name: treasury.name,
    totalBudgetMinor: asMinorAmount(treasury.total_budget_minor),
    suiTreasuryObjectId: treasury.sui_treasury_object_id,
    linkedToSui: treasury.sui_treasury_object_id !== null,
    role,
    categories: categories.map(mapPersistedBudgetCategory),
  };

  if (role === "owner" || role === "treasurer") {
    workspace.joinCode = treasury.join_code;
  }

  return workspace;
}
