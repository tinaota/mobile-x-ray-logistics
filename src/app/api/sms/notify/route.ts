import { NextRequest, NextResponse } from "next/server";
import { twilioClient, twilioConfigured, TWILIO_FROM, buildNotifySms, type NotifyStatus } from "@/lib/twilio";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  if (!twilioConfigured || !twilioClient) {
    // Silently succeed when Twilio isn't configured — don't block status updates
    return NextResponse.json({ skipped: true });
  }

  const body = await req.json();
  const { orderId, status, patientName, phone, assignedTech, scheduledTime } = body as {
    orderId: string;
    status: string;
    patientName: string;
    phone: string;
    assignedTech?: string;
    scheduledTime?: string;
  };

  const notifiableStatuses: NotifyStatus[] = ["assigned", "en-route", "in-progress", "complete"];
  if (!notifiableStatuses.includes(status as NotifyStatus)) {
    return NextResponse.json({ skipped: true, reason: "Status not notifiable" });
  }

  if (!phone || !patientName) {
    return NextResponse.json({ skipped: true, reason: "No phone or patient name" });
  }

  const smsBody = buildNotifySms(status as NotifyStatus, patientName, assignedTech, scheduledTime);

  try {
    const twilioMsg = await twilioClient.messages.create({
      body: smsBody,
      from: TWILIO_FROM,
      to: phone,
    });

    // Record the automated notification in the messages table
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    await supabase.from("messages").insert({
      order_id:    orderId,
      sender_role: "dispatcher",
      sender_name: "RAD-OPS (Auto)",
      content:     smsBody,
      channel:     "sms",
      sms_sid:     twilioMsg.sid,
    });

    return NextResponse.json({ success: true, sid: twilioMsg.sid });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
