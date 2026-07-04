import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractEobFields } from "@/lib/claims-anthropic";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 15MB)" }, { status: 400 });
  }

  try {
    const { PDFParse } = await import("pdf-parse");
    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();

    if (!result.text?.trim()) {
      return NextResponse.json({ error: "Couldn't read any text from this PDF — it may be a scanned image." }, { status: 422 });
    }

    const extracted = await extractEobFields(result.text);
    return NextResponse.json(extracted);
  } catch (err) {
    console.error("parse-eob failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not read this EOB" },
      { status: 500 }
    );
  }
}
