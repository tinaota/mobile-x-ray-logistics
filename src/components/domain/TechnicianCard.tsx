import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { SyncStatusBadge } from "@/components/ui/StatusBadge";
import type { Technician } from "@/lib/utils";
import { MapPin, Battery, Wifi, Zap, Droplet } from "lucide-react";

interface TechnicianCardProps {
  tech: Technician;
  onSelect?: (tech: Technician) => void;
  className?: string;
}

export function TechnicianCard({ tech, onSelect, className }: TechnicianCardProps) {
  const batteryColor =
    (tech.batteryLevel ?? 100) > 50 ? "text-green-600"
    : (tech.batteryLevel ?? 100) > 20 ? "text-warning-amber"
    : "text-emergency-red";

  return (
    <Card
      className={cn("hover:shadow-card-md transition-shadow", onSelect && "cursor-pointer", className)}
      onClick={() => onSelect?.(tech)}
    >
      <CardContent className="flex items-start gap-3 py-4">
        <Avatar
          initials={tech.initials}
          status={tech.online ? "online" : "offline"}
          size="md"
        />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-on-surface">{tech.name}</p>
              <p className="text-xs code-mono text-on-surface-variant">{tech.licenseNumber}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={cn(
                "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-mono text-[9px] font-bold uppercase tracking-wider border",
                tech.discipline === "phlebotomy"
                  ? "bg-laboratory-rose/10 text-laboratory-rose border-laboratory-rose/20"
                  : tech.discipline === "dual"
                    ? "bg-surface-container-high text-on-surface-variant border-outline-variant/40"
                    : "bg-radiology-indigo/10 text-radiology-indigo border-radiology-indigo/20"
              )}>
                {tech.discipline === "phlebotomy" ? <Droplet className="h-2.5 w-2.5" /> : <Zap className="h-2.5 w-2.5" />}
                {tech.discipline}
              </span>
              <SyncStatusBadge status={tech.syncStatus} />
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-on-surface-variant">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {tech.zone}
            </span>
            {tech.batteryLevel !== undefined && (
              <span className={cn("flex items-center gap-1", batteryColor)}>
                <Battery className="h-3 w-3" />
                {tech.batteryLevel}%
              </span>
            )}
            {tech.lastSeen && (
              <span className="flex items-center gap-1">
                <Wifi className="h-3 w-3" />
                {tech.lastSeen}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="pending" size="sm">{tech.activeOrders} Active</Badge>
            <Badge variant="success" size="sm">{tech.completedToday} Done</Badge>
            {tech.credentialExpiry && (
              <Badge variant="default" size="sm">Exp {tech.credentialExpiry}</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
