import twilio from "twilio";

export const twilioConfigured =
  !!process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_ACCOUNT_SID.startsWith("AC") &&
  !!process.env.TWILIO_AUTH_TOKEN &&
  !!process.env.TWILIO_PHONE_NUMBER;

export const twilioClient = twilioConfigured
  ? twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)
  : null;

export const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER ?? "";

// SMS templates keyed by order status
export type NotifyStatus = "assigned" | "en-route" | "in-progress" | "complete";

export function buildNotifySms(
  status: NotifyStatus,
  patientName: string,
  assignedTech?: string,
  scheduledTime?: string,
): string {
  const first = patientName.split(" ")[0];
  switch (status) {
    case "assigned":
      return `Hi ${first}, your mobile X-ray technician ${assignedTech ?? "is on the way"} has been confirmed${scheduledTime ? ` for ${scheduledTime}` : ""}. Reply STOP to opt out. – RAD-OPS`;
    case "en-route":
      return `Hi ${first}, ${assignedTech ?? "your technician"} is on the way to you now. Please be available to let them in. – RAD-OPS`;
    case "in-progress":
      return `Hi ${first}, your technician has arrived and is setting up your X-ray scan. – RAD-OPS`;
    case "complete":
      return `Hi ${first}, your X-ray scan is complete. Your results will be sent to your doctor within 24 hours. – RAD-OPS`;
  }
}
