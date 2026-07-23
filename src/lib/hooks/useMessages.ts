"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface Message {
  id: string;
  orderId: string;
  senderRole: "dispatcher" | "technician" | "patient";
  senderName: string;
  content: string;
  readAt: string | null;
  createdAt: string;
  channel: "in_app" | "sms";
  smsSid?: string;
}

interface DbMessage {
  id: string;
  order_id: string;
  sender_role: "dispatcher" | "technician" | "patient";
  sender_name: string;
  content: string;
  read_at: string | null;
  created_at: string;
  channel?: "in_app" | "sms";
  sms_sid?: string | null;
}

function toMessage(r: DbMessage): Message {
  return {
    id:         r.id,
    orderId:    r.order_id,
    senderRole: r.sender_role,
    senderName: r.sender_name,
    content:    r.content,
    readAt:     r.read_at,
    createdAt:  r.created_at,
    channel:    r.channel ?? "in_app",
    smsSid:     r.sms_sid ?? undefined,
  };
}

export function useMessages(orderId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading]   = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!orderId) { setMessages([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at");
    setMessages((data ?? []).map(toMessage));
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    fetchMessages();

    if (!orderId) return;
    const channel = supabase
      .channel(`messages_${orderId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages",
        filter: `order_id=eq.${orderId}` }, payload => {
        setMessages(prev => [...prev, toMessage(payload.new as DbMessage)]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId, fetchMessages]);

  // Send in-app message (saved to Supabase only)
  const sendMessage = async (content: string, senderName = "Dispatch HQ") => {
    if (!orderId || !content.trim()) return;
    await supabase.from("messages").insert({
      order_id:    orderId,
      sender_role: "dispatcher",
      sender_name: senderName,
      content:     content.trim(),
      channel:     "in_app",
    });
  };

  // Send real SMS via Twilio (API route handles Twilio + saves to DB)
  const sendSms = async (phone: string, content: string, senderName = "Dispatch HQ") => {
    if (!orderId || !content.trim() || !phone) return;
    const res = await fetch("/api/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: phone, message: content.trim(), orderId, senderName }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      console.error("SMS send failed:", json.error ?? res.statusText);
    }
  };

  // Mark inbound messages (anyone but `readerRole`) as read — clears unread badges
  const markRead = useCallback(async (readerRole: Message["senderRole"]) => {
    if (!orderId) return;
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("order_id", orderId)
      .neq("sender_role", readerRole)
      .is("read_at", null);
  }, [orderId]);

  return { messages, loading, sendMessage, sendSms, markRead, refetch: fetchMessages };
}

export function useAllMessages() {
  const [messages, setMessages] = useState<Message[]>([]);

  const fetchAll = useCallback(async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false });
    setMessages((data ?? []).map(toMessage));
  }, []);

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel("messages_all")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        fetchAll();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  // Count unread from technician OR patient (SMS replies)
  const unreadByOrder = messages.reduce<Record<string, number>>((acc, m) => {
    if ((m.senderRole === "technician" || m.senderRole === "patient") && !m.readAt) {
      acc[m.orderId] = (acc[m.orderId] ?? 0) + 1;
    }
    return acc;
  }, {});

  const lastByOrder = messages.reduce<Record<string, Message>>((acc, m) => {
    if (!acc[m.orderId]) acc[m.orderId] = m;
    return acc;
  }, {});

  return { messages, unreadByOrder, lastByOrder };
}
