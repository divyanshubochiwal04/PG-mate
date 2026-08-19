import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  AssignMessBuildingsDto,
  CreateMealPlanDto,
  CreateMealTypeDto,
  CreateMessDto,
  RecordConsumptionDto,
  UpdateMessConfigDto,
  UpsertMenuDto,
} from '@m-square/contracts';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantAuthorizationGuard } from '../tenant/guards/tenant-authorization.guard';
import { RequestContext } from '../../common/context/request-context';
import { MessService } from './mess.service';
import {
  AdjustInventoryValidationDto,
  CreateInventoryItemValidationDto,
  InventoryQueryValidationDto,
  UpdateInventoryItemValidationDto,
} from './dto/inventory-item-operations.dto';
import {
  CreateVendorValidationDto,
  UpdateVendorValidationDto,
  VendorQueryValidationDto,
} from './dto/vendor-operations.dto';
import {
  CreateProcurementValidationDto,
  ProcurementQueryValidationDto,
} from './dto/procurement-operations.dto';
import {
  CreateExpenseValidationDto,
  ExpenseQueryValidationDto,
} from './dto/expense-operations.dto';

@ApiTags('mess')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantAuthorizationGuard)
@Controller('mess')
export class MessController {
  constructor(private readonly messService: MessService) {}

  private getOrgId(): string {
    const orgId = RequestContext.organizationId;
    if (!orgId) {
      throw new InternalServerErrorException('Organization ID context missing in mess controller');
    }
    return orgId;
  }

  @Get('config')
  @ApiOperation({ summary: 'Get owner Mess Configuration & Scope Rules' })
  public async getConfig() {
    return this.messService.getConfig(this.getOrgId());
  }

  @Put('config')
  @ApiOperation({ summary: 'Update Mess Configuration & Scope Rules' })
  public async updateConfig(@Body() dto: UpdateMessConfigDto) {
    return this.messService.updateConfig(this.getOrgId(), dto);
  }

  @Get('facilities')
  @ApiOperation({ summary: 'List Mess Facilities' })
  public async listMesses() {
    return this.messService.listMesses(this.getOrgId());
  }

  @Post('facilities')
  @ApiOperation({ summary: 'Create new Mess Facility' })
  public async createMess(@Body() dto: CreateMessDto) {
    return this.messService.createMess(this.getOrgId(), dto);
  }

  @Post('facilities/:id/buildings')
  @ApiOperation({ summary: 'Assign Buildings/Blocks to Per-Block Mess Facility' })
  public async assignBuildings(@Param('id') id: string, @Body() dto: AssignMessBuildingsDto) {
    await this.messService.assignMessBuildings(this.getOrgId(), id, dto.buildingIds);
    return { success: true };
  }

  @Get('meal-types')
  @ApiOperation({ summary: 'List Meal Types & Timings' })
  public async listMealTypes(@Query('messId') messId: string) {
    return this.messService.listMealTypes(this.getOrgId(), messId);
  }

  @Post('meal-types')
  @ApiOperation({ summary: 'Create Meal Type' })
  public async createMealType(@Body() dto: CreateMealTypeDto) {
    return this.messService.createMealType(this.getOrgId(), dto);
  }

  @Get('meal-plans')
  @ApiOperation({ summary: 'List Configured Meal Plans' })
  public async listMealPlans(@Query('messId') messId: string) {
    return this.messService.listMealPlans(this.getOrgId(), messId);
  }

  @Post('meal-plans')
  @ApiOperation({ summary: 'Create Meal Plan' })
  public async createMealPlan(@Body() dto: CreateMealPlanDto) {
    return this.messService.createMealPlan(this.getOrgId(), dto);
  }

  @Get('menu')
  @ApiOperation({ summary: 'Get Menu by Date & Meal Type' })
  public async getMenu(
    @Query('messId') messId: string,
    @Query('date') date: string,
    @Query('mealTypeId') mealTypeId: string
  ) {
    return this.messService.findMenuByDate(this.getOrgId(), messId, date, mealTypeId);
  }

  @Post('menu')
  @ApiOperation({ summary: 'Upsert Daily Menu Items' })
  public async upsertMenu(@Body() dto: UpsertMenuDto) {
    return this.messService.upsertMenu(this.getOrgId(), dto);
  }

  @Get('subscriptions/stay/:stayId')
  @ApiOperation({ summary: 'Get Active Subscription by Stay ID' })
  public async getSubscriptionByStay(@Param('stayId') stayId: string) {
    return this.messService.findActiveSubscriptionByStay(this.getOrgId(), stayId);
  }

  @Post('subscriptions')
  @ApiOperation({ summary: 'Create Resident Mess Subscription' })
  public async createSubscription(
    @Body()
    dto: {
      residentId: string;
      stayId: string;
      messId: string;
      mealPlanId: string;
      billingMode: 'PER_MEAL' | 'MONTHLY';
      priceAtSubscription: number;
      startDate?: string;
    }
  ) {
    return this.messService.createSubscription(this.getOrgId(), dto);
  }

  @Post('consumption')
  @ApiOperation({ summary: 'Record Resident Meal Consumption Attendance' })
  public async recordConsumption(@Body() dto: RecordConsumptionDto) {
    return this.messService.recordConsumption(this.getOrgId(), dto);
  }

