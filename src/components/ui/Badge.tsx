import React from 'react';
import { cn } from '../../utils/helpers';

interface BadgeProps {
  className?: string;
  children: React.ReactNode;
  dot?: boolean;
}

export function Badge({ className, children, dot }: BadgeProps) {
  return (
    <span className={cn('badge', className)}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
      {children}
    </span>
  );
}

interface StatusBadgeProps {
  status: string | null | undefined;
  active?: boolean;
}

export function PatientStatusBadge({ status, active }: StatusBadgeProps) {
  if (active || !status) {
    return (
      <Badge className="badge-active" dot>
        Aktif
      </Badge>
    );
  }

  switch (status) {
    case 'recovered':
      return <Badge className="badge-recovered">✓ Sembuh</Badge>;
    case 'deceased':
      return <Badge className="badge-deceased">✕ Meninggal</Badge>;
    case 'self_discharge':
      return <Badge className="badge-self-discharge">↩ Pulang APS</Badge>;
    default:
      return <Badge className="badge-active">{status}</Badge>;
  }
}

export function BedStatusBadge({ isOccupied }: { isOccupied: boolean }) {
  return isOccupied ? (
    <Badge className="badge-occupied">Terisi</Badge>
  ) : (
    <Badge className="badge-available" dot>
      Tersedia
    </Badge>
  );
}
