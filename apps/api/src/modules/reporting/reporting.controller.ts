import { Controller, Get, Header, InternalServerErrorException, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantAuthorizationGuard } from '../tenant/guards/tenant-authorization.guard';
import { RequestContext } from '../../common/context/request-context';
import { ReportingService } from './reporting.service';
import type { DateRangePresetDto } from '@m-square/contracts';
import { ReportQueryDto } from './dto/report-query.dto';

@ApiTags('Reporting & Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantAuthorizationGuard)
@Controller()
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  private getOrgId(): string {
    const orgId = RequestContext.organizationId;
    if (!orgId) {
      throw new InternalServerErrorException(
        'Organization ID context missing in reporting controller'
      );
    }
    return orgId;
  }

  // --- UNIFIED OWNER DASHBOARD APIS ---

  @Get('dashboard/owner/summary')
  @ApiOperation({ summary: 'Get unified Owner Command Center dashboard summary' })
  public async getOwnerDashboardSummary(
    @Query('propertyId') propertyId?: string,
    @Query('buildingId') buildingId?: string,
    @Query('period') period?: string,
    @Query('preset') preset?: DateRangePresetDto,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.reportingService.getDashboardOverview(
      this.getOrgId(),
      propertyId,
      buildingId,
      period,
      preset || 'THIS_MONTH',
      startDate,
      endDate
    );
  }

  @Get('dashboard/owner/alerts')
  @ApiOperation({ summary: 'Get actionable operational alerts for Owner Command Center' })
  public async getOwnerDashboardAlerts(
    @Query('propertyId') propertyId?: string,
    @Query('buildingId') buildingId?: string
  ) {
    return this.reportingService.getOperationalAlerts(this.getOrgId(), propertyId, buildingId);
  }

  @Get('dashboard/owner/activity')
  @ApiOperation({ summary: 'Get recent operational activity stream for Owner Command Center' })
  public async getOwnerDashboardActivity(
    @Query('propertyId') propertyId?: string,
    @Query('buildingId') buildingId?: string,
    @Query('limit') limit?: number
  ) {
    return this.reportingService.getActivityReport(
      this.getOrgId(),
      propertyId,
      buildingId,
      limit ? Number(limit) : 20
    );
  }

  // --- STEP 19 DETAILED REPORT ENDPOINTS ---

  @Get('reports/residents')
  @ApiOperation({ summary: 'Get detailed Resident Report' })
  public async getResidentReportDetailed(@Query() query: ReportQueryDto) {
    return this.reportingService.getResidentReportDetailed(this.getOrgId(), query);
  }

  @Get('reports/residents/export.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="residents_report.csv"')
  @ApiOperation({ summary: 'Export Resident Report as CSV' })
  public async exportResidentReportCsv(@Query() query: ReportQueryDto) {
    return this.reportingService.exportResidentReportCsv(this.getOrgId(), query);
  }

  @Get('reports/occupancy')
  @ApiOperation({ summary: 'Get detailed Occupancy Report' })
  public async getOccupancyReportDetailed(@Query() query: ReportQueryDto) {
    return this.reportingService.getOccupancyReportDetailed(this.getOrgId(), query);
  }

  @Get('reports/occupancy/export.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="occupancy_report.csv"')
  @ApiOperation({ summary: 'Export Occupancy Report as CSV' })
  public async exportOccupancyReportCsv(@Query() query: ReportQueryDto) {
    return this.reportingService.exportOccupancyReportCsv(this.getOrgId(), query);
  }

  @Get('reports/billing')
  @ApiOperation({ summary: 'Get detailed Billing Report' })
  public async getBillingReportDetailed(@Query() query: ReportQueryDto) {
    return this.reportingService.getBillingReportDetailed(this.getOrgId(), query);
  }

  @Get('reports/billing/export.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="billing_report.csv"')
  @ApiOperation({ summary: 'Export Billing Report as CSV' })
  public async exportBillingReportCsv(@Query() query: ReportQueryDto) {
    return this.reportingService.exportBillingReportCsv(this.getOrgId(), query);
  }

  @Get('reports/collections')
  @ApiOperation({ summary: 'Get detailed Collections / Payment Method Report' })
  public async getCollectionReportDetailed(@Query() query: ReportQueryDto) {
    return this.reportingService.getCollectionReportDetailed(this.getOrgId(), query);
  }

  @Get('reports/collections/export.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="collections_report.csv"')
  @ApiOperation({ summary: 'Export Collections Report as CSV' })
  public async exportCollectionReportCsv(@Query() query: ReportQueryDto) {
    return this.reportingService.exportCollectionReportCsv(this.getOrgId(), query);
  }

  @Get('reports/outstanding')
  @ApiOperation({ summary: 'Get detailed Outstanding Dues Report' })
  public async getOutstandingReportDetailed(@Query() query: ReportQueryDto) {
    return this.reportingService.getOutstandingReportDetailed(this.getOrgId(), query);
  }

  @Get('reports/outstanding/export.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="outstanding_dues_report.csv"')
  @ApiOperation({ summary: 'Export Outstanding Dues Report as CSV' })
  public async exportOutstandingReportCsv(@Query() query: ReportQueryDto) {
    return this.reportingService.exportOutstandingReportCsv(this.getOrgId(), query);
  }

  @Get('reports/mess')
  @ApiOperation({ summary: 'Get detailed Mess Subscription & Consumption Report' })
  public async getMessReportDetailed(@Query() query: ReportQueryDto) {
    return this.reportingService.getMessReportDetailed(this.getOrgId(), query);
  }

  @Get('reports/mess/export.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="mess_report.csv"')
  @ApiOperation({ summary: 'Export Mess Report as CSV' })
  public async exportMessReportCsv(@Query() query: ReportQueryDto) {
    return this.reportingService.exportMessReportCsv(this.getOrgId(), query);
  }

  @Get('reports/inventory')
  @ApiOperation({ summary: 'Get detailed Inventory & Stock Status Report' })
  public async getInventoryReportDetailed(@Query() query: ReportQueryDto) {
    return this.reportingService.getInventoryReportDetailed(this.getOrgId(), query);
  }

  @Get('reports/inventory/export.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="inventory_report.csv"')
  @ApiOperation({ summary: 'Export Inventory Report as CSV' })
  public async exportInventoryReportCsv(@Query() query: ReportQueryDto) {
    return this.reportingService.exportInventoryReportCsv(this.getOrgId(), query);
  }

  @Get('reports/procurement')
  @ApiOperation({ summary: 'Get detailed Procurement Report' })
  public async getProcurementReportDetailed(@Query() query: ReportQueryDto) {
    return this.reportingService.getProcurementReportDetailed(this.getOrgId(), query);
  }

  @Get('reports/procurement/export.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="procurement_report.csv"')
  @ApiOperation({ summary: 'Export Procurement Report as CSV' })
  public async exportProcurementReportCsv(@Query() query: ReportQueryDto) {
    return this.reportingService.exportProcurementReportCsv(this.getOrgId(), query);
  }

  @Get('reports/expenses')
  @ApiOperation({ summary: 'Get detailed Expense Report' })
  public async getExpenseReportDetailed(@Query() query: ReportQueryDto) {
    return this.reportingService.getExpenseReportDetailed(this.getOrgId(), query);
  }

  @Get('reports/expenses/export.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="expenses_report.csv"')
  @ApiOperation({ summary: 'Export Expense Report as CSV' })
  public async exportExpenseReportCsv(@Query() query: ReportQueryDto) {
    return this.reportingService.exportExpenseReportCsv(this.getOrgId(), query);
  }

  @Get('reports/property-performance')
  @ApiOperation({ summary: 'Get detailed Property / Building Performance Report' })
  public async getPropertyPerformanceReportDetailed(@Query() query: ReportQueryDto) {
    return this.reportingService.getPropertyPerformanceReportDetailed(this.getOrgId(), query);
  }

  @Get('reports/property-performance/export.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="property_performance_report.csv"')
  @ApiOperation({ summary: 'Export Property Performance Report as CSV' })
  public async exportPropertyPerformanceReportCsv(@Query() query: ReportQueryDto) {
    return this.reportingService.exportPropertyPerformanceReportCsv(this.getOrgId(), query);
  }
}