  @Get('consumption/today')
  @ApiOperation({ summary: "Get Today's Mess Attendance Metrics" })
  public async getTodayMetrics(@Query('messId') messId: string, @Query('date') date: string) {
    return this.messService.getTodayMetrics(
      this.getOrgId(),
      messId,
      date || new Date().toISOString().split('T')[0]
    );
  }

  // --- KITCHEN INVENTORY ---

  @Get('inventory')
  @ApiOperation({ summary: 'List Kitchen Inventory Items with Search & Filters' })
  public async listInventory(@Query() query: InventoryQueryValidationDto) {
    return this.messService.listInventoryItems(
      this.getOrgId(),
      query.messId,
      Number(query.page || 1),
      Number(query.pageSize || 20),
      {
        search: query.search,
        category: query.category,
        status: query.status,
      }
    );
  }

  @Get('inventory/:id')
  @ApiOperation({ summary: 'Get Kitchen Inventory Item Detail' })
  public async getInventoryItem(@Param('id') id: string) {
    return this.messService.getInventoryItemById(this.getOrgId(), id);
  }

  @Post('inventory')
  @ApiOperation({ summary: 'Create Kitchen Inventory Item' })
  public async createInventoryItem(@Body() dto: CreateInventoryItemValidationDto) {
    return this.messService.createInventoryItem(this.getOrgId(), dto);
  }

  @Patch('inventory/:id')
  @ApiOperation({ summary: 'Update Kitchen Inventory Item Metadata' })
  public async updateInventoryItem(
    @Param('id') id: string,
    @Body() dto: UpdateInventoryItemValidationDto
  ) {
    return this.messService.updateInventoryItem(this.getOrgId(), id, dto);
  }

  @Get('inventory/:id/ledger')
  @ApiOperation({ summary: 'Get Immutable Stock Ledger History for Inventory Item' })
  public async getInventoryStockLedger(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20
  ) {
    return this.messService.getInventoryStockLedger(
      this.getOrgId(),
      id,
      Number(page),
      Number(pageSize)
    );
  }

  @Post('inventory/adjust')
  @ApiOperation({ summary: 'Adjust Kitchen Stock / Record Consumption / Wastage' })
  public async adjustInventory(@Body() dto: AdjustInventoryValidationDto) {
    return this.messService.adjustInventory(this.getOrgId(), dto);
  }

  // --- VENDORS ---

  @Get('vendors')
  @ApiOperation({ summary: 'List Suppliers & Vendors with Search & Filters' })
  public async listVendors(@Query() query: VendorQueryValidationDto) {
    return this.messService.listVendors(
      this.getOrgId(),
      Number(query.page || 1),
      Number(query.pageSize || 20),
      {
        search: query.search,
        status: query.status,
      }
    );
  }

  @Get('vendors/:id')
  @ApiOperation({ summary: 'Get Vendor Detail' })
  public async getVendor(@Param('id') id: string) {
    return this.messService.getVendorById(this.getOrgId(), id);
  }

  @Post('vendors')
  @ApiOperation({ summary: 'Create Supplier / Vendor' })
  public async createVendor(@Body() dto: CreateVendorValidationDto) {
    return this.messService.createVendor(this.getOrgId(), dto);
  }

  @Patch('vendors/:id')
  @ApiOperation({ summary: 'Update Supplier / Vendor Details' })
  public async updateVendor(
    @Param('id') id: string,
    @Body() dto: UpdateVendorValidationDto
  ) {
    return this.messService.updateVendor(this.getOrgId(), id, dto);
  }

  // --- PROCUREMENTS ---

  @Get('procurements')
  @ApiOperation({ summary: 'List Procurements with Search & Filters' })
  public async listProcurements(@Query() query: ProcurementQueryValidationDto) {
    return this.messService.listProcurements(
      this.getOrgId(),
      query.messId,
      Number(query.page || 1),
      Number(query.pageSize || 20),
      {
        search: query.search,
        vendorId: query.vendorId,
      }
    );
  }

  @Get('procurements/:id')
  @ApiOperation({ summary: 'Get Procurement Detail with Line Items' })
  public async getProcurement(@Param('id') id: string) {
    return this.messService.getProcurementById(this.getOrgId(), id);
  }

  @Post('procurements')
  @ApiOperation({ summary: 'Record Procurement (Atomic Purchase Order & Stock IN)' })
  public async createProcurement(@Body() dto: CreateProcurementValidationDto) {
    return this.messService.createProcurement(this.getOrgId(), dto);
  }

  // --- EXPENSES ---

  @Get('expenses')
  @ApiOperation({ summary: 'List Mess Operational Expenses with Search & Filters' })
  public async listExpenses(@Query() query: ExpenseQueryValidationDto) {
    return this.messService.listExpenses(
      this.getOrgId(),
      query.messId,
      Number(query.page || 1),
      Number(query.pageSize || 20),
      {
        search: query.search,
        category: query.category,
        vendorId: query.vendorId,
      }
    );
  }

  @Get('expenses/:id')
  @ApiOperation({ summary: 'Get Mess Operational Expense Detail' })
  public async getExpense(@Param('id') id: string) {
    return this.messService.getExpenseById(this.getOrgId(), id);
  }

  @Post('expenses')
  @ApiOperation({ summary: 'Record Mess Operational Expense' })
  public async createExpense(@Body() dto: CreateExpenseValidationDto) {
    return this.messService.createExpense(this.getOrgId(), dto);
  }
}
