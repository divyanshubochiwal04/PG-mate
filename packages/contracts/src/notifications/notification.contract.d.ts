export type NotificationType = 'OUTSTANDING_DUES' | 'OVERDUE_INVOICE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'NO_STAY' | 'UPCOMING_CHECKOUT' | 'HIGH_OCCUPANCY' | 'PAYMENT_RECEIVED' | 'RESIDENT_CHECKED_IN' | 'RESIDENT_TRANSFERRED' | 'RESIDENT_CHECKED_OUT' | 'PROCUREMENT_RECORDED' | 'EXPENSE_RECORDED' | 'SYSTEM';
export type NotificationSeverity = 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
export type NotificationStatus = 'UNREAD' | 'READ' | 'RESOLVED' | 'DISMISSED';
export type NotificationEntityType = 'RESIDENT' | 'INVOICE' | 'PAYMENT' | 'INVENTORY_ITEM' | 'STAY' | 'BUILDING' | 'PROCUREMENT' | 'EXPENSE' | 'SYSTEM';
export interface NotificationDto {
    id: string;
    type: NotificationType;
    severity: NotificationSeverity;
    status: NotificationStatus;
    title: string;
    message: string;
    entityType?: string | null;
    entityId?: string | null;
    actionRoute?: string | null;
    metadata?: Record<string, any> | null;
    createdAt: string;
    readAt?: string | null;
    resolvedAt?: string | null;
    expiresAt?: string | null;
}
export interface NotificationListResponseDto {
    data: NotificationDto[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    unreadCount: number;
}
export interface NotificationSummaryDto {
    totalCount: number;
    unreadCount: number;
    criticalCount: number;
    warningCount: number;
}
export interface NotificationQueryDto {
    type?: NotificationType;
    severity?: NotificationSeverity;
    status?: NotificationStatus;
    search?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    pageSize?: number;
}
export interface CreateNotificationDto {
    type: NotificationType;
    severity?: NotificationSeverity;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
    actionRoute?: string;
    metadata?: Record<string, any>;
    dedupeKey?: string;
}
export interface MarkNotificationReadDto {
    notificationIds?: string[];
}
export interface ResolveNotificationDto {
    notes?: string;
}
//# sourceMappingURL=notification.contract.d.ts.map