"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface LabPanelComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  /** Extra classes for the trigger button (to match host form inputs). */
  inputClassName?: string;
}

/**
 * Searchable combobox for lab test panel selection (CBC, CMP, Lipid,
 * Urinalysis, …). Type to filter; click or Enter to select.
 */
export function LabPanelCombobox({
  value, onChange, options, placeholder = "Search lab panels…", className, inputClassName,
}: LabPanelComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const filtered = query.trim()
    ? options.filter(o => o.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  const select = (option: string) => {
    onChange(option);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          "w-full h-[50px] px-3.5 rounded-lg bg-white border border-outline-variant/60 text-sm text-left",
          "flex items-center justify-between gap-2",
          "focus:outline-none focus:ring-2 focus:ring-laboratory-rose focus:border-transparent transition-colors",
          !value && "text-on-surface-variant/50",
          inputClassName
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown className={cn("h-4 w-4 text-on-surface-variant shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white rounded-lg border border-outline-variant/50 shadow-card-lg overflow-hidden">
          <div className="relative border-b border-outline-variant/30">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-on-surface-variant" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && filtered.length > 0) { e.preventDefault(); select(filtered[0]); }
                if (e.key === "Escape") setOpen(false);
              }}
              placeholder="Type to filter panels…"
              className="w-full h-10 pl-9 pr-3 text-sm bg-transparent focus:outline-none"
            />
          </div>
          <ul role="listbox" className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-xs text-on-surface-variant">No matching panels.</li>
            ) : (
              filtered.map(option => (
                <li key={option}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={option === value}
                    onClick={() => select(option)}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-left transition-colors",
                      option === value
                        ? "bg-laboratory-rose/5 text-laboratory-rose font-semibold"
                        : "text-on-surface hover:bg-surface-container/60"
                    )}
                  >
                    <span className="truncate">{option}</span>
                    {option === value && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
