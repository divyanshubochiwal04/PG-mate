import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { dbService, KyselyMessInventoryRepository, KyselyNotificationRepository, KyselyUnitOfWork } from '@m-square/database';
import type {
  MessExpenseCategory,
  MessExpenseDto,
  MessInventoryItemDto,
  MessInventoryStatus,
  MessInventoryTransactionDto,
  MessProcurementDto,
  MessVendorDto,
  MessVendorStatus,
} from '@m-square/contracts';

@Injectable()
export class MessInventoryService {
  private readonly repo: KyselyMessInventoryRepository;
  private readonly unitOfWork: KyselyUnitOfWork;
  private readonly notificationRepo: KyselyNotificationRepository;

  constructor(
    @Optional() repo?: KyselyMessInventoryRepository,
    @Optional() unitOfWork?: KyselyUnitOfWork
  ) {
    this.repo = repo ?? new KyselyMessInventoryRepository(dbService.db);
    this.unitOfWork = unitOfWork ?? new KyselyUnitOfWork(dbService.db);
    this.notificationRepo = new KyselyNotificationRepository(dbService.db);
  }

  // --- INVENTORY ITEMS ---

  public async listInventoryItems(
    organizationId: string,
    messId: string,
    page = 1,
    pageSize = 20,
    options?: {
      search?: string;
      category?: string;
      status?: MessInventoryStatus;
    }
  ): Promise<{ items: MessInventoryItemDto[]; total: number }> {
    const { items, total } = await this.repo.listInventoryItems(
      organizationId,
      messId,
      page,
      pageSize,
      options
    );
    return {
      items: items.map((r: any) => ({
        id: r.id,
        organizationId: r.organization_id,
        messId: r.mess_id,
        name: r.name,
        category: r.category,
        unit: r.unit,
        currentStock: Number(r.current_stock),
        minimumStock: Number(r.minimum_stock),
        reorderLevel: Number(r.reorder_level),
        status: r.status as MessInventoryStatus,
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : '',
        updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : '',
      })),
      total,
    };
  }

  public async getInventoryItemById(
    organizationId: string,
    id: string
  ): Promise<MessInventoryItemDto> {
    const item = await this.repo.findInventoryItemById(id, organizationId);
    if (!item) {
      throw new NotFoundException(`Inventory item ${id} not found`);
    }
    return {
      id: item.id,
      organizationId: item.organization_id,
      messId: item.mess_id,
      name: item.name,
      category: item.category,
      unit: item.unit,
      currentStock: Number(item.current_stock),
      minimumStock: Number(item.minimum_stock),
      reorderLevel: Number(item.reorder_level),
      status: item.status as MessInventoryStatus,
      createdAt: item.created_at ? new Date(item.created_at).toISOString() : '',
      updatedAt: item.updated_at ? new Date(item.updated_at).toISOString() : '',
    };
  }

  public async createInventoryItem(
    organizationId: string,
    dto: {
      messId: string;
      name: string;
      category?: string;
      unit: string;
      currentStock?: number;
      minimumStock?: number;
      reorderLevel?: number;
    }
  ): Promise<MessInventoryItemDto> {
    const stock = dto.currentStock || 0;
    if (stock < 0) {
      throw new BadRequestException('Current stock cannot be negative');
    }
    const reorderLevel = dto.reorderLevel || 0;
    const status: MessInventoryStatus =
      stock <= 0 ? 'OUT_OF_STOCK' : stock <= reorderLevel ? 'LOW_STOCK' : 'IN_STOCK';

    const created = await this.repo.createInventoryItem({
      organization_id: organizationId,
      mess_id: dto.messId,
      name: dto.name,
      category: dto.category || 'GENERAL',
      unit: dto.unit,
      current_stock: stock,
      minimum_stock: dto.minimumStock || 0,
      reorder_level: reorderLevel,
      status,
    });

    return {
      id: created.id,
      organizationId: created.organization_id,
      messId: created.mess_id,
      name: created.name,
      category: created.category,
      unit: created.unit,
      currentStock: Number(created.current_stock),
      minimumStock: Number(created.minimum_stock),
      reorderLevel: Number(created.reorder_level),
      status: created.status as MessInventoryStatus,
      createdAt: created.created_at ? new Date(created.created_at).toISOString() : '',
      updatedAt: created.updated_at ? new Date(created.updated_at).toISOString() : '',
    };
  }

