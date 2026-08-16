const base = "http://localhost:3000/api/leads";

function validPayload(overrides = {}) {
  return {
    objectType: "apartment",
    area: 72,
    rooms: 2,
    renovationType: "turnkey",
    design: "no",
    condition: "newbuild",
    start: "1-3",
    name: "Тест",
    phone: "+380671234567",
    locale: "uk",
    submissionId: crypto.randomUUID(),
    formStartedAt: Date.now() - 12_000,
    sourcePage: "/",
    ...overrides,
  };
}

async function post(body, extraHeaders = {}) {
  const res = await fetch(base, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...extraHeaders },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

async function run() {
  const results = [];

  results.push(["invalid json", await post("{")]);
  results.push(["manipulated enum", await post(validPayload({ objectType: "villa" }))]);
  results.push(["bad phone", await post(validPayload({ phone: "123" }))]);
  results.push(["zero area", await post(validPayload({ area: 0 }))]);
  results.push(["negative area", await post(validPayload({ area: -5 }))]);
  results.push(["too fast", await post(validPayload({ formStartedAt: Date.now() - 200 }))]);
  results.push([
    "honeypot",
    await post(validPayload({ honeypot: "http://spam.test" })),
  ]);
  results.push(["valid both unconfigured", await post(validPayload())]);
  results.push(["commercial rooms rejected", await post(validPayload({ objectType: "commercial", rooms: 2 }))]);
  results.push(["commercial rooms null", await post(validPayload({ objectType: "commercial", rooms: null }))]);

  const sameId = crypto.randomUUID();
  const first = await post(validPayload({ submissionId: sameId }));
  const second = await post(validPayload({ submissionId: sameId }));
  results.push(["idempotent first", first]);
  results.push(["idempotent second", second]);

  const origin = await post(validPayload(), { Origin: "https://evil.example" });
  results.push(["cross origin", origin]);

  for (const [name, result] of results) {
    console.log(
      `${name}: ${result.status} ${JSON.stringify(result.json)}`
    );
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
