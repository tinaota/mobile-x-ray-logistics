"use client";

import { useState, useEffect, useRef } from "react";
import { LiveMap } from "@/components/domain/LiveMap";
import type { LiveMapMarker } from "@/components/domain/LiveMap";
import { PriorityBadge, OrderStatusBadge } from "@/components/ui/StatusBadge";
import { useOrders } from "@/lib/hooks/useOrders";
import { useMessages, useAllMessages } from "@/lib/hooks/useMessages";
import { cn } from "@/lib/utils";
import { Send, Plus, CheckCheck, MessageCircle } from "lucide-react";

const QUICK_CHIPS = ["REQUEST ETA", "REROUTE SENT", "EN ROUTE?", "NOTIFY FACILITY", "CALL TECH"];

const MAP_MARKERS: LiveMapMarker[] = [
  { id: "hub", lng: -112.074, lat: 33.4484, type: "hub",        label: "Dispatch HQ" },
  { id: "t1",  lng: -112.052, lat: 33.462,  type: "technician", label: "T. Parker",  status: "En Route" },
  { id: "t2",  lng: -112.089, lat: 33.441,  type: "technician", label: "A. Lopez",   status: "On Scene" },
  { id: "t3",  lng: -112.031, lat: 33.478,  type: "technician", label: "M. Rivera",  status: "Standby" },
  { id: "o1",  lng: -112.063, lat: 33.455,  type: "order",      label: "STAT Order", priority: "stat" },
  { id: "o2",  lng: -112.101, lat: 33.433,  type: "order",      label: "Urgent",     priority: "urgent" },
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export default function MessagesPage() {
  const { orders } = useOrders();
  const { unreadByOrder, lastByOrder } = useAllMessages();

  const activeOrders = orders.filter(o => o.status !== "complete" && o.status !== "billed");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const selectedOrder = orders.find(o => o.id === selectedId) ?? null;
  const { messages, sendMessage, markRead } = useMessages(selectedId);

  useEffect(() => {
    if (!selectedId && activeOrders.length > 0) setSelectedId(activeOrders[0].id);
  }, [activeOrders, selectedId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Viewing a conversation clears its inbound unread badge
  useEffect(() => {
    if (messages.some(m => m.senderRole !== "dispatcher" && !m.readAt)) markRead("dispatcher");
  }, [messages, markRead]);

  const handleSend = async () => {
    if (!input.trim()) return;
    await sendMessage(input);
    setInput("");
  };

  return (
    // Break out of NavShell's p-6; fill height below TopNav (h-16 = 4rem)
    <div className="-m-6 h-[calc(100vh-4rem)] flex overflow-hidden">

      {/* ── Conversation list ── */}
      <div className="w-72 shrink-0 min-w-0 bg-white border-r border-outline-variant flex flex-col">
        <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-lowest shrink-0">
          <h2 className="text-xs font-label font-semibold uppercase tracking-wider text-on-surface-variant">
            Active Threads · {activeOrders.length}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-outline-variant/30">
          {activeOrders.map(order => {
            const unread    = unreadByOrder[order.id] ?? 0;
            const last      = lastByOrder[order.id];
            const isSelected = selectedId === order.id;

            return (
              <button
                key={order.id}
                onClick={() => setSelectedId(order.id)}
                className={cn(
                  "w-full text-left px-4 py-3 transition-colors border-l-2",
                  isSelected
                    ? "bg-medical-blue/10 border-medical-blue"
                    : "border-transparent hover:bg-surface-container-lowest"
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-on-surface truncate">{order.id}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {unread > 0 && (
                      <span className="h-4 min-w-[1rem] px-1 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center">
                        {unread}
                      </span>
                    )}
                    <PriorityBadge priority={order.priority} size="sm" animate={order.priority === "stat"} />
                  </div>
                </div>
                <p className="text-sm font-semibold text-on-surface truncate">{order.patientName}</p>
                <p className="text-xs text-on-surface-variant truncate">{order.facilityName}</p>
                {last && (
                  <p className="text-xs text-slate-gray truncate mt-1 italic">
                    {last.senderRole === "technician" ? `${last.senderName}: ` : "You: "}
                    {last.content}
                  </p>
                )}
              </button>
            );
          })}
          {activeOrders.length === 0 && (
            <p className="p-6 text-sm text-on-surface-variant text-center">No active orders</p>
          )}
        </div>
      </div>

      {/* ── Chat panel ── */}
      <div className="w-[420px] shrink-0 min-w-0 bg-white border-r border-outline-variant flex flex-col">
        {selectedOrder ? (
          <>
            {/* Order header */}
            <div className="px-4 py-3 bg-midnight-navy text-white border-b border-white/10 shrink-0">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold">{selectedOrder.id}</span>
                  <OrderStatusBadge status={selectedOrder.status} size="sm" />
                </div>
                <PriorityBadge priority={selectedOrder.priority} size="sm" animate={selectedOrder.priority === "stat"} />
              </div>
              <p className="text-sm font-semibold text-white truncate">{selectedOrder.patientName}</p>
              <p className="text-xs text-white/60 truncate">{selectedOrder.facilityName}</p>
              {selectedOrder.assignedTech && (
                <p className="text-xs text-medical-blue mt-0.5">{selectedOrder.assignedTech} · {selectedOrder.procedure}</p>
              )}
            </div>

            {/* Metadata ribbon */}
            <div className="flex border-b border-outline-variant bg-surface-container-lowest shrink-0">
              <div className="flex-1 px-3 py-2 border-r border-outline-variant">
                <p className="text-xs font-label font-semibold uppercase tracking-wider text-on-surface-variant mb-0.5">Priority</p>
                <div className="flex items-center gap-1.5">
                  <span className={cn("w-2 h-2 rounded-full shrink-0",
                    selectedOrder.priority === "stat"   ? "bg-emergency-red animate-pulse" :
                    selectedOrder.priority === "urgent" ? "bg-warning-amber" : "bg-medical-blue"
                  )} />
                  <span className="text-xs font-semibold text-on-surface capitalize">{selectedOrder.priority}</span>
                </div>
              </div>
              <div className="flex-1 px-3 py-2">
                <p className="text-xs font-label font-semibold uppercase tracking-wider text-on-surface-variant mb-0.5">Scheduled</p>
                <span className="font-mono text-xs font-semibold text-on-surface">{selectedOrder.scheduledTime}</span>
              </div>
            </div>

            {/* Messages thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-ghost-white/40" style={{ scrollbarWidth: "thin" }}>
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-on-surface-variant">
                  <MessageCircle className="h-8 w-8 opacity-30" />
                  <p className="text-sm">No messages yet. Start the conversation.</p>
                </div>
              )}

              {messages.map((msg, i) => {
                const isDispatcher = msg.senderRole === "dispatcher";
                const prevMsg      = messages[i - 1];
                const showDate     = !prevMsg ||
                  new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();

                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="flex items-center gap-3 my-2">
                        <div className="h-px flex-1 bg-outline-variant/50" />
                        <span className="text-xs font-label font-semibold uppercase tracking-widest text-on-surface-variant">
                          {new Date(msg.createdAt).toDateString() === new Date().toDateString()
                            ? "Today"
                            : new Date(msg.createdAt).toLocaleDateString()}
                        </span>
                        <div className="h-px flex-1 bg-outline-variant/50" />
                      </div>
                    )}

                    <div className={cn("flex flex-col", isDispatcher ? "items-start" : "items-end")}>
                      <div className="flex items-center gap-2 mb-1 px-1">
                        {isDispatcher ? (
                          <>
                            <span className="text-xs font-label font-semibold uppercase tracking-wide text-midnight-navy">{msg.senderName}</span>
                            <span className="text-[9px] text-on-surface-variant">{formatTime(msg.createdAt)}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-[9px] text-on-surface-variant">{formatTime(msg.createdAt)}</span>
                            <span className="text-xs font-label font-semibold uppercase tracking-wide text-medical-blue">{msg.senderName}</span>
                          </>
                        )}
                      </div>

                      <div className={cn(
                        "max-w-[88%] px-3 py-2.5 text-sm leading-relaxed shadow-sm break-words",
                        isDispatcher
                          ? "bg-white border border-outline-variant rounded-2xl rounded-tl-none text-on-surface"
                          : "bg-midnight-navy text-white rounded-2xl rounded-tr-none"
                      )}>
                        {msg.content}
                      </div>

                      {!isDispatcher && (
                        <div className="flex items-center gap-1 mt-1 px-1">
                          <CheckCheck className="h-3 w-3 text-medical-blue" />
                          <span className="text-[9px] text-on-surface-variant uppercase">
                            {msg.readAt ? `Read ${formatTime(msg.readAt)}` : "Delivered"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Quick chips */}
            <div
              className="px-3 py-2 bg-white border-t border-outline-variant flex gap-2 overflow-x-auto shrink-0"
              style={{ scrollbarWidth: "none" }}
            >
              {QUICK_CHIPS.map(chip => (
                <button
                  key={chip}
                  onClick={() => setInput(chip)}
                  className="px-3 py-1.5 shrink-0 bg-ghost-white border border-outline-variant rounded-full text-[11px] font-label font-semibold text-midnight-navy whitespace-nowrap hover:bg-medical-blue/10 hover:border-medical-blue/40 transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input bar */}
            <div className="px-4 py-3 bg-white border-t border-outline-variant shrink-0">
              <div className="flex items-center gap-2">
                <button className="text-on-surface-variant hover:text-medical-blue transition-colors shrink-0">
                  <Plus className="h-5 w-5" />
                </button>
                <div className="relative flex-1 min-w-0">
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                    placeholder={
                      selectedOrder.assignedTech
                        ? `Message ${selectedOrder.assignedTech}…`
                        : "Send a message…"
                    }
                    className="w-full bg-ghost-white border border-outline-variant rounded-xl py-2.5 px-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-medical-blue focus:bg-white transition-all placeholder:text-on-surface-variant/60"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-medical-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none shadow-sm"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 text-on-surface-variant">
            <MessageCircle className="h-10 w-10 opacity-20" />
            <p className="text-sm">Select an order to start messaging</p>
          </div>
        )}
      </div>

      {/* ── Live map ── */}
      {/* LiveMap's CardHeader is ~3.5rem tall; map height fills the rest of the column */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <LiveMap
          markers={MAP_MARKERS}
          showLegend
          height="h-[calc(100vh-7.5rem)]"
          className="border-0 rounded-none shadow-none"
        />
      </div>
    </div>
  );
}
