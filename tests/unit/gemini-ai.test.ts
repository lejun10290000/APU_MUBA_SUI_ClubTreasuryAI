import type { GenerateContentParameters } from "@google/genai";
import { describe, expect, it, vi } from "vitest";
import budgetFixture from "@/tests/fixtures/ai/budget-valid.json";
import receiptFixture from "@/tests/fixtures/ai/receipt-valid.json";
import { GeminiAIService, type GeminiClient } from "@/src/lib/ai/gemini";

const receiptInput = {
  receiptId: "synthetic-receipt-01",
  requestedAmountMinor: 7_500,
  image: {
    mimeType: "image/png" as const,
    base64: "ZmFrZQ==",
  },
};

describe("GeminiAIService", () => {
  it("parses a valid structured budget and requests JSON schema output", async () => {
    const { service, generateContent } = makeService(budgetFixture);

    const result = await service.parseBudget(
      "Allocate 300 food, 200 marketing, 250 venue, 150 prizes, and 100 emergency.",
    );

    expect(result.currency).toBe("USDC");
    expect(result.categories[0]).toEqual({
      name: "Food",
      amountMinor: 30_000,
    });

    const request = generateContent.mock.calls[0][0];
    expect(request.model).toBe("gemini-2.5-flash");
    expect(request.config).toMatchObject({
      temperature: 0,
      responseMimeType: "application/json",
    });
    expect(request.config?.responseJsonSchema).toBeDefined();
    expect(request.config?.tools).toBeUndefined();
  });

  it.each([
    [
      "negative amount",
      {
        currency: "USDC",
        categories: [{ name: "Food", amountMinor: -1 }],
        notes: [],
      },
    ],
    [
      "empty category",
      {
        currency: "USDC",
        categories: [{ name: "", amountMinor: 100 }],
        notes: [],
      },
    ],
    [
      "wrong currency",
      {
        currency: "USD",
        categories: [{ name: "Food", amountMinor: 100 }],
        notes: [],
      },
    ],
  ])("rejects schema-invalid budget output: %s", async (_label, response) => {
    const { service } = makeService(response);

    await expect(service.parseBudget("Valid input")).rejects.toMatchObject({
      code: "INVALID_MODEL_OUTPUT",
    });
  });

  it("rejects malformed budget JSON", async () => {
    const { service } = makeTextService("not-json");

    await expect(service.parseBudget("Valid input")).rejects.toMatchObject({
      code: "MALFORMED_MODEL_RESPONSE",
    });
  });

  it("extracts a valid receipt and sends only explicit inline image data", async () => {
    const { service, generateContent } = makeService(receiptFixture);

    await expect(service.analyzeReceipt(receiptInput)).resolves.toMatchObject({
      merchant: "Campus Print Shop",
      amountMinor: 7_500,
      currency: "USDC",
      needsReview: false,
    });

    const request = generateContent.mock.calls[0][0];
    expect(request.contents).toEqual(
      expect.arrayContaining([
        {
          inlineData: {
            mimeType: "image/png",
            data: "ZmFrZQ==",
          },
        },
      ]),
    );
    expect(request.config?.responseMimeType).toBe("application/json");
    expect(request.config?.tools).toBeUndefined();
    expect(JSON.stringify(request.contents)).not.toContain(
      "synthetic-receipt-01",
    );
    expect(JSON.stringify(request.contents)).not.toContain(
      "requestedAmountMinor",
    );
  });

  it("accepts missing merchant evidence only when human review is required", async () => {
    const { service } = makeService({
      ...receiptFixture,
      merchant: null,
      needsReview: true,
      missingFields: ["merchant"],
      reasons: ["Merchant is unreadable."],
    });

    await expect(service.analyzeReceipt(receiptInput)).resolves.toMatchObject({
      merchant: null,
      needsReview: true,
      missingFields: ["merchant"],
    });
  });

  it("preserves an ambiguous extraction as manual review", async () => {
    const { service } = makeService({
      ...receiptFixture,
      amountMinor: null,
      needsReview: true,
      missingFields: ["amount"],
      reasons: ["Two totals are visible and the final amount is unclear."],
    });

    await expect(service.analyzeReceipt(receiptInput)).resolves.toMatchObject({
      amountMinor: null,
      needsReview: true,
    });
  });

  it.each([
    ["negative amount", { ...receiptFixture, amountMinor: -1 }],
    ["wrong currency", { ...receiptFixture, currency: "MYR" }],
    [
      "incomplete evidence without review",
      {
        ...receiptFixture,
        merchant: null,
        missingFields: ["merchant"],
        needsReview: false,
      },
    ],
  ])("rejects schema-invalid receipt output: %s", async (_label, response) => {
    const { service } = makeService(response);

    await expect(service.analyzeReceipt(receiptInput)).rejects.toMatchObject({
      code: "INVALID_MODEL_OUTPUT",
    });
  });

  it("requires explicit receipt image data before any live request", async () => {
    const { service, generateContent } = makeService(receiptFixture);

    await expect(
      service.analyzeReceipt({
        receiptId: "no-image",
        requestedAmountMinor: 7_500,
      }),
    ).rejects.toMatchObject({ code: "MISSING_RECEIPT_IMAGE" });
    expect(generateContent).not.toHaveBeenCalled();
  });

  it("rejects invalid image MIME/base64 input before any live request", async () => {
    const { service, generateContent } = makeService(receiptFixture);

    await expect(
      service.analyzeReceipt({
        receiptId: "invalid-image",
        requestedAmountMinor: 7_500,
        image: {
          mimeType: "image/png",
          base64: "data:image/png;base64,secret",
        },
      }),
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
    expect(generateContent).not.toHaveBeenCalled();
  });

  it("blocks live requests when the explicit guard is disabled", async () => {
    const createClient = vi.fn(async () => makeClient(budgetFixture).client);
    const service = new GeminiAIService({
      apiKey: "test-only-key",
      model: "gemini-2.5-flash",
      liveRequestsEnabled: false,
      createClient,
    });

    await expect(service.parseBudget("Valid input")).rejects.toMatchObject({
      code: "LIVE_REQUESTS_DISABLED",
    });
    expect(createClient).not.toHaveBeenCalled();
  });

  it("fails safely when the server-side key is missing", async () => {
    const createClient = vi.fn(async () => makeClient(budgetFixture).client);
    const service = new GeminiAIService({
      model: "gemini-2.5-flash",
      liveRequestsEnabled: true,
      createClient,
    });

    await expect(service.parseBudget("Valid input")).rejects.toMatchObject({
      code: "MISSING_API_KEY",
    });
    expect(createClient).not.toHaveBeenCalled();
  });

  it("normalizes provider failures without exposing the provider payload", async () => {
    const generateContent = vi.fn<
      (
        parameters: GenerateContentParameters,
      ) => Promise<{ text: string | undefined }>
    >(async () => {
      throw new Error("provider detail containing a sensitive request payload");
    });
    const service = makeServiceWithClient({ models: { generateContent } });

    await expect(service.parseBudget("Valid input")).rejects.toMatchObject({
      code: "PROVIDER_REQUEST_FAILED",
      message: "Gemini analysis failed. Continue with manual review.",
    });
  });
});

function makeService(response: unknown) {
  return makeTextService(JSON.stringify(response));
}

function makeTextService(text: string | undefined) {
  const { client, generateContent } = makeClient(text);
  return {
    service: makeServiceWithClient(client),
    generateContent,
  };
}

function makeClient(response: unknown): {
  client: GeminiClient;
  generateContent: ReturnType<
    typeof vi.fn<
      (
        parameters: GenerateContentParameters,
      ) => Promise<{ text: string | undefined }>
    >
  >;
} {
  const text =
    typeof response === "string" || response === undefined
      ? response
      : JSON.stringify(response);
  const generateContent = vi.fn<
    (
      parameters: GenerateContentParameters,
    ) => Promise<{ text: string | undefined }>
  >(async () => ({ text }));

  return {
    client: { models: { generateContent } },
    generateContent,
  };
}

function makeServiceWithClient(client: GeminiClient) {
  return new GeminiAIService({
    apiKey: "test-only-key",
    model: "gemini-2.5-flash",
    liveRequestsEnabled: true,
    client,
  });
}
