"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type ServiceLine = "all" | "radiology" | "laboratory";

interface ServiceLineContextType {
  serviceLine: ServiceLine;
  setServiceLine: (line: ServiceLine) => void;
}

const ServiceLineContext = createContext<ServiceLineContextType | undefined>(undefined);

export function ServiceLineProvider({ children }: { children: React.ReactNode }) {
  const [serviceLine, setServiceLine] = useState<ServiceLine>("all");

  // Read initial service line from localStorage if available
  useEffect(() => {
    const saved = localStorage.getItem("service_line") as ServiceLine;
    if (saved && (saved === "all" || saved === "radiology" || saved === "laboratory")) {
      setServiceLine(saved);
    }
  }, []);

  const handleSetServiceLine = (line: ServiceLine) => {
    setServiceLine(line);
    localStorage.setItem("service_line", line);
  };

  return (
    <ServiceLineContext.Provider value={{ serviceLine, setServiceLine: handleSetServiceLine }}>
      {children}
    </ServiceLineContext.Provider>
  );
}

export function useServiceLine() {
  const context = useContext(ServiceLineContext);
  if (context === undefined) {
    throw new Error("useServiceLine must be used within a ServiceLineProvider");
  }
  return context;
}
