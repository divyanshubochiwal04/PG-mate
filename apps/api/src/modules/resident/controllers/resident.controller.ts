import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantAuthorizationGuard } from '../../tenant/guards/tenant-authorization.guard';
import { RequestContext } from '../../../common/context/request-context';
import { ResidentService } from '../services/resident.service';
import { EmergencyContactService } from '../services/emergency-contact.service';
import { CreateResidentDto } from '../dto/create-resident.dto';
import { UpdateResidentDto } from '../dto/update-resident.dto';
import { CreateEmergencyContactDto } from '../dto/create-emergency-contact.dto';
import { UpdateEmergencyContactDto } from '../dto/update-emergency-contact.dto';
import { StayAllocationService } from '../services/stay-allocation.service';
import { CheckOutDto } from '../dto/check-out.dto';
import { ResidentOperationalQueryDto } from '../dto/resident-operational-query.dto';
import type {
  EmergencyContactDto,
  MessSubscriptionDto,
  PaginatedResult,
  ResidentDto,
  ResidentHistoryDto,
  ResidentOperationalListResponseDto,
  ResidentOperationalSummaryDto,
  StayDto,
} from '@m-square/contracts';
import { MessService } from '../../mess/mess.service';
import { CreateResidentMessSubscriptionDto } from '../../mess/dto/create-resident-mess-subscription.dto';
import { UpdateResidentMessSubscriptionDto } from '../../mess/dto/update-resident-mess-subscription.dto';
import { CancelResidentMessSubscriptionDto } from '../../mess/dto/cancel-resident-mess-subscription.dto';

