export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type TableDefinition<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type WalletProfileRow = {
  user_id: string;
  wallet_address: string;
  display_name: string;
  verified_at: string;
  created_at: string;
  updated_at: string;
};

export type TreasuryRow = {
  id: string;
  owner_user_id: string;
  external_reference: string;
  name: string;
  currency: "USDC";
  total_budget_minor: number;
  sui_treasury_object_id: string | null;
  sui_treasurer_cap_object_id: string | null;
  sui_activation_status:
    | "not_started"
    | "in_progress"
    | "reconciliation_required"
    | "active";
  budget_locked_at: string | null;
  activated_at: string | null;
  join_code: string;
  status: "active" | "closed";
  created_at: string;
  updated_at: string;
};

export type TreasurySuiActivationRow = {
  treasury_id: string;
  owner_wallet_address: string;
  status: "not_started" | "in_progress" | "reconciliation_required" | "active";
  create_status: "not_started" | "signed" | "submitted" | "confirmed" | "reconciliation_required" | "failed_before_signing";
  create_digest: string | null;
  create_confirmed_at: string | null;
  treasury_object_id: string | null;
  treasurer_cap_object_id: string | null;
  fund_status: "not_started" | "signed" | "submitted" | "confirmed" | "reconciliation_required" | "failed_before_signing";
  fund_digest: string | null;
  fund_confirmed_at: string | null;
  allocation_status: "not_started" | "signed" | "submitted" | "confirmed" | "reconciliation_required" | "failed_before_signing";
  allocation_digest: string | null;
  allocation_confirmed_at: string | null;
  activated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BudgetCategoryRow = {
  id: string;
  treasury_id: string;
  external_reference: string;
  name: string;
  allocated_minor: number;
  spent_minor: number;
  created_at: string;
  updated_at: string;
};

export type ClaimRow = {
  id: string;
  external_reference: string;
  treasury_id: string;
  category_id: string;
  treasury_object_id: string | null;
  member_user_id: string;
  member_wallet_address: string;
  recipient_sui_address: string;
  submitter_name: string;
  merchant: string;
  description: string;
  requested_amount_minor: number;
  receipt_amount_minor: number | null;
  currency: "USDC";
  receipt_reference: string | null;
  receipt_path: string;
  receipt_hash: string;
  receipt_mime_type: "image/jpeg" | "image/png" | "image/webp";
  receipt_size_bytes: number;
  receipt_analysis: Json | null;
  duplicate_match: Json;
  recommendation: "approve" | "review" | "reject" | null;
  recommendation_reasons: Json;
  recommendation_at: string | null;
  status:
    | "submitted"
    | "under_review"
    | "approved_unpaid"
    | "rejected"
    | "paid";
  decision: "approve" | "reject" | null;
  decision_reason: string | null;
  decided_by: string | null;
  decided_at: string | null;
  payment_status: "unpaid" | "paid";
  approved_treasury_object_id: string | null;
  approved_category_reference: string | null;
  approved_recipient_sui_address: string | null;
  approved_amount_minor: number | null;
  approved_currency: "USDC" | null;
  confirmed_transaction_digest: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ClaimPaymentAttemptRow = {
  id: string;
  claim_id: string;
  treasury_id: string;
  category_id: string;
  initiated_by: string;
  treasurer_cap_object_id: string | null;
  expected_treasury_object_id: string;
  expected_category_reference: string;
  expected_recipient_sui_address: string;
  expected_amount_minor: number;
  expected_currency: "USDC";
  transaction_digest: string | null;
  status:
    | "prepared"
    | "signed"
    | "submitted"
    | "confirmed"
    | "cancelled"
    | "failed"
    | "reconciliation_required";
  failure_code: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
};

export interface Database {
  public: {
    Tables: {
      wallet_profiles: TableDefinition<
        WalletProfileRow,
        Pick<WalletProfileRow, "user_id" | "wallet_address" | "display_name"> &
          Partial<Pick<WalletProfileRow, "verified_at">>
      >;
      wallet_nonces: TableDefinition<
        {
          id: string;
          user_id: string;
          wallet_address: string;
          message: string;
          expires_at: string;
          consumed_at: string | null;
          created_at: string;
        },
        {
          id?: string;
          user_id: string;
          wallet_address: string;
          message: string;
          expires_at: string;
          consumed_at?: string | null;
        }
      >;
      treasuries: TableDefinition<
        TreasuryRow,
        Pick<
          TreasuryRow,
          | "owner_user_id"
          | "external_reference"
          | "name"
          | "total_budget_minor"
          | "sui_treasury_object_id"
          | "join_code"
        > &
          Partial<Pick<TreasuryRow, "currency" | "status">>
      >;
      treasury_sui_activations: TableDefinition<
        TreasurySuiActivationRow,
        Pick<TreasurySuiActivationRow, "treasury_id" | "owner_wallet_address"> &
          Partial<Omit<TreasurySuiActivationRow, "treasury_id" | "owner_wallet_address" | "created_at" | "updated_at">>
      >;
      treasury_members: TableDefinition<
        {
          treasury_id: string;
          user_id: string;
          role: "owner" | "treasurer" | "member";
          created_at: string;
        },
        {
          treasury_id: string;
          user_id: string;
          role: "owner" | "treasurer" | "member";
        }
      >;
      budget_categories: TableDefinition<
        BudgetCategoryRow,
        Pick<
          BudgetCategoryRow,
          | "treasury_id"
          | "external_reference"
          | "name"
          | "allocated_minor"
          | "spent_minor"
        >
      >;
      claims: TableDefinition<
        ClaimRow,
        Pick<
          ClaimRow,
          | "external_reference"
          | "treasury_id"
          | "category_id"
          | "treasury_object_id"
          | "member_user_id"
          | "member_wallet_address"
          | "recipient_sui_address"
          | "submitter_name"
          | "merchant"
          | "description"
          | "requested_amount_minor"
          | "receipt_amount_minor"
          | "currency"
          | "receipt_reference"
          | "receipt_path"
          | "receipt_hash"
          | "receipt_mime_type"
          | "receipt_size_bytes"
        >,
        Partial<ClaimRow>
      >;
      claim_payment_attempts: TableDefinition<ClaimPaymentAttemptRow, never>;
    };
    Views: Record<string, never>;
    Functions: {
      can_access_treasury: {
        Args: { p_treasury_id: string };
        Returns: boolean;
      };
      can_manage_treasury: {
        Args: { p_treasury_id: string };
        Returns: boolean;
      };
      decide_claim: {
        Args: {
          p_claim_id: string;
          p_decision: "approve" | "reject";
          p_reason: string;
        };
        Returns: ClaimRow;
      };
      prepare_claim_payment: {
        Args: { p_claim_id: string };
        Returns: ClaimPaymentAttemptRow;
      };
      replace_treasury_budget: {
        Args: { p_treasury_id: string; p_categories: Json };
        Returns: BudgetCategoryRow[];
      };
      start_treasury_sui_activation: {
        Args: {
          p_treasury_id: string;
          p_owner_user_id: string;
          p_owner_wallet_address: string;
        };
        Returns: TreasurySuiActivationRow;
      };
      record_treasury_activation_signed: {
        Args: {
          p_treasury_id: string;
          p_owner_user_id: string;
          p_step: "create" | "fund" | "allocation";
          p_digest: string;
        };
        Returns: TreasurySuiActivationRow;
      };
      reconcile_treasury_activation_step: {
        Args: {
          p_treasury_id: string;
          p_owner_user_id: string;
          p_step: "create" | "fund" | "allocation";
          p_digest: string;
          p_outcome:
            | "confirmed"
            | "reconciliation_required"
            | "failed_before_signing";
          p_treasury_object_id: string | null;
          p_treasurer_cap_object_id: string | null;
        };
        Returns: TreasurySuiActivationRow;
      };
      transition_claim_payment_attempt: {
        Args: {
          p_attempt_id: string;
          p_status: ClaimPaymentAttemptRow["status"];
          p_transaction_digest?: string | null;
          p_treasurer_cap_object_id?: string | null;
          p_failure_code?: string | null;
        };
        Returns: ClaimPaymentAttemptRow;
      };
      finalize_claim_payment: {
        Args: {
          p_attempt_id: string;
          p_transaction_digest: string;
          p_confirmed_category_remaining_minor: number;
        };
        Returns: ClaimRow;
      };
    };
    Enums: {
      treasury_member_role: "owner" | "treasurer" | "member";
      claim_status:
        | "submitted"
        | "under_review"
        | "approved_unpaid"
        | "rejected"
        | "paid";
      claim_recommendation: "approve" | "review" | "reject";
      claim_decision: "approve" | "reject";
    };
    CompositeTypes: Record<string, never>;
  };
}
