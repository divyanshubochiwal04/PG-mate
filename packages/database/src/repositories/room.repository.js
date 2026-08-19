"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KyselyRoomRepository = void 0;
const contracts_1 = require("@m-square/contracts");
class KyselyRoomRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    getExecutor(trx) {
        return trx && typeof trx.selectFrom === 'function'
            ? trx
            : this.db;
    }
    async findByIdForOrganization(id, organizationId) {
        const row = await this.db
            .selectFrom('rooms')
            .selectAll()
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .executeTakeFirst();
        return row || null;
    }
    /**
     * Acquire a FOR UPDATE row lock on the room row for serializing capacity operations.
     */
    async findByIdForUpdate(id, organizationId, trx) {
        const executor = this.getExecutor(trx);
        const row = await executor
            .selectFrom('rooms')
            .selectAll()
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .forUpdate()
            .executeTakeFirst();
        return row || null;
    }
    async findAllByFloor(floorId, organizationId, params) {
        const { offset, limit } = (0, contracts_1.calculatePaginationBounds)(params.page, params.pageSize);
        const countResult = await this.db
            .selectFrom('rooms')
            .select(this.db.fn.count('id').as('total'))
            .where('floor_id', '=', floorId)
            .where('organization_id', '=', organizationId)
            .executeTakeFirstOrThrow();
        const total = parseInt(countResult.total, 10);
        const rows = await this.db
            .selectFrom('rooms')
            .selectAll()
            .where('floor_id', '=', floorId)
            .where('organization_id', '=', organizationId)
            .orderBy('display_order', 'asc')
            .orderBy('room_number', 'asc')
            .offset(offset)
            .limit(limit)
            .execute();
        return (0, contracts_1.createPaginatedResult)(rows, total, params.page, params.pageSize);
    }
    async createForOrganization(organizationId, data, trx) {
        const executor = this.getExecutor(trx);
        const row = await executor
            .insertInto('rooms')
            .values({
            floor_id: data.floorId,
            building_id: data.buildingId,
            property_id: data.propertyId,
            organization_id: organizationId,
            room_number: data.roomNumber,
            room_type: data.roomType || 'DOUBLE',
            capacity: data.capacity,
            display_order: data.displayOrder || 0,
            status: data.status || 'ACTIVE',
        })
            .returningAll()
            .executeTakeFirstOrThrow();
        return row;
    }
    async updateForOrganization(id, organizationId, data) {
        const updatePayload = {
            updated_at: new Date(),
        };
        if (data.roomNumber !== undefined)
            updatePayload['room_number'] = data.roomNumber;
        if (data.roomType !== undefined)
            updatePayload['room_type'] = data.roomType;
        if (data.displayOrder !== undefined)
            updatePayload['display_order'] = data.displayOrder;
        if (data.status !== undefined)
            updatePayload['status'] = data.status;
        const row = await this.db
            .updateTable('rooms')
            .set(updatePayload)
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .returningAll()
            .executeTakeFirst();
        return row || null;
    }
    async updateCapacity(id, organizationId, newCapacity, trx) {
        const executor = trx || this.db;
        const row = await executor
            .updateTable('rooms')
            .set({
            capacity: newCapacity,
            updated_at: new Date(),
        })
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .returningAll()
            .executeTakeFirst();
        return row || null;
    }
    async deleteForOrganization(id, organizationId) {
        const result = await this.db
            .deleteFrom('rooms')
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .executeTakeFirst();
        return Number(result.numDeletedRows) > 0;
    }
    async countBedsInRoom(roomId, organizationId) {
        const res = await this.db
            .selectFrom('beds')
            .select(this.db.fn.count('id').as('cnt'))
            .where('room_id', '=', roomId)
            .where('organization_id', '=', organizationId)
            .executeTakeFirstOrThrow();
        return parseInt(res.cnt, 10);
    }
    async findBuildingOccupancyTree(buildingId, organizationId) {
        const buildingRow = await this.db
            .selectFrom('buildings as b')
            .innerJoin('properties as p', 'p.id', 'b.property_id')
            .select([
            'b.id as building_id',
            'b.name as building_name',
            'b.code as building_code',
            'p.id as property_id',
            'p.name as property_name',
        ])
            .where('b.id', '=', buildingId)
            .where('b.organization_id', '=', organizationId)
            .executeTakeFirst();
        if (!buildingRow)
            return null;
        const floorRows = await this.db
            .selectFrom('floors')
            .selectAll()
            .where('building_id', '=', buildingId)
            .where('organization_id', '=', organizationId)
            .orderBy('floor_number', 'asc')
            .execute();
        const roomRows = await this.db
            .selectFrom('rooms')
            .selectAll()
            .where('building_id', '=', buildingId)
            .where('organization_id', '=', organizationId)
            .orderBy('display_order', 'asc')
            .orderBy('room_number', 'asc')
            .execute();
        const bedRows = await this.db
            .selectFrom('beds as bd')
            .innerJoin('rooms as r', 'r.id', 'bd.room_id')
            .select([
            'bd.id',
            'bd.room_id',
            'bd.organization_id',
            'bd.bed_number',
            'bd.display_order',
            'bd.status',
            'bd.created_at',
            'bd.updated_at',
        ])
            .where('r.building_id', '=', buildingId)
            .where('bd.organization_id', '=', organizationId)
            .orderBy('bd.display_order', 'asc')
            .orderBy('bd.bed_number', 'asc')
            .execute();
        const activeAllocations = await this.db
            .selectFrom('bed_allocations as ba')
            .innerJoin('beds as bd', 'bd.id', 'ba.bed_id')
            .innerJoin('rooms as r', 'r.id', 'bd.room_id')
            .innerJoin('stays as s', 's.id', 'ba.stay_id')
            .innerJoin('residents as res', 'res.id', 's.resident_id')
            .select([
            'ba.bed_id',
            'ba.stay_id',
            's.resident_id',
            'res.first_name',
            'res.last_name',
            'res.phone',
        ])
            .where('r.building_id', '=', buildingId)
            .where('ba.organization_id', '=', organizationId)
            .where('ba.status', '=', 'ACTIVE')
            .where('s.status', '=', 'ACTIVE')
            .execute();
        const roomFacilities = await this.db
            .selectFrom('room_facilities as rf')
            .innerJoin('rooms as r', 'r.id', 'rf.room_id')
            .innerJoin('facilities as f', 'f.id', 'rf.facility_id')
            .select([
            'rf.room_id',
            'f.id as facility_id',
            'f.organization_id',
            'f.name',
            'f.code',
            'f.category',
            'f.description',
            'f.status',
            'f.created_at',
            'f.updated_at',
        ])
            .where('r.building_id', '=', buildingId)
            .where('rf.organization_id', '=', organizationId)
            .where('f.organization_id', '=', organizationId)
            .execute();
        // Index active allocations by bedId
        const allocationByBedMap = new Map();
        for (const alloc of activeAllocations) {
            allocationByBedMap.set(alloc.bed_id, {
                residentId: alloc.resident_id,
                stayId: alloc.stay_id,
                fullName: `${alloc.first_name} ${alloc.last_name}`.trim(),
                phone: alloc.phone,
            });
        }
        // Index facilities by roomId
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const facilitiesByRoomMap = new Map();
        for (const rf of roomFacilities) {
            const list = facilitiesByRoomMap.get(rf.room_id) || [];
            list.push({
                id: rf.facility_id,
                organizationId: rf.organization_id,
                name: rf.name,
                code: rf.code,
                category: rf.category,
                description: rf.description,
                status: rf.status,
                createdAt: new Date(rf.created_at).toISOString(),
                updatedAt: new Date(rf.updated_at).toISOString(),
            });
            facilitiesByRoomMap.set(rf.room_id, list);
        }
        // Index beds by roomId
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bedsByRoomMap = new Map();
        for (const bed of bedRows) {
            const list = bedsByRoomMap.get(bed.room_id) || [];
            const occupant = allocationByBedMap.get(bed.id) || null;
            const status = occupant ? 'OCCUPIED' : bed.status;
            list.push({
                id: bed.id,
                roomId: bed.room_id,
                organizationId: bed.organization_id,
                bedNumber: bed.bed_number,
                displayOrder: bed.display_order,
                status,
                createdAt: new Date(bed.created_at).toISOString(),
                updatedAt: new Date(bed.updated_at).toISOString(),
                activeResident: occupant,
            });
            bedsByRoomMap.set(bed.room_id, list);
        }
        // Map rooms
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const roomsByFloorMap = new Map();
        let bldgTotalBeds = 0;
        let bldgOccupiedBeds = 0;
        let bldgAvailableBeds = 0;
        let bldgTotalRooms = 0;
        for (const room of roomRows) {
            bldgTotalRooms += 1;
            const beds = bedsByRoomMap.get(room.id) || [];
            const facilities = facilitiesByRoomMap.get(room.id) || [];
            const totalBeds = beds.length;
            const occupiedBeds = beds.filter((b) => b.status === 'OCCUPIED' || b.activeResident !== null).length;
            const maintenanceBeds = beds.filter((b) => b.status === 'MAINTENANCE').length;
            const inactiveBeds = beds.filter((b) => b.status === 'INACTIVE').length;
            const availableBeds = Math.max(0, totalBeds - occupiedBeds - maintenanceBeds - inactiveBeds);
            const capacityForOccupancy = totalBeds - maintenanceBeds - inactiveBeds;
            const occupancyPercentage = capacityForOccupancy > 0
                ? Math.round((occupiedBeds / capacityForOccupancy) * 10000) / 100
                : 0;
            bldgTotalBeds += totalBeds;
            bldgOccupiedBeds += occupiedBeds;
            bldgAvailableBeds += availableBeds;
            const roomSummary = {
                id: room.id,
                roomNumber: room.room_number,
                roomType: room.room_type,
                capacity: room.capacity,
                status: room.status,
                totalBeds,
                occupiedBeds,
                availableBeds,
                occupancyPercentage,
                facilities,
                beds,
            };
            const list = roomsByFloorMap.get(room.floor_id) || [];
            list.push(roomSummary);
            roomsByFloorMap.set(room.floor_id, list);
        }
        // Map floors
        const floorSummaries = floorRows.map((flr) => {
            const rooms = roomsByFloorMap.get(flr.id) || [];
            const totalRooms = rooms.length;
            const totalBeds = rooms.reduce((sum, r) => sum + r.totalBeds, 0);
            const occupiedBeds = rooms.reduce((sum, r) => sum + r.occupiedBeds, 0);
            const availableBeds = rooms.reduce((sum, r) => sum + r.availableBeds, 0);
            const occupancyPercentage = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 10000) / 100 : 0;
            return {
                id: flr.id,
                name: flr.name,
                floorNumber: flr.floor_number,
                totalRooms,
                totalBeds,
                occupiedBeds,
                availableBeds,
                occupancyPercentage,
                rooms,
            };
        });
        const bldgOccupancyPercentage = bldgTotalBeds > 0 ? Math.round((bldgOccupiedBeds / bldgTotalBeds) * 10000) / 100 : 0;
        return {
            buildingId: buildingRow.building_id,
            buildingName: buildingRow.building_name,
            buildingCode: buildingRow.building_code,
            propertyId: buildingRow.property_id,
            propertyName: buildingRow.property_name,
            totalFloors: floorRows.length,
            totalRooms: bldgTotalRooms,
            totalBeds: bldgTotalBeds,
            occupiedBeds: bldgOccupiedBeds,
            availableBeds: bldgAvailableBeds,
            occupancyPercentage: bldgOccupancyPercentage,
            floors: floorSummaries,
        };
    }
}
exports.KyselyRoomRepository = KyselyRoomRepository;
//# sourceMappingURL=room.repository.js.map