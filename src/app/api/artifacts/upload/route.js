// app/api/artifacts/upload/route.js
import sharp from "sharp";
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export const config = { api: { bodyParser: false } };

export async function POST(request) {
  try {
    const formData = await request.formData();
    const ownerId      = formData.get("ownerId");
    const collectionId = formData.get("collectionId");
    const batchId      = formData.get("batchId")    || null;
    const originDate   = formData.get("originDate") || null;
    const fileField    = formData.get("file");

    if (!ownerId || !collectionId || !(fileField instanceof File)) {
      return NextResponse.json(
        { success: false, error: "ownerId, collectionId and file are required" },
        { status: 400 }
      );
    }

    // read the file
    const bufferIn = Buffer.from(await fileField.arrayBuffer());
    const { data: webpBuffer, info } = await sharp(bufferIn)
      .webp()
      .toBuffer({ resolveWithObject: true });

    // build the key *inside* the "images" bucket
    const key = `${ownerId}/${Date.now()}.webp`;

    // Upload
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("images")                  // your bucket name
      .upload(key, webpBuffer, {
        contentType: "image/webp"
      });
    console.log("uploadData:", uploadData, "uploadError:", uploadError);
    if (uploadError) throw uploadError;

    // Signed URL
    const ttl = 3600;
    const { data: urlData, error: urlError } = await supabase.storage
      .from("images")
      .createSignedUrl(key, ttl);
    if (urlError) throw urlError;
    const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

    // Insert into items (letting Postgres gen_random_uuid() do the uuid)
    const itemRecord = {
      filename:      fileField.name,
      size:          info.size,
      width:         info.width,
      height:        info.height,
      filetype:      "image/webp",
      expires_at:    expiresAt,
      url:           urlData.signedUrl,
      url_thumbnail: null,
      owner_id:      ownerId,
      batch_id:      batchId,
      origin_date:   originDate,
    };
    const { data: newItem, error: itemError } = await supabase
      .from("items")
      .insert(itemRecord)
      .select("*")
      .single();
    if (itemError) throw itemError;

    // Stub into artifacts_new
    const { error: artError } = await supabase
      .from("artifacts_new")
      .insert({
        uuid:           newItem.uuid,
        extracted_text: null,
        owner_text:     null,
        public:         true,
        processed:      false,
      });
    if (artError) throw artError;

    // Link into collection_artifacts
    const { error: linkError } = await supabase
      .from("collection_artifacts")
      .insert({
        collection_id: collectionId,
        artifact_id:   newItem.uuid,
      });
    if (linkError) throw linkError;

    return NextResponse.json({ success: true, item: newItem });
  } catch (err) {
    console.error("Upload handler error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
