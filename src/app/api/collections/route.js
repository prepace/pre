// app/api/collections/route.js

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const owner_id = searchParams.get("owner_id");
  if (!owner_id) {
    return NextResponse.json(
      { success: false, error: "owner_id is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .eq("owner_id", owner_id);

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true, collections: data });
}

export async function POST(request) {
  const { owner_title, owner_summary = null, owner_id } = await request.json();
  if (!owner_title || !owner_id) {
    return NextResponse.json(
      { success: false, error: "owner_title and owner_id are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("collections")
    .insert({ owner_title, owner_summary, owner_id })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: error?.message || "Insert failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, collectionId: data.id });
}
