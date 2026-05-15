"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface Message {
  id: string;
  orderId: string;
  senderRole: "dispatcher" | "technician";
  senderName: string;
  content: string;
  readAt: string | null;
  createdAt: string;
}

interface DbMessage {
  id: string;
  order_id: string;
  sender_role: "dispatcher" | "technician";
  sender_name: string;
  content: string;
  read_at: string | null;
  created_at: string;
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

  const sendMessage = async (content: string, senderName = "Dispatch HQ") => {
    if (!orderId || !content.trim()) return;
    await supabase.from("messages").insert({
      order_id:    orderId,
      sender_role: "dispatcher",
      sender_name: senderName,
      content:     content.trim(),
    });
  };

  return { messages, loading, sendMessage, refetch: fetchMessages };
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

  const unreadByOrder = messages.reduce<Record<string, number>>((acc, m) => {
    if (m.senderRole === "technician" && !m.readAt) {
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
