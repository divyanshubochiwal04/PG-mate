import type {
  MessConfigurationRow,
  MessInventoryItemRow,
  MessRow,
  ResidentMessSubscriptionRow,
} from '@m-square/database';
import type {
  MessConfigDto,
  MessDto,
  MessInventoryItemDto,
  MessSubscriptionDto,
} from '@m-square/contracts';

export function mapConfigRow(r: MessConfigurationRow): MessConfigDto {
  return {
    id: r.id,
    organizationId: r.organization_id,
    isEnabled: r.is_enabled,
    scopeType: r.scope_type,
    billingMode: r.billing_mode,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : '',
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : '',
  };
}

export function mapMessRow(r: MessRow): MessDto {
  return {
    id: r.id,
    organizationId: r.organization_id,
    name: r.name,
    code: r.code,
    scopeType: r.scope_type,
    isActive: r.is_active,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : '',
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : '',
  };
}

export function mapInventoryItemRow(r: MessInventoryItemRow): MessInventoryItemDto {
  return {
    id: r.id,
    organizationId: r.organization_id,
    messId: r.mess_id,
    name: r.name,
    category: r.category,
    unit: r.unit,
    currentStock: Number(r.current_stock),
    minimumStock: Number(r.minimum_stock),
    reorderLevel: Number(r.reorder_level),
    status: r.status,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : '',
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : '',
  };
}

export function mapSubscriptionRow(
  r: ResidentMessSubscriptionRow,
  extra?: { messName?: string; mealPlanName?: string }
): MessSubscriptionDto {
  return {
    id: r.id,
    organizationId: r.organization_id,
    residentId: r.resident_id,
    stayId: r.stay_id,
    messId: r.mess_id,
    mealPlanId: r.meal_plan_id,
    billingMode: r.billing_mode,
    priceAtSubscription: Number(r.price_at_subscription),
    status: r.status,
    startDate: r.start_date,
    endDate: r.end_date,
    messName: extra?.messName,
    mealPlanName: extra?.mealPlanName,
  };
}
