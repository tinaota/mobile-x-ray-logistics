import { NextRequest, NextResponse } from "next/server";
import { twilioClient, twilioConfigured, TWILIO_FROM } from "@/lib/twilio";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  if (!twilioConfigured || !twilioClient) {
    return NextResponse.json({ error: "Twilio not configured" }, { status: 503 });
  }

  const body = await req.json();
  const { to, message, orderId, senderName = "Dispatch HQ" } = body as {
    to: string;
    message: string;
    orderId: string;
    senderName?: string;
  };

  if (!to || !message || !orderId) {
    return NextResponse.json({ error: "Missing required fields: to, message, orderId" }, { status: 400 });
  }

  try {
    // Send SMS via Twilio
    const twilioMsg = await twilioClient.messages.create({
      body: message,
      from: TWILIO_FROM,
      to,
    });

    // Save to Supabase messages table so it appears in the Messages tab
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    await supabase.from("messages").insert({
      order_id:    orderId,
      sender_role: "dispatcher",
      sender_name: senderName,
      content:     message,
      channel:     "sms",
      sms_sid:     twilioMsg.sid,
    });

    return NextResponse.json({ success: true, sid: twilioMsg.sid, status: twilioMsg.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
