import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KyselyMessRepository, KyselyUnitOfWork } from '@m-square/database';
import { MessService } from '../modules/mess/mess.service';
import { MessInventoryService } from '../modules/mess/mess-inventory.service';

describe('Mess Domain Unit Tests', () => {
  let service: MessService;
  let messRepo: KyselyMessRepository;
  let unitOfWork: KyselyUnitOfWork;

  const mockOrgId = '11111111-1111-1111-1111-111111111111';
  const mockMessId = '22222222-2222-2222-2222-222222222222';
  const mockStayId = '33333333-3333-3333-3333-333333333333';
  const mockPlanId = '44444444-4444-4444-4444-444444444444';
  const mockItemId = '55555555-5555-5555-5555-555555555555';
  const mockVendorId = '66666666-6666-6666-6666-666666666666';
  const mockProcId = '77777777-7777-7777-7777-777777777777';

  beforeEach(() => {
    const dummyDb = {} as unknown;
    messRepo = new KyselyMessRepository(dummyDb as never);
    unitOfWork = new KyselyUnitOfWork(dummyDb as never);

    vi.spyOn(unitOfWork, 'runInTransaction').mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (work: any) => work(dummyDb)
    );

    service = new MessService();
    const inventoryService = new MessInventoryService(messRepo, unitOfWork);
    (service as unknown as Record<string, unknown>)['messRepo'] = messRepo;
    (service as unknown as Record<string, unknown>)['unitOfWork'] = unitOfWork;
    (service as unknown as Record<string, unknown>)['messInventoryService'] = inventoryService;
  });

  it('should instantiate MessInventoryService and MessService cleanly without DI errors', () => {
    const invService = new MessInventoryService();
    const messService = new MessService();
    expect(invService).toBeDefined();
    expect(messService).toBeDefined();
  });

  it('should retrieve or initialize mess configuration', async () => {
    vi.spyOn(messRepo, 'getConfig').mockResolvedValueOnce(null);
    vi.spyOn(messRepo, 'upsertConfig').mockResolvedValueOnce({
      id: 'cfg-1',
      organization_id: mockOrgId,
      is_enabled: true,
      scope_type: 'CENTRAL',
      billing_mode: 'MONTHLY',
      created_at: new Date(),
      updated_at: new Date(),
    });

    const res = await service.getConfig(mockOrgId);
    expect(res.isEnabled).toBe(true);
    expect(res.scopeType).toBe('CENTRAL');
  });

  it('should create mess facility and configure meal plans', async () => {
    vi.spyOn(messRepo, 'createMess').mockResolvedValueOnce({
      id: mockMessId,
      organization_id: mockOrgId,
      name: 'Central Dining Hall',
      code: 'MESS-01',
      scope_type: 'CENTRAL',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const mess = await service.createMess(mockOrgId, {
      name: 'Central Dining Hall',
      code: 'MESS-01',
    });
    expect(mess.id).toBe(mockMessId);
    expect(mess.name).toBe('Central Dining Hall');

    vi.spyOn(messRepo, 'createMealPlan').mockResolvedValueOnce({
      id: mockPlanId,
      organization_id: mockOrgId,
      mess_id: mockMessId,
      name: 'Full Monthly Plan',
      description: 'All 3 meals included',
      billing_mode: 'MONTHLY',
      price: 3000 as never,
      included_meal_types: 'ALL',
      version: 1,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const plan = await service.createMealPlan(mockOrgId, {
      messId: mockMessId,
      name: 'Full Monthly Plan',
      billingMode: 'MONTHLY',
      price: 3000,
    });
    expect(plan.price).toBe(3000);
    expect(plan.billingMode).toBe('MONTHLY');
  });

  it('should record consumption and query today metrics', async () => {
    vi.spyOn(messRepo, 'findSubscriptionById').mockResolvedValueOnce({
      id: 'sub-1',
      organization_id: mockOrgId,
      resident_id: 'res-1',
      stay_id: mockStayId,
      mess_id: mockMessId,
      meal_plan_id: 'plan-1',
      billing_mode: 'MONTHLY',
      price_at_subscription: 3000 as never,
      status: 'ACTIVE',
      start_date: '2026-08-01',
      end_date: null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    vi.spyOn(messRepo, 'recordConsumption').mockResolvedValueOnce({
      id: 'cons-1',
      organization_id: mockOrgId,
      subscription_id: 'sub-1',
      resident_id: 'res-1',
      stay_id: mockStayId,
      mess_id: mockMessId,
      meal_type_id: 'mt-1',
      consumption_date: '2026-08-12',
      status: 'CONSUMED',
      notes: null,
      created_at: new Date(),
    });

    const cons = await service.recordConsumption(mockOrgId, {
      subscriptionId: 'sub-1',
      residentId: 'res-1',
      stayId: mockStayId,
      messId: mockMessId,
      mealTypeId: 'mt-1',
    });

    expect(cons.status).toBe('CONSUMED');

    vi.spyOn(messRepo, 'getTodayConsumptionMetrics').mockResolvedValueOnce({
      expected: 50,
      consumed: 35,
      skipped: 5,
    });
    const metrics = await service.getTodayMetrics(mockOrgId, mockMessId, '2026-08-12');
    expect(metrics.expected).toBe(50);
    expect(metrics.consumed).toBe(35);
  });

  it('should manage kitchen stock balance and prevent negative stock adjustment', async () => {
    const inventoryService = new MessInventoryService(messRepo, unitOfWork);
    vi.spyOn(messRepo, 'findInventoryItemByIdForUpdate').mockResolvedValueOnce({
      id: mockItemId,
      organization_id: mockOrgId,
      mess_id: mockMessId,
      name: 'Basmati Rice',
      category: 'GRAINS',
      unit: 'kg',
      current_stock: 10 as never,
      minimum_stock: 5 as never,
      reorder_level: 15 as never,
      status: 'LOW_STOCK',
      created_at: new Date(),
      updated_at: new Date(),
    });

    await expect(
      inventoryService.recordInventoryAdjustment(mockOrgId, {
        messId: mockMessId,
        inventoryItemId: mockItemId,
        transactionType: 'WASTAGE',
        quantity: 25,
      })
    ).rejects.toThrow('Insufficient stock balance');
  });

  it('should atomically process procurement and auto-update stock balance', async () => {
    const inventoryService = new MessInventoryService(messRepo, unitOfWork);
    vi.spyOn(messRepo, 'findVendorById').mockResolvedValueOnce({
      id: mockVendorId,
      organization_id: mockOrgId,
      name: 'Vendor A',
      status: 'ACTIVE',
    } as any);
    vi.spyOn(messRepo, 'findProcurementByInvoiceReference').mockResolvedValueOnce(null);
    vi.spyOn(messRepo, 'createProcurement').mockResolvedValueOnce({
      id: mockProcId,
      organization_id: mockOrgId,
      mess_id: mockMessId,
      vendor_id: mockVendorId,
      purchase_date: '2026-08-12',
      invoice_reference: 'INV-1001',
      total_amount: 2500 as never,
      notes: null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    vi.spyOn(messRepo, 'findInventoryItemByIdForUpdate').mockResolvedValueOnce({
      id: mockItemId,
      organization_id: mockOrgId,
      mess_id: mockMessId,
      name: 'Sunflower Oil',
      category: 'OILS',
      unit: 'litre',
      current_stock: 5 as never,
      minimum_stock: 10 as never,
      reorder_level: 15 as never,
      status: 'LOW_STOCK',
      created_at: new Date(),
      updated_at: new Date(),
    });

    vi.spyOn(messRepo, 'updateItemStock').mockResolvedValueOnce(undefined);
    vi.spyOn(messRepo, 'recordInventoryTransaction').mockResolvedValueOnce({
      id: 'tx-1',
      organization_id: mockOrgId,
      mess_id: mockMessId,
      inventory_item_id: mockItemId,
      transaction_type: 'PURCHASE',
      quantity: 20 as never,
      stock_before: 5 as never,
      stock_after: 25 as never,
      unit: 'litre',
      procurement_id: mockProcId,
      notes: `Procurement #${mockProcId}`,
      created_at: new Date(),
    });

    const proc = await inventoryService.createProcurement(mockOrgId, {
      messId: mockMessId,
      vendorId: mockVendorId,
      items: [{ inventoryItemId: mockItemId, quantity: 20, unitPrice: 125 }],
    });

    expect(proc.totalAmount).toBe(2500);
    expect(messRepo.updateItemStock).toHaveBeenCalledWith(
      mockItemId,
      mockOrgId,
      25,
      'IN_STOCK',
      expect.anything()
    );
  });
});
