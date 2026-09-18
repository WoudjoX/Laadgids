// On-demand revalidate na wijziging in rules/tariffs/versions (CLAUDE.md §7).
// POST { tags?: string[], paths?: string[] } met header Authorization: Bearer <REVALIDATE_SECRET>.
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

const body = z.object({
  tags: z.array(z.string().min(1).max(100)).max(200).default([]),
  paths: z.array(z.string().startsWith("/").max(300)).max(1000).default([]),
});

export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400 });

  for (const t of parsed.data.tags) revalidateTag(t, "max");
  for (const p of parsed.data.paths) revalidatePath(p);
  return NextResponse.json({ ok: true, tags: parsed.data.tags.length, paths: parsed.data.paths.length });
}
