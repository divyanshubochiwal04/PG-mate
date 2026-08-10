import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Param,
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
import type {
  EmergencyContactDto,
  PaginatedResult,
  ResidentDto,
  ResidentHistoryDto,
} from '@m-square/contracts';

@ApiTags('Residents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantAuthorizationGuard)
@Controller('residents')
export class ResidentController {
  constructor(
    private readonly residentService: ResidentService,
    private readonly contactService: EmergencyContactService
  ) {}

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
  public async getResidentById(@Param('id') id: string): Promise<ResidentDto> {
    return this.residentService.getResidentById(id, this.getOrgId());
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update resident details' })
  @ApiParam({ name: 'id', description: 'Resident UUID' })
  @ApiResponse({ status: 200, description: 'Resident updated' })
  @ApiResponse({ status: 404, description: 'Resident not found' })
  public async updateResident(
    @Param('id') id: string,
    @Body() dto: UpdateResidentDto
  ): Promise<ResidentDto> {
    return this.residentService.updateResident(id, this.getOrgId(), dto);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get complete stay and bed allocation history for resident' })
  @ApiParam({ name: 'id', description: 'Resident UUID' })
  @ApiResponse({ status: 200, description: 'Resident history record' })
  @ApiResponse({ status: 404, description: 'Resident not found' })
  public async getResidentHistory(@Param('id') id: string): Promise<ResidentHistoryDto> {
    return this.residentService.getResidentHistory(id, this.getOrgId());
  }

  // --- EMERGENCY CONTACTS ---
  @Post(':id/emergency-contacts')
  @ApiOperation({ summary: 'Add emergency contact for resident' })
  @ApiParam({ name: 'id', description: 'Resident UUID' })
  @ApiResponse({ status: 201, description: 'Emergency contact created' })
  @ApiResponse({ status: 404, description: 'Resident not found' })
  public async createEmergencyContact(
    @Param('id') residentId: string,
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
    @Param('id') residentId: string
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
    @Param('contactId') contactId: string,
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
    @Param('contactId') contactId: string
  ): Promise<{ success: boolean }> {
    await this.contactService.deleteContact(contactId, this.getOrgId());
    return { success: true };
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
