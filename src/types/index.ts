// Shared application types

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardStats {
  totalApplications: number;
  pendingReviews: number;
  activeAlerts: number;
  approvalRate: number;
  denialRate: number;
  avgReviewTime: number;
  recentActivity: AuditLogEntry[];
}

export interface AuditLogEntry {
  id: string;
  tableName: string;
  recordId: string;
  action: string;
  userId: string | null;
  userEmail: string | null;
  timestamp: Date;
  metadata: Record<string, unknown> | null;
}
