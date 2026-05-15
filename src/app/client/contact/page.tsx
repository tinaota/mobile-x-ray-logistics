"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Phone, MessageCircle, Clock, AlertTriangle } from "lucide-react";

export default function ClientContactPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* Care coordinator card */}
      <Card>
        <CardContent className="py-5 space-y-4">
          <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-on-surface-variant">
            Care Coordinator
          </p>
          <div>
            <p className="text-xl font-semibold text-on-surface">We're here to help</p>
            <p className="text-sm text-on-surface-variant mt-1">
              Your care coordinator can answer questions about your appointment, when the technician will arrive, or your X-ray results.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <Clock className="h-4 w-4 shrink-0" />
            <span>Available Mon–Fri, 7:00 AM – 7:00 PM</span>
          </div>
          <div className="space-y-2 pt-1">
            <Button variant="primary" size="lg" className="w-full gap-2">
              <Phone className="h-4 w-4" /> Call (602) 555-0100
            </Button>
            <Button variant="outline" size="lg" className="w-full gap-2">
              <MessageCircle className="h-4 w-4" /> Send a Message
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* What to expect card */}
      <Card>
        <CardContent className="py-5 space-y-3">
          <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-on-surface-variant">
            What to Expect
          </p>
          {[
            { q: "How long will the visit take?",    a: "Most portable X-ray visits take 15–30 minutes from arrival." },
            { q: "What should I do to prepare?",     a: "Wear comfortable, loose-fitting clothing. Remove any jewelry near the area being X-rayed." },
            { q: "When will I get my results?",      a: "A radiologist will review your images and a report will be sent to your referring doctor, usually within 24–48 hours." },
            { q: "Can a family member be present?",  a: "Yes. A family member or caregiver is welcome to stay in the room during the procedure." },
          ].map(({ q, a }) => (
            <div key={q} className="border-b border-outline-variant/30 last:border-0 pb-3 last:pb-0">
              <p className="text-sm font-semibold text-on-surface">{q}</p>
              <p className="text-sm text-on-surface-variant mt-1">{a}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Emergency card */}
      <Card>
        <CardContent className="py-5 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-emergency-red shrink-0" />
            <p className="text-[10px] font-label font-semibold uppercase tracking-wider text-emergency-red">
              Medical Emergency
            </p>
          </div>
          <p className="text-sm text-on-surface-variant">
            If you or someone nearby is experiencing a medical emergency, call 911 immediately.
          </p>
          <Button variant="danger" size="lg" className="w-full gap-2">
            <Phone className="h-4 w-4" /> Call 911
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
