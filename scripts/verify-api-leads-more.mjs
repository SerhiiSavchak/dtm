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

async function post(body, ip = "10.9.8.7") {
  const res = await fetch(base, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": ip,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

const sameId = crypto.randomUUID();
const cases = [
  ["commercial+rooms", validPayload({ objectType: "commercial", rooms: 2 })],
  ["commercial+null", validPayload({ objectType: "commercial", rooms: null })],
  ["idempotent-a", validPayload({ submissionId: sameId })],
  ["idempotent-b", validPayload({ submissionId: sameId })],
];

for (const [name, body] of cases) {
  const result = await post(body, "203.0.113.50");
  console.log(name, result.status, JSON.stringify(result.json));
}
