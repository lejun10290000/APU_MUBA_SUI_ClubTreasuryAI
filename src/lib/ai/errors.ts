export type AIServiceErrorCode =
  | "INVALID_INPUT"
  | "LIVE_REQUESTS_DISABLED"
  | "MISSING_API_KEY"
  | "MISSING_RECEIPT_IMAGE"
  | "INVALID_CONFIGURATION"
  | "PROVIDER_REQUEST_FAILED"
  | "EMPTY_MODEL_RESPONSE"
  | "MALFORMED_MODEL_RESPONSE"
  | "INVALID_MODEL_OUTPUT";

export class AIServiceError extends Error {
  readonly code: AIServiceErrorCode;

  constructor(code: AIServiceErrorCode, message: string) {
    super(message);
    this.name = "AIServiceError";
    this.code = code;
  }
}
