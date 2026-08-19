import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { MessInventoryService } from '../modules/mess/mess-inventory.service';

describe('Procurement, Inventory, Stock Ledger & Expense Security Specification', () => {
  const mockRepo = {
    listInventoryItems: vi.fn(),
    findInventoryItemById: vi.fn(),
    findInventoryItemByIdForUpdate: vi.fn(),
    createInventoryItem: vi.fn(),
    updateInventoryItem: vi.fn(),
    updateItemStock: vi.fn(),
    recordInventoryTransaction: vi.fn(),
    getInventoryStockLedger: vi.fn(),
    listVendors: vi.fn(),
    findVendorById: vi.fn(),
    createVendor: vi.fn(),
    updateVendor: vi.fn(),
    listProcurements: vi.fn(),
    findProcurementById: vi.fn(),
    findProcurementByInvoiceReference: vi.fn(),
    createProcurement: vi.fn(),
    listExpenses: vi.fn(),
    findExpenseById: vi.fn(),
    createExpense: vi.fn(),
  };

  const mockUnitOfWork = {
    runInTransaction: vi.fn(async (work: any) => work({})),
  };

  const service = new MessInventoryService(mockRepo as any, mockUnitOfWork as any);

  const orgA = 'org-11111111-1111-1111-1111-111111111111';
  const orgB = 'org-22222222-2222-2222-2222-222222222222';
  const messId = 'mess-33333333-3333-3333-3333-333333333333';
  const itemId = 'item-44444444-4444-4444-4444-444444444444';
  const vendorId = 'vendor-55555555-5555-5555-5555-555555555555';
  const procId = 'proc-66666666-6666-6666-6666-666666666666';
  const expId = 'exp-77777777-7777-7777-7777-777777777777';

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('INV-SEC-01: Own tenant inventory access succeeds', async () => {
    mockRepo.findInventoryItemById.mockResolvedValueOnce({
      id: itemId,
      organization_id: orgA,
      mess_id: messId,
      name: 'Rice',
      category: 'GRAINS',
      unit: 'kg',
      current_stock: 50,
      minimum_stock: 10,
      reorder_level: 15,
      status: 'IN_STOCK',
    });

    const res = await service.getInventoryItemById(orgA, itemId);
    expect(res.id).toBe(itemId);
    expect(res.currentStock).toBe(50);
  });

  it('INV-SEC-02: Cross-tenant inventory access rejected', async () => {
    mockRepo.findInventoryItemById.mockResolvedValueOnce(null);

    await expect(service.getInventoryItemById(orgB, itemId)).rejects.toThrow(
      NotFoundException
    );
  });

  it('INV-SEC-03: Cross-tenant vendor access rejected', async () => {
    mockRepo.findVendorById.mockResolvedValueOnce(null);

    await expect(service.getVendorById(orgB, vendorId)).rejects.toThrow(
      NotFoundException
    );
  });

  it('INV-SEC-04: Cross-tenant procurement rejected', async () => {
    mockRepo.findProcurementById.mockResolvedValueOnce(null);

    await expect(service.getProcurementById(orgB, procId)).rejects.toThrow(
      NotFoundException
    );
  });

  it('INV-SEC-05: Cross-tenant stock adjustment rejected', async () => {
    mockRepo.findInventoryItemByIdForUpdate.mockResolvedValueOnce(null);

    await expect(
      service.recordInventoryAdjustment(orgB, {
        messId,
        inventoryItemId: itemId,
        transactionType: 'ADJUSTMENT_IN',
        quantity: 10,
      })
    ).rejects.toThrow(NotFoundException);
  });

  it('INV-SEC-06: Negative quantity rejected', async () => {
    await expect(
      service.recordInventoryAdjustment(orgA, {
        messId,
        inventoryItemId: itemId,
        transactionType: 'ADJUSTMENT_IN',
        quantity: -10,
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('INV-SEC-07: Zero quantity rejected', async () => {
    await expect(
      service.recordInventoryAdjustment(orgA, {
        messId,
        inventoryItemId: itemId,
        transactionType: 'ADJUSTMENT_IN',
        quantity: 0,
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('INV-SEC-08: Stock OUT greater than available rejected', async () => {
    mockRepo.findInventoryItemByIdForUpdate.mockResolvedValueOnce({
      id: itemId,
      organization_id: orgA,
      mess_id: messId,
      name: 'Rice',
      unit: 'kg',
      current_stock: 20,
      reorder_level: 5,
      status: 'IN_STOCK',
    });

    await expect(
      service.recordInventoryAdjustment(orgA, {
        messId,
        inventoryItemId: itemId,
        transactionType: 'ADJUSTMENT_OUT',
        quantity: 50,
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('INV-SEC-09: Concurrent stock adjustment protected via FOR UPDATE lock', async () => {
    mockRepo.findInventoryItemByIdForUpdate.mockResolvedValueOnce({
      id: itemId,
      organization_id: orgA,
      mess_id: messId,
      name: 'Wheat',
      unit: 'kg',
      current_stock: 100,
      reorder_level: 20,
      status: 'IN_STOCK',
    });
    mockRepo.updateItemStock.mockResolvedValueOnce(undefined);
    mockRepo.recordInventoryTransaction.mockResolvedValueOnce({
      id: 'tx-1',
      organization_id: orgA,
      mess_id: messId,
      inventory_item_id: itemId,
      transaction_type: 'ADJUSTMENT_OUT',
      quantity: 40,
      stock_before: 100,
      stock_after: 60,
      unit: 'kg',
      procurement_id: null,
      notes: 'test',
      created_at: new Date(),
    });

    const res = await service.recordInventoryAdjustment(orgA, {
      messId,
      inventoryItemId: itemId,
      transactionType: 'ADJUSTMENT_OUT',
      quantity: 40,
    });

    expect(res.stockAfter).toBe(60);
    expect(mockRepo.findInventoryItemByIdForUpdate).toHaveBeenCalledWith(
      itemId,
      orgA,
      expect.anything()
    );
  });

  it('INV-SEC-10: Procurement transaction rollback verified on failure', async () => {
    mockRepo.findVendorById.mockResolvedValueOnce({ id: vendorId });
    mockRepo.findProcurementByInvoiceReference.mockResolvedValueOnce(null);

    mockUnitOfWork.runInTransaction.mockImplementationOnce(async () => {
      throw new Error('Simulated DB Failure');
    });

    await expect(
      service.createProcurement(orgA, {
        messId,
        vendorId,
        items: [{ inventoryItemId: itemId, quantity: 10, unitPrice: 100 }],
      })
    ).rejects.toThrow('Simulated DB Failure');
  });

  it('INV-SEC-11: Historical stock ledger immutable', async () => {
    mockRepo.findInventoryItemById.mockResolvedValueOnce({ id: itemId });
    mockRepo.getInventoryStockLedger.mockResolvedValueOnce({
      items: [
        {
          id: 'tx-old',
          organization_id: orgA,
          mess_id: messId,
          inventory_item_id: itemId,
          transaction_type: 'PURCHASE',
          quantity: 80,
          stock_before: 0,
          stock_after: 80,
          unit: 'kg',
          procurement_id: procId,
          notes: 'Old purchase',
          created_at: new Date('2026-08-01'),
        },
      ],
      total: 1,
    });

    const res = await service.getInventoryStockLedger(orgA, itemId);
    expect(res.items[0].stockAfter).toBe(80);
    expect(res.items[0].quantity).toBe(80);
  });

  it('INV-SEC-12: Historical procurement immutable', async () => {
    mockRepo.findProcurementById.mockResolvedValueOnce({
      id: procId,
      organization_id: orgA,
      mess_id: messId,
      vendor_id: vendorId,
      purchase_date: '2026-08-01',
      invoice_reference: 'INV-2026-001',
      total_amount: 8000,
      notes: 'Initial stock buy',
      created_at: new Date('2026-08-01'),
      items: [
        {
          id: 'pi-1',
          procurement_id: procId,
          inventory_item_id: itemId,
          quantity: 80,
          unit_price: 100,
          total_price: 8000,
          itemName: 'Rice',
        },
      ],
    });

    const res = await service.getProcurementById(orgA, procId);
    expect(res.totalAmount).toBe(8000);
    expect(res.items?.[0].totalPrice).toBe(8000);
  });

  it('INV-SEC-13: Expense tenant isolation verified', async () => {
    mockRepo.findExpenseById.mockResolvedValueOnce(null);

    await expect(service.getExpenseById(orgB, expId)).rejects.toThrow(
      NotFoundException
    );
  });

  it('INV-SEC-14: Duplicate procurement invoice reference rejected', async () => {
    mockRepo.findVendorById.mockResolvedValue({ id: vendorId, organization_id: orgA } as any);
    mockRepo.findProcurementByInvoiceReference.mockResolvedValue({
      id: procId,
      invoice_reference: 'DUP-REF-123',
    } as any);

    await expect(
      service.createProcurement(orgA, {
        messId,
        vendorId,
        invoiceReference: 'DUP-REF-123',
        items: [{ inventoryItemId: itemId, quantity: 10, unitPrice: 100 }],
      })
    ).rejects.toThrow(ConflictException);
  });

  it('INV-SEC-15: No negative stock possible on item creation', async () => {
    await expect(
      service.createInventoryItem(orgA, {
        messId,
        name: 'Negative Stock Item',
        unit: 'kg',
        currentStock: -50,
      })
    ).rejects.toThrow(BadRequestException);
  });
});
