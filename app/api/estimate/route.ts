import { POST as postLead } from "../leads/route";

/** @deprecated Use /api/leads. Kept as a same-origin alias. */
export const runtime = "nodejs";

export async function POST(request: Request) {
  return postLead(request);
}
