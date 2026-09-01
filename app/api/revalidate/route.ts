import { NextResponse } from "next/server";
import { sanityDataset } from "@/sanity/env";
import { invalidateSanityTags } from "@/lib/sanity/invalidate-tags";
import {
  readProvidedSecret,
  resolveRevalidation,
  secretsMatch,
} from "@/lib/sanity/revalidate-webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function methodNotAllowed() {
  return NextResponse.json({ ok: false, error: "method_not_allowed" }, { status: 405 });
}

export async function POST(request: Request) {
  const configured = process.env.SANITY_REVALIDATE_SECRET;
  if (!configured) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  const provided = readProvidedSecret(request);
  if (!provided || !secretsMatch(provided, configured)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  try {
    const resolution = resolveRevalidation(body, sanityDataset);
    if (resolution.status === "rejected") {
      return NextResponse.json(
        { ok: false, error: resolution.reason },
        { status: 403 }
      );
    }
    if (resolution.status === "ignored") {
      return NextResponse.json({
        ok: true,
        revalidated: [],
        ignored: true,
        reason: resolution.reason,
      });
    }

    const revalidated = invalidateSanityTags(resolution.tags);
    return NextResponse.json({
      ok: true,
      revalidated,
      types: resolution.types,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}

export async function GET() {
  return methodNotAllowed();
}

export async function PUT() {
  return methodNotAllowed();
}

export async function PATCH() {
  return methodNotAllowed();
}

export async function DELETE() {
  return methodNotAllowed();
}