@ApiTags('Residents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantAuthorizationGuard)
@Controller('residents')
export class ResidentController {
  constructor(
    private readonly residentService: ResidentService,
    private readonly contactService: EmergencyContactService,
    private readonly messService: MessService,
    private readonly allocationService: StayAllocationService
  ) {}

  @Get('operational')
  @ApiOperation({ summary: 'Get operational resident list with full location, mess, and financial filters' })
  @ApiResponse({ status: 200, description: 'Operational resident list' })
  public async getOperationalResidents(
    @Query() query: ResidentOperationalQueryDto
  ): Promise<ResidentOperationalListResponseDto> {
    return this.residentService.getOperationalList(this.getOrgId(), query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get overall resident operational summary metrics for organization' })
  @ApiResponse({ status: 200, description: 'Resident operational summary metrics' })
  public async getOperationalSummary(): Promise<ResidentOperationalSummaryDto> {
    return this.residentService.getOperationalSummary(this.getOrgId());
  }

  @Post()
  @ApiOperation({ summary: 'Register a new resident' })
  @ApiResponse({ status: 201, description: 'Resident registered successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Resident code conflict' })
  public async createResident(@Body() dto: CreateResidentDto): Promise<ResidentDto> {
    return this.residentService.createResident(this.getOrgId(), dto);
  }

  @Get()
  @ApiOperation({ summary: 'List residents with pagination, search, and status filter' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, example: 10 })
  @ApiQuery({ name: 'search', required: false, example: 'John' })
  @ApiQuery({ name: 'status', required: false, example: 'ACTIVE' })
  @ApiResponse({ status: 200, description: 'Paginated resident list' })
  public async getResidents(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('status') status?: string
  ): Promise<PaginatedResult<ResidentDto>> {
    const params = { page: Number(page) || 1, pageSize: Number(pageSize) || 10 };
    return this.residentService.getResidents(this.getOrgId(), params, search, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get resident details by ID' })
  @ApiParam({ name: 'id', description: 'Resident UUID' })
  @ApiResponse({ status: 200, description: 'Resident details' })
  @ApiResponse({ status: 404, description: 'Resident not found' })
  public async getResidentById(
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: string
  ): Promise<ResidentDto> {
    return this.residentService.getResidentById(id, this.getOrgId());
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update resident details' })
  @ApiParam({ name: 'id', description: 'Resident UUID' })
  @ApiResponse({ status: 200, description: 'Resident updated' })
  @ApiResponse({ status: 404, description: 'Resident not found' })
  public async updateResident(
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: string,
    @Body() dto: UpdateResidentDto
  ): Promise<ResidentDto> {
    return this.residentService.updateResident(id, this.getOrgId(), dto);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get complete stay and bed allocation history for resident' })
  @ApiParam({ name: 'id', description: 'Resident UUID' })
  @ApiResponse({ status: 200, description: 'Resident history record' })
  @ApiResponse({ status: 404, description: 'Resident not found' })
  public async getResidentHistory(
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: string
  ): Promise<ResidentHistoryDto> {
    return this.residentService.getResidentHistory(id, this.getOrgId());
  }

  // --- EMERGENCY CONTACTS ---
  @Post(':id/emergency-contacts')
  @ApiOperation({ summary: 'Add emergency contact for resident' })
  @ApiParam({ name: 'id', description: 'Resident UUID' })
  @ApiResponse({ status: 201, description: 'Emergency contact created' })
  @ApiResponse({ status: 404, description: 'Resident not found' })
  public async createEmergencyContact(
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) residentId: string,
    @Body() dto: CreateEmergencyContactDto
  ): Promise<EmergencyContactDto> {
    return this.contactService.createContact(residentId, this.getOrgId(), dto);
  }

  @Get(':id/emergency-contacts')
  @ApiOperation({ summary: 'List emergency contacts for resident' })
  @ApiParam({ name: 'id', description: 'Resident UUID' })
  @ApiResponse({ status: 200, description: 'List of emergency contacts' })
  @ApiResponse({ status: 404, description: 'Resident not found' })
  public async getEmergencyContacts(
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) residentId: string
  ): Promise<EmergencyContactDto[]> {
    return this.contactService.getContacts(residentId, this.getOrgId());
  }

  @Patch(':id/emergency-contacts/:contactId')
  @ApiOperation({ summary: 'Update emergency contact' })
  @ApiParam({ name: 'id', description: 'Resident UUID' })
  @ApiParam({ name: 'contactId', description: 'Emergency Contact UUID' })
  @ApiResponse({ status: 200, description: 'Emergency contact updated' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  public async updateEmergencyContact(
    @Param('contactId', new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) contactId: string,
    @Body() dto: UpdateEmergencyContactDto
  ): Promise<EmergencyContactDto> {
    return this.contactService.updateContact(contactId, this.getOrgId(), dto);
  }

  @Delete(':id/emergency-contacts/:contactId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete emergency contact' })
  @ApiParam({ name: 'id', description: 'Resident UUID' })
  @ApiParam({ name: 'contactId', description: 'Emergency Contact UUID' })
  @ApiResponse({ status: 200, description: 'Emergency contact deleted' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  public async deleteEmergencyContact(
    @Param('contactId', new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) contactId: string
  ): Promise<{ success: boolean }> {
    await this.contactService.deleteContact(contactId, this.getOrgId());
    return { success: true };
  }

  // --- MESS SUBSCRIPTION ---
  @Get(':id/mess-subscription')
  @ApiOperation({ summary: 'Get active mess subscription for resident' })
  @ApiParam({ name: 'id', description: 'Resident UUID' })
  @ApiResponse({ status: 200, description: 'Active mess subscription or null' })
  @ApiResponse({ status: 404, description: 'Resident not found' })
  public async getMessSubscription(
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) residentId: string
  ): Promise<MessSubscriptionDto | null> {
    return this.messService.getResidentMessSubscription(this.getOrgId(), residentId);
  }

  @Post(':id/mess-subscription')
  @ApiOperation({ summary: 'Subscribe resident to mess facility and meal plan' })
  @ApiParam({ name: 'id', description: 'Resident UUID' })
  @ApiResponse({ status: 201, description: 'Mess subscription created' })
  @ApiResponse({ status: 400, description: 'Validation or state error' })
  @ApiResponse({ status: 404, description: 'Resident, mess, or meal plan not found' })
  @ApiResponse({ status: 409, description: 'Active subscription conflict' })
  public async createMessSubscription(
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) residentId: string,
    @Body() dto: CreateResidentMessSubscriptionDto
  ): Promise<MessSubscriptionDto> {
    return this.messService.createResidentMessSubscription(this.getOrgId(), residentId, dto);
  }

  @Patch(':id/mess-subscription')
  @ApiOperation({ summary: 'Change resident mess subscription plan' })
  @ApiParam({ name: 'id', description: 'Resident UUID' })
  @ApiResponse({ status: 200, description: 'Mess subscription plan changed' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({
    status: 404,
    description: 'Resident, active subscription, mess, or plan not found',
  })
  public async changeMessSubscription(
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) residentId: string,
    @Body() dto: UpdateResidentMessSubscriptionDto
  ): Promise<MessSubscriptionDto> {
    return this.messService.changeResidentMessSubscription(this.getOrgId(), residentId, dto);
  }

  @Post(':id/mess-subscription/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel active resident mess subscription' })
  @ApiParam({ name: 'id', description: 'Resident UUID' })
  @ApiResponse({ status: 200, description: 'Mess subscription cancelled' })
  @ApiResponse({ status: 404, description: 'Resident or active subscription not found' })
  public async cancelMessSubscription(
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) residentId: string,
    @Body() dto: CancelResidentMessSubscriptionDto
  ): Promise<MessSubscriptionDto> {
    return this.messService.cancelResidentMessSubscription(this.getOrgId(), residentId, dto);
  }

  @Post(':id/check-out')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check out resident (Complete Stay & End Allocation)' })
  @ApiParam({ name: 'id', description: 'Resident UUID' })
  @ApiResponse({ status: 200, description: 'Check-out successful' })
  @ApiResponse({ status: 400, description: 'Stay not active' })
  @ApiResponse({ status: 404, description: 'Resident or active stay not found' })
  public async checkOutResident(
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) residentId: string,
    @Body() dto: CheckOutDto
  ): Promise<StayDto> {
    return this.allocationService.checkOutResident(this.getOrgId(), residentId, dto);
  }

  private getOrgId(): string {
    const orgId = RequestContext.organizationId;
    if (!orgId) {
      throw new InternalServerErrorException(
        'Organization ID context missing in resident controller'
      );
    }
    return orgId;
  }
}
