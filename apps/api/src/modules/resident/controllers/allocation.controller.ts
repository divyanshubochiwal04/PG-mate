import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantAuthorizationGuard } from '../../tenant/guards/tenant-authorization.guard';
import { RequestContext } from '../../../common/context/request-context';
import { StayAllocationService } from '../services/stay-allocation.service';
import { CheckInDto } from '../dto/check-in.dto';
import { TransferDto } from '../dto/transfer.dto';
import { CheckOutDto } from '../dto/check-out.dto';
import type { BedAllocationDto, StayDto } from '@m-square/contracts';

@ApiTags('Allocations & Residency Workflows')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantAuthorizationGuard)
@Controller('')
export class AllocationController {
  constructor(private readonly allocationService: StayAllocationService) {}

  @Post('check-in')
  @ApiOperation({ summary: 'Check-in resident (Create Stay + BedAllocation)' })
  @ApiResponse({ status: 201, description: 'Check-in successful' })
  @ApiResponse({ status: 400, description: 'Validation or status error' })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  @ApiResponse({ status: 409, description: 'Double allocation or active stay conflict' })
  public async checkIn(
    @Body() dto: CheckInDto
  ): Promise<{ stay: StayDto; allocation: BedAllocationDto }> {
    return this.allocationService.checkIn(this.getOrgId(), dto);
  }

  @Post('allocations/:id/transfer')
  @ApiOperation({ summary: 'Transfer resident to target bed' })
  @ApiParam({ name: 'id', description: 'Current allocation UUID' })
  @ApiResponse({ status: 200, description: 'Transfer successful' })
  @ApiResponse({ status: 400, description: 'Bed or allocation unavailable' })
  @ApiResponse({ status: 404, description: 'Allocation or bed not found' })
  @ApiResponse({ status: 409, description: 'Target bed occupied' })
  public async transfer(
    @Param('id') allocationId: string,
    @Body() dto: TransferDto
  ): Promise<BedAllocationDto> {
    return this.allocationService.transfer(this.getOrgId(), allocationId, dto);
  }

  @Post('stays/:id/check-out')
  @ApiOperation({ summary: 'Check-out resident (Complete Stay & End Allocation)' })
  @ApiParam({ name: 'id', description: 'Stay UUID' })
  @ApiResponse({ status: 200, description: 'Check-out successful' })
  @ApiResponse({ status: 400, description: 'Stay not active' })
  @ApiResponse({ status: 404, description: 'Stay not found' })
  public async checkOut(
    @Param('id') stayId: string,
    @Body() dto: CheckOutDto
  ): Promise<StayDto> {
    return this.allocationService.checkOut(this.getOrgId(), stayId, dto);
  }

  @Get('stays/:id')
  @ApiOperation({ summary: 'Get stay details by ID' })
  @ApiParam({ name: 'id', description: 'Stay UUID' })
  @ApiResponse({ status: 200, description: 'Stay details' })
  @ApiResponse({ status: 404, description: 'Stay not found' })
  public async getStayById(@Param('id') id: string): Promise<StayDto> {
    return this.allocationService.getStayById(id, this.getOrgId());
  }

  @Get('allocations/:id')
  @ApiOperation({ summary: 'Get allocation details by ID' })
  @ApiParam({ name: 'id', description: 'Allocation UUID' })
  @ApiResponse({ status: 200, description: 'Allocation details' })
  @ApiResponse({ status: 404, description: 'Allocation not found' })
  public async getAllocationById(@Param('id') id: string): Promise<BedAllocationDto> {
    return this.allocationService.getAllocationById(id, this.getOrgId());
  }

  private getOrgId(): string {
    const orgId = RequestContext.organizationId;
    if (!orgId) {
      throw new InternalServerErrorException(
        'Organization ID context missing in allocation controller'
      );
    }
    return orgId;
  }
}
