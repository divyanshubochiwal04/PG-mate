"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KyselyOccupancyReportingRepository = void 0;
const kysely_1 = require("kysely");
class KyselyOccupancyReportingRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async getOccupancyReport(organizationId, filter) {
        let query = this.db
            .selectFrom('rooms as rm')
            .innerJoin('floors as fl', 'fl.id', 'rm.floor_id')
            .innerJoin('buildings as b', 'b.id', 'fl.building_id')
            .innerJoin('properties as p', 'p.id', 'b.property_id')
            .select([
            'p.id as propertyId',
            'p.name as propertyName',
            'b.id as buildingId',
            'b.name as buildingName',
            'fl.id as floorId',
            'fl.floor_number as floorNumber',
            'rm.id as roomId',
            'rm.room_number as roomNumber',
            'rm.capacity as capacity',
            (0, kysely_1.sql) `(SELECT COUNT(bd.id)::int FROM beds bd WHERE bd.room_id = rm.id AND bd.organization_id = ${organizationId})`.as('totalBeds'),
            (0, kysely_1.sql) `(SELECT COUNT(DISTINCT ba.bed_id)::int FROM bed_allocations ba JOIN beds bd ON bd.id = ba.bed_id WHERE bd.room_id = rm.id AND ba.status = 'ACTIVE' AND ba.organization_id = ${organizationId})`.as('occupiedBeds'),
        ])
            .where('rm.organization_id', '=', organizationId);
        if (filter.propertyId) {
            query = query.where('p.id', '=', filter.propertyId);
        }
        if (filter.buildingId) {
            query = query.where('b.id', '=', filter.buildingId);
        }
        const rows = await query
            .orderBy('p.name', 'asc')
            .orderBy('b.name', 'asc')
            .orderBy('fl.floor_number', 'asc')
            .orderBy('rm.room_number', 'asc')
            .execute();
        let totalBeds = 0;
        let totalOccupied = 0;
        let totalRooms = rows.length;
        const formattedRows = rows.map((r) => {
            const roomCapacity = Number(r.capacity || 0);
            const roomTotalBeds = Number(r.totalBeds || 0);
            const roomOccupiedBeds = Number(r.occupiedBeds || 0);
            const roomAvailableBeds = Math.max(0, roomTotalBeds - roomOccupiedBeds);
            const pct = roomTotalBeds > 0 ? Math.round((roomOccupiedBeds / roomTotalBeds) * 100) : 0;
            totalBeds += roomTotalBeds;
            totalOccupied += roomOccupiedBeds;
            return {
                propertyId: r.propertyId,
                propertyName: r.propertyName,
                buildingId: r.buildingId,
                buildingName: r.buildingName,
                floorId: r.floorId,
                floorNumber: Number(r.floorNumber),
                roomId: r.roomId,
                roomNumber: r.roomNumber,
                capacity: roomCapacity,
                totalBeds: roomTotalBeds,
                occupiedBeds: roomOccupiedBeds,
                availableBeds: roomAvailableBeds,
                occupancyPercentage: pct,
            };
        });
        const totalAvailable = Math.max(0, totalBeds - totalOccupied);
        const overallPct = totalBeds > 0 ? Math.round((totalOccupied / totalBeds) * 100) : 0;
        // Distinct floor count
        const floorSet = new Set(rows.map((r) => r.floorId));
        return {
            summary: {
                totalBeds,
                occupiedBeds: totalOccupied,
                availableBeds: totalAvailable,
                occupancyPercentage: overallPct,
                totalRooms,
                totalFloors: floorSet.size,
            },
            rows: formattedRows,
        };
    }
}
exports.KyselyOccupancyReportingRepository = KyselyOccupancyReportingRepository;
//# sourceMappingURL=reporting-occupancy.repository.js.map