  public async updateInventoryItem(
    organizationId: string,
    id: string,
    dto: {
      name?: string;
      category?: string;
      unit?: string;
      minimumStock?: number;
      reorderLevel?: number;
      status?: MessInventoryStatus;
    }
  ): Promise<MessInventoryItemDto> {
    const existing = await this.repo.findInventoryItemById(id, organizationId);
    if (!existing) {
      throw new NotFoundException(`Inventory item ${id} not found`);
    }

    const updated = await this.repo.updateInventoryItem(id, organizationId, {
      ...(dto.name && { name: dto.name }),
      ...(dto.category && { category: dto.category }),
      ...(dto.unit && { unit: dto.unit }),
      ...(dto.minimumStock !== undefined && { minimum_stock: dto.minimumStock }),
      ...(dto.reorderLevel !== undefined && { reorder_level: dto.reorderLevel }),
      ...(dto.status && { status: dto.status }),
    });

    return {
      id: updated.id,
      organizationId: updated.organization_id,
      messId: updated.mess_id,
      name: updated.name,
      category: updated.category,
      unit: updated.unit,
      currentStock: Number(updated.current_stock),
      minimumStock: Number(updated.minimum_stock),
      reorderLevel: Number(updated.reorder_level),
      status: updated.status as MessInventoryStatus,
      createdAt: updated.created_at ? new Date(updated.created_at).toISOString() : '',
      updatedAt: updated.updated_at ? new Date(updated.updated_at).toISOString() : '',
    };
  }

  // --- STOCK LEDGER & ADJUSTMENTS ---

  public async recordInventoryAdjustment(
    organizationId: string,
    dto: {
      messId: string;
      inventoryItemId: string;
      transactionType:
        | 'OPENING_STOCK'
        | 'PURCHASE'
        | 'ADJUSTMENT_IN'
        | 'ADJUSTMENT_OUT'
        | 'CONSUMPTION'
        | 'WASTAGE';
      quantity: number;
      notes?: string;
    }
  ): Promise<MessInventoryTransactionDto> {
    if (!dto.quantity || dto.quantity <= 0) {
      throw new BadRequestException('Adjustment quantity must be greater than 0');
    }

    return this.unitOfWork.runInTransaction(async (trx: any) => {
      const item = await this.repo.findInventoryItemByIdForUpdate(
        dto.inventoryItemId,
        organizationId,
        trx
      );
      if (!item) {
        throw new NotFoundException(`Inventory item ${dto.inventoryItemId} not found`);
      }

      const isIncrease = ['OPENING_STOCK', 'PURCHASE', 'ADJUSTMENT_IN'].includes(
        dto.transactionType
      );
      const stockBefore = Number(item.current_stock);
      const stockAfter = isIncrease ? stockBefore + dto.quantity : stockBefore - dto.quantity;
      if (stockAfter < 0) {
        throw new BadRequestException(
          `Insufficient stock balance. Current: ${stockBefore} ${item.unit}, Attempted reduction: ${dto.quantity} ${item.unit}`
        );
      }

      const reorderLevel = Number(item.reorder_level);
      const newStatus: MessInventoryStatus =
        stockAfter <= 0 ? 'OUT_OF_STOCK' : stockAfter <= reorderLevel ? 'LOW_STOCK' : 'IN_STOCK';

      await this.repo.updateItemStock(item.id, organizationId, stockAfter, newStatus, trx);
      const tx = await this.repo.recordInventoryTransaction(
        {
          organization_id: organizationId,
          mess_id: dto.messId,
          inventory_item_id: dto.inventoryItemId,
          transaction_type: dto.transactionType,
          quantity: dto.quantity,
          stock_before: stockBefore,
          stock_after: stockAfter,
          unit: item.unit,
          procurement_id: null,
          notes: dto.notes || `${dto.transactionType} adjustment`,
        },
        trx
      );
      return {
        id: tx.id,
        organizationId: tx.organization_id,
        messId: tx.mess_id,
        inventoryItemId: tx.inventory_item_id,
        transactionType: tx.transaction_type as MessInventoryTransactionDto['transactionType'],
        quantity: Number(tx.quantity),
        stockBefore: Number(tx.stock_before),
        stockAfter: Number(tx.stock_after),
        unit: tx.unit,
        notes: tx.notes,
        createdAt: tx.created_at ? new Date(tx.created_at).toISOString() : new Date().toISOString(),
      };
    });
  }

