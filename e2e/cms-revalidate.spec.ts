import { expect, test } from "@playwright/test";

const TEST_SECRET = "dtm-local-test-revalidate-secret";
/** Local app is wired to development dataset via NEXT_PUBLIC_SANITY_DATASET. */
const APP_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || "development";

test.describe("CMS revalidate endpoint", () => {
  test.beforeAll(async ({ request }) => {
    const probe = await request.post("/api/revalidate", {
      data: { _type: "project", dataset: APP_DATASET },
      headers: { "x-dtm-revalidate-secret": TEST_SECRET },
    });
    if (probe.status() === 503) {
      test.skip(
        true,
        "SANITY_REVALIDATE_SECRET is not configured on the dev server (.env.local)"
      );
    }
  });

  test("rejects missing secret", async ({ request }) => {
    const response = await request.post("/api/revalidate", {
      data: { _type: "project", dataset: APP_DATASET },
    });
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("unauthorized");
  });

  test("rejects invalid secret", async ({ request }) => {
    const response = await request.post("/api/revalidate", {
      headers: { "x-dtm-revalidate-secret": "wrong-secret" },
      data: { _type: "project", dataset: APP_DATASET },
    });
    expect(response.status()).toBe(401);
  });

  test("rejects malformed JSON", async ({ request }) => {
    const response = await request.fetch("/api/revalidate", {
      method: "POST",
      headers: {
        "x-dtm-revalidate-secret": TEST_SECRET,
        "content-type": "application/json",
      },
      data: "not-json",
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("invalid_payload");
  });

  test("rejects missing dataset", async ({ request }) => {
    const response = await request.post("/api/revalidate", {
      headers: { "x-dtm-revalidate-secret": TEST_SECRET },
      data: { _type: "project" },
    });
    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.error).toBe("dataset_missing");
  });

  test("rejects dataset mismatch", async ({ request }) => {
    const response = await request.post("/api/revalidate", {
      headers: { "x-dtm-revalidate-secret": TEST_SECRET },
      data: {
        _type: "project",
        dataset: APP_DATASET === "production" ? "development" : "production",
      },
    });
    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.error).toBe("dataset_mismatch");
  });

  test("project event acknowledges portfolio revalidation", async ({ request }) => {
    const response = await request.post("/api/revalidate", {
      headers: { "x-dtm-revalidate-secret": TEST_SECRET },
      data: { _type: "project", dataset: APP_DATASET },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.revalidated).toContain("sanity-portfolio");
  });

  test("projectMedia event acknowledges portfolio revalidation", async ({
    request,
  }) => {
    const response = await request.post("/api/revalidate", {
      headers: { "x-dtm-revalidate-secret": TEST_SECRET },
      data: { _type: "projectMedia", dataset: APP_DATASET },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.revalidated).toContain("sanity-portfolio");
  });

  test("inProgressFrame event acknowledges in-progress revalidation", async ({
    request,
  }) => {
    const response = await request.post("/api/revalidate", {
      headers: { "x-dtm-revalidate-secret": TEST_SECRET },
      data: { _type: "inProgressFrame", dataset: APP_DATASET },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.revalidated).toContain("sanity-in-progress");
  });

  test("inProgressBoard event acknowledges in-progress revalidation", async ({
    request,
  }) => {
    const response = await request.post("/api/revalidate", {
      headers: { "x-dtm-revalidate-secret": TEST_SECRET },
      data: { _type: "inProgressBoard", dataset: APP_DATASET },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.revalidated).toContain("sanity-in-progress");
  });

  test("irrelevant document type is ignored safely", async ({ request }) => {
    const response = await request.post("/api/revalidate", {
      headers: { "x-dtm-revalidate-secret": TEST_SECRET },
      data: { _type: "translation", dataset: APP_DATASET },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.ignored).toBe(true);
    expect(body.revalidated).toEqual([]);
  });

  test("GET is not allowed", async ({ request }) => {
    const response = await request.get("/api/revalidate");
    expect(response.status()).toBe(405);
  });
});
