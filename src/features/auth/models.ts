export interface CurrentUser {
  id: string;
  phoneNumber: string;
  status: string;
}

export interface DeviceSession {
  id: string;
  deviceName: string | null;
  deviceType: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
}

export const isSessionActive = (s: DeviceSession) => s.revokedAt === null;

/* eslint-disable @typescript-eslint/no-explicit-any */
export const userFromJson = (j: any): CurrentUser => ({
  id: j.id,
  phoneNumber: j.phone_number,
  status: j.status,
});

export const sessionFromJson = (j: any): DeviceSession => ({
  id: j.id,
  deviceName: j.device_name ?? null,
  deviceType: j.device_type ?? null,
  ipAddress: j.ip_address ?? null,
  userAgent: j.user_agent ?? null,
  createdAt: new Date(j.created_at),
  lastUsedAt: j.last_used_at ? new Date(j.last_used_at) : null,
  revokedAt: j.revoked_at ? new Date(j.revoked_at) : null,
});
