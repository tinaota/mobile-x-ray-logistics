import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Twilio sends POST with application/x-www-form-urlencoded
export async function POST(req: NextRequest) {
  const body = await req.text();
  const params = new URLSearchParams(body);

  const from    = params.get("From")      ?? "";
  const content = params.get("Body")      ?? "";
  const smsSid  = params.get("MessageSid") ?? "";

  // Empty TwiML response — don't auto-reply
  const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;

  if (!from || !content) {
    return new NextResponse(twiml, { headers: { "Content-Type": "text/xml" } });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // Match the From number to an active order so the message lands in the right thread
    const { data: orders } = await supabase
      .from("orders")
      .select("id")
      .eq("phone", from)
      .neq("status", "complete")
      .neq("status", "billed")
      .order("created_at", { ascending: false })
      .limit(1);

    const orderId = orders?.[0]?.id ?? null;

    // Save incoming SMS to messages table
    // Supabase real-time will push it to the dispatcher Messages tab
    await supabase.from("messages").insert({
      order_id:    orderId,
      sender_role: "patient",
      sender_name: "Patient",
      content:     content.trim(),
      channel:     "sms",
      sms_sid:     smsSid,
    });
  } catch {
    // Never return an error to Twilio — it will retry, causing duplicate messages
  }

  return new NextResponse(twiml, { headers: { "Content-Type": "text/xml" } });
}