  public async getInventoryStockLedger(
    organizationId: string,
    inventoryItemId: string,
    page = 1,
    pageSize = 20
  ): Promise<{ items: MessInventoryTransactionDto[]; total: number }> {
    const item = await this.repo.findInventoryItemById(inventoryItemId, organizationId);
    if (!item) {
      throw new NotFoundException(`Inventory item ${inventoryItemId} not found`);
    }

    const { items, total } = await this.repo.getInventoryStockLedger(
      organizationId,
      inventoryItemId,
      page,
      pageSize
    );

    return {
      items: items.map((tx: any) => ({
        id: tx.id,
        organizationId: tx.organization_id,
        messId: tx.mess_id,
        inventoryItemId: tx.inventory_item_id,
        transactionType: tx.transaction_type as MessInventoryTransactionDto['transactionType'],
        quantity: Number(tx.quantity),
        stockBefore: Number(tx.stock_before),
        stockAfter: Number(tx.stock_after),
        unit: tx.unit,
        notes: tx.notes,
        createdAt: tx.created_at ? new Date(tx.created_at).toISOString() : new Date().toISOString(),
      })),
      total,
    };
  }

  // --- VENDORS ---

  public async listVendors(
    organizationId: string,
    page = 1,
    pageSize = 20,
    options?: {
      search?: string;
      status?: MessVendorStatus;
    }
  ): Promise<{ items: MessVendorDto[]; total: number }> {
    const { items, total } = await this.repo.listVendors(organizationId, page, pageSize, options);
    return {
      items: items.map((v: any) => ({
        id: v.id,
        organizationId: v.organization_id,
        name: v.name,
        phone: v.phone,
        email: v.email,
        address: v.address,
        status: v.status as MessVendorStatus,
        notes: v.notes,
        createdAt: v.created_at ? new Date(v.created_at).toISOString() : '',
      })),
      total,
    };
  }

  public async getVendorById(organizationId: string, id: string): Promise<MessVendorDto> {
    const v = await this.repo.findVendorById(id, organizationId);
    if (!v) {
      throw new NotFoundException(`Vendor ${id} not found`);
    }
    return {
      id: v.id,
      organizationId: v.organization_id,
      name: v.name,
      phone: v.phone,
      email: v.email,
      address: v.address,
      status: v.status as MessVendorStatus,
      notes: v.notes,
      createdAt: v.created_at ? new Date(v.created_at).toISOString() : '',
    };
  }

