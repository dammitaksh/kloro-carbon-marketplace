import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { project, sellerProfile, projectTypeEnum } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["reforestation", "renewable_energy", "waste_management", "methane_capture", "afforestation", "solar_energy", "wind_energy", "other"]),
  location: z.string().optional(),
  registry: z.string().optional(),
  certificationStandard: z.enum(["vcs", "gold_standard", "cdm", "vera", "aces", "car", "other"]).optional(),
  vintageYear: z.number().int().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const hdrs = await headers();
    const session = await auth.api.getSession({ headers: hdrs });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Find seller profile for this user
    const sp = await db.select().from(sellerProfile).where(eq(sellerProfile.userId, session.user.id as any)).limit(1);
    if (sp.length === 0) return NextResponse.json({ projects: [] });
    const items = await db.select().from(project).where(eq(project.sellerId, sp[0].id as any));
    return NextResponse.json({ projects: items });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createProjectSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const hdrs = await headers();
    const session = await auth.api.getSession({ headers: hdrs });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Ensure seller profile
    const sp = await db.select().from(sellerProfile).where(eq(sellerProfile.userId, session.user.id as any)).limit(1);
    if (sp.length === 0) return NextResponse.json({ error: "Seller profile not found" }, { status: 400 });

    const id = crypto.randomUUID();
    await db.insert(project).values({
      id: id as any,
      sellerId: sp[0].id as any,
      name: parsed.data.name as any,
      description: (parsed.data.description ?? null) as any,
      type: parsed.data.type as any,
      location: (parsed.data.location ?? null) as any,
      registry: (parsed.data.registry ?? null) as any,
      certificationStandard: (parsed.data.certificationStandard ?? 'other') as any,
      vintageYear: (parsed.data.vintageYear ?? null) as any,
    });

    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed" }, { status: 500 });
  }
}