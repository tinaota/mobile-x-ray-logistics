import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { SyncStatusBadge } from "@/components/ui/StatusBadge";
import type { SyncStatus } from "@/lib/utils";
import { MapPin, Battery, Wifi } from "lucide-react";

export interface Technician {
  id: string;
  name: string;
  initials: string;
  licenseNumber: string;
  zone: string;
  activeOrders: number;
  completedToday: number;
  syncStatus: SyncStatus;
  batteryLevel?: number;
  lastSeen?: string;
  credentialExpiry?: string;
  online: boolean;
}

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
            <SyncStatusBadge status={tech.syncStatus} />
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