  public async createVendor(
    organizationId: string,
    dto: { name: string; phone?: string; email?: string; address?: string; notes?: string }
  ): Promise<MessVendorDto> {
    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('Vendor name is required');
    }
    const created = await this.repo.createVendor({
      organization_id: organizationId,
      name: dto.name.trim(),
      phone: dto.phone ? dto.phone.trim() : null,
      email: dto.email ? dto.email.trim() : null,
      address: dto.address ? dto.address.trim() : null,
      status: 'ACTIVE',
      notes: dto.notes ? dto.notes.trim() : null,
    });
    return {
      id: created.id,
      organizationId: created.organization_id,
      name: created.name,
      phone: created.phone,
      email: created.email,
      address: created.address,
      status: created.status as MessVendorStatus,
      notes: created.notes,
      createdAt: created.created_at ? new Date(created.created_at).toISOString() : '',
    };
  }

  public async updateVendor(
    organizationId: string,
    id: string,
    dto: {
      name?: string;
      phone?: string;
      email?: string;
      address?: string;
      status?: MessVendorStatus;
      notes?: string;
    }
  ): Promise<MessVendorDto> {
    const existing = await this.repo.findVendorById(id, organizationId);
    if (!existing) {
      throw new NotFoundException(`Vendor ${id} not found`);
    }

    const updated = await this.repo.updateVendor(id, organizationId, {
      ...(dto.name && { name: dto.name.trim() }),
      ...(dto.phone !== undefined && { phone: dto.phone ? dto.phone.trim() : null }),
      ...(dto.email !== undefined && { email: dto.email ? dto.email.trim() : null }),
      ...(dto.address !== undefined && { address: dto.address ? dto.address.trim() : null }),
      ...(dto.status && { status: dto.status }),
      ...(dto.notes !== undefined && { notes: dto.notes ? dto.notes.trim() : null }),
    });

    return {
      id: updated.id,
      organizationId: updated.organization_id,
      name: updated.name,
      phone: updated.phone,
      email: updated.email,
      address: updated.address,
      status: updated.status as MessVendorStatus,
      notes: updated.notes,
      createdAt: updated.created_at ? new Date(updated.created_at).toISOString() : '',
    };
  }

  // --- PROCUREMENTS ---

  public async listProcurements(
    organizationId: string,
    messId: string,
    page = 1,
    pageSize = 20,
    options?: {
      search?: string;
      vendorId?: string;
    }
  ): Promise<{ items: MessProcurementDto[]; total: number }> {
    const { items, total } = await this.repo.listProcurements(
      organizationId,
      messId,
      page,
      pageSize,
      options
    );
    return {
      items: items.map((p: any) => ({
        id: p.id,
        organizationId: p.organization_id,
        messId: p.mess_id,
        vendorId: p.vendor_id,
        purchaseDate: p.purchase_date,
        invoiceReference: p.invoice_reference,
        totalAmount: Number(p.total_amount),
        notes: p.notes,
        createdAt: p.created_at ? new Date(p.created_at).toISOString() : '',
      })),
      total,
    };
  }

  public async getProcurementById(
    organizationId: string,
    id: string
  ): Promise<MessProcurementDto> {
    const proc = await this.repo.findProcurementById(id, organizationId);
    if (!proc) {
      throw new NotFoundException(`Procurement ${id} not found`);
    }
    return {
      id: proc.id,
      organizationId: proc.organization_id,
      messId: proc.mess_id,
      vendorId: proc.vendor_id,
      purchaseDate: proc.purchase_date,
      invoiceReference: proc.invoice_reference,
      totalAmount: Number(proc.total_amount),
      notes: proc.notes,
      items: proc.items.map((i: any) => ({
        id: i.id,
        procurementId: i.procurement_id,
        inventoryItemId: i.inventory_item_id,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unit_price),
        totalPrice: Number(i.total_price),
      })),
      createdAt: proc.created_at ? new Date(proc.created_at).toISOString() : '',
    };
  }

  public async createProcurement(
    organizationId: string,
    dto: {
      messId: string;
      vendorId: string;
      purchaseDate?: string;
      invoiceReference?: string;
      notes?: string;
      items: { inventoryItemId: string; quantity: number; unitPrice: number }[];
    }
  ): Promise<MessProcurementDto> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Procurement must contain at least one item');
    }

    // Check vendor tenant ownership
    const vendor = await this.repo.findVendorById(dto.vendorId, organizationId);
    if (!vendor) {
      throw new NotFoundException(`Vendor ${dto.vendorId} not found`);
    }

    // Check duplicate invoice reference if provided
    if (dto.invoiceReference && dto.invoiceReference.trim()) {
      const existingProc = await this.repo.findProcurementByInvoiceReference(
        organizationId,
        dto.invoiceReference.trim()
      );
      if (existingProc) {
        throw new ConflictException(
          `Procurement with invoice reference '${dto.invoiceReference}' already exists`
        );
      }
    }

    return this.unitOfWork.runInTransaction(async (trx: any) => {
      let totalAmount = 0;
      const procurementItems = [];

      for (const itemInput of dto.items) {
        if (!itemInput.quantity || itemInput.quantity <= 0) {
          throw new BadRequestException('Item quantity must be greater than 0');
        }
        if (itemInput.unitPrice < 0) {
          throw new BadRequestException('Item unit price cannot be negative');
        }
        const totalPrice = itemInput.quantity * itemInput.unitPrice;
        totalAmount += totalPrice;
        procurementItems.push({
          inventory_item_id: itemInput.inventoryItemId,
          quantity: itemInput.quantity,
          unit_price: itemInput.unitPrice,
          total_price: totalPrice,
        });
      }

      const proc = await this.repo.createProcurement(
        {
          organization_id: organizationId,
          mess_id: dto.messId,
          vendor_id: dto.vendorId,
          purchase_date: dto.purchaseDate || new Date().toISOString().split('T')[0],
          invoice_reference: dto.invoiceReference ? dto.invoiceReference.trim() : null,
          total_amount: totalAmount,
          notes: dto.notes ? dto.notes.trim() : null,
        },
        procurementItems,
        trx
      );

      for (const itemInput of dto.items) {
        const invItem = await this.repo.findInventoryItemByIdForUpdate(
          itemInput.inventoryItemId,
          organizationId,
          trx
        );
        if (!invItem) {
          throw new NotFoundException(`Inventory item ${itemInput.inventoryItemId} not found`);
        }

        const stockBefore = Number(invItem.current_stock);
        const stockAfter = stockBefore + itemInput.quantity;
        const reorderLevel = Number(invItem.reorder_level);
        const newStatus: MessInventoryStatus =
          stockAfter <= 0 ? 'OUT_OF_STOCK' : stockAfter <= reorderLevel ? 'LOW_STOCK' : 'IN_STOCK';

        await this.repo.updateItemStock(
          invItem.id,
          organizationId,
          stockAfter,
          newStatus,
          trx
        );

        await this.repo.recordInventoryTransaction(
          {
            organization_id: organizationId,
            mess_id: dto.messId,
            inventory_item_id: invItem.id,
            transaction_type: 'PURCHASE',
            quantity: itemInput.quantity,
            stock_before: stockBefore,
            stock_after: stockAfter,
            unit: invItem.unit,
            procurement_id: proc.id,
            notes: `Procurement #${proc.invoice_reference || proc.id.slice(-6)}`,
          },
          trx
        );
      }

      await this.notificationRepo.createIfNotExists(
        organizationId,
        {
          type: 'PROCUREMENT_RECORDED',
          severity: 'INFO',
          title: 'Procurement Recorded',
          message: `Procurement of ₹${totalAmount.toLocaleString('en-IN')} recorded.`,
          entity_type: 'PROCUREMENT',
          entity_id: proc.id,
          action_route: `/(owner)/mess/procurements`,
          metadata: { procurementId: proc.id, totalAmount, vendorId: proc.vendor_id },
          dedupe_key: `PROCUREMENT_RECORDED:${proc.id}`,
          status: 'UNREAD',
          read_at: null,
          resolved_at: null,
          expires_at: null,
        },
        trx
      );

      return {
        id: proc.id,
        organizationId: proc.organization_id,
        messId: proc.mess_id,
        vendorId: proc.vendor_id,
        purchaseDate: proc.purchase_date,
        invoiceReference: proc.invoice_reference,
        totalAmount: Number(proc.total_amount),
        notes: proc.notes,
        createdAt: proc.created_at ? new Date(proc.created_at).toISOString() : '',
      };
    });
  }

  // --- EXPENSES ---

  public async listExpenses(
    organizationId: string,
    messId: string,
    page = 1,
    pageSize = 20,
    options?: {
      search?: string;
      category?: MessExpenseCategory;
      vendorId?: string;
    }
  ): Promise<{ items: MessExpenseDto[]; total: number }> {
    const { items, total } = await this.repo.listExpenses(
      organizationId,
      messId,
      page,
      pageSize,
      options
    );
    return {
      items: items.map((e: any) => ({
        id: e.id,
        organizationId: e.organization_id,
        messId: e.mess_id,
        category: e.category as MessExpenseCategory,
        amount: Number(e.amount),
        expenseDate: e.expense_date,
        vendorId: e.vendor_id,
        referenceNo: e.reference_no,
        notes: e.notes,
        createdAt: e.created_at ? new Date(e.created_at).toISOString() : '',
      })),
      total,
    };
  }

  public async getExpenseById(organizationId: string, id: string): Promise<MessExpenseDto> {
    const exp = await this.repo.findExpenseById(id, organizationId);
    if (!exp) {
      throw new NotFoundException(`Expense ${id} not found`);
    }
    return {
      id: exp.id,
      organizationId: exp.organization_id,
      messId: exp.mess_id,
      category: exp.category as MessExpenseCategory,
      amount: Number(exp.amount),
      expenseDate: exp.expense_date,
      vendorId: exp.vendor_id,
      referenceNo: exp.reference_no,
      notes: exp.notes,
      createdAt: exp.created_at ? new Date(exp.created_at).toISOString() : '',
    };
  }

  public async createExpense(
    organizationId: string,
    dto: {
      messId: string;
      category: MessExpenseCategory;
      amount: number;
      expenseDate?: string;
      vendorId?: string;
      referenceNo?: string;
      notes?: string;
    }
  ): Promise<MessExpenseDto> {
    if (!dto.amount || dto.amount <= 0) {
      throw new BadRequestException('Expense amount must be greater than 0');
    }

    if (dto.vendorId) {
      const vendor = await this.repo.findVendorById(dto.vendorId, organizationId);
      if (!vendor) {
        throw new NotFoundException(`Vendor ${dto.vendorId} not found`);
      }
    }

    const created = await this.repo.createExpense({
      organization_id: organizationId,
      mess_id: dto.messId,
      category: dto.category,
      amount: dto.amount,
      expense_date: dto.expenseDate || new Date().toISOString().split('T')[0],
      vendor_id: dto.vendorId || null,
      reference_no: dto.referenceNo ? dto.referenceNo.trim() : null,
      notes: dto.notes ? dto.notes.trim() : null,
    });

    await this.notificationRepo.createIfNotExists(
      organizationId,
      {
        type: 'EXPENSE_RECORDED',
        severity: 'INFO',
        title: 'Expense Recorded',
        message: `${dto.category} expense of ₹${Number(dto.amount).toLocaleString('en-IN')} recorded.`,
        entity_type: 'EXPENSE',
        entity_id: created.id,
        action_route: `/(owner)/mess/expenses`,
        metadata: { expenseId: created.id, category: dto.category, amount: dto.amount },
        dedupe_key: `EXPENSE_RECORDED:${created.id}`,
        status: 'UNREAD',
        read_at: null,
        resolved_at: null,
        expires_at: null,
      }
    );

    return {
      id: created.id,
      organizationId: created.organization_id,
      messId: created.mess_id,
      category: created.category as MessExpenseCategory,
      amount: Number(created.amount),
      expenseDate: created.expense_date,
      vendorId: created.vendor_id,
      referenceNo: created.reference_no,
      notes: created.notes,
      createdAt: created.created_at ? new Date(created.created_at).toISOString() : '',
    };
  }
}
