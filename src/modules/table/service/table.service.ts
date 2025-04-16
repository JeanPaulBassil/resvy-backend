import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { TableStatus } from "@prisma/client";
import { PrismaService } from "nestjs-prisma";
import { MergeTablesDto } from "../dto/merge-tables.dto";
import { Table } from "../entities/table.entity";

export class TableService {
  constructor(private readonly prisma: PrismaService) {}

  private async checkRestaurantPermission(
    restaurantId: string,
    userId: string,
  ): Promise<void> {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { id: restaurantId, ownerId: userId },
    });

    if (!restaurant) {
      throw new ForbiddenException(
        "You don't have permission to access this restaurant",
      );
    }
  }

  async findOne(
    id: string,
    restaurantId: string,
    userId: string,
  ): Promise<Table> {
    await this.checkRestaurantPermission(restaurantId, userId);

    const table = await this.prisma.table.findFirst({
      where: { id, restaurantId },
    });

    if (!table) {
      throw new NotFoundException("Table not found");
    }

    return table;
  }

  async mergeTables(
    mergeTablesDto: MergeTablesDto,
    restaurantId: string,
    userId: string,
  ): Promise<Table> {
    // Check if the user has permission to access this restaurant
    await this.checkRestaurantPermission(restaurantId, userId);

    const { tableIds } = mergeTablesDto;

    // Check if we have at least 2 tables to merge
    if (tableIds.length < 2) {
      throw new BadRequestException(
        "At least 2 tables are required for merging",
      );
    }

    // Check if all tables exist and belong to the restaurant
    const tables = await this.prisma.table.findMany({
      where: {
        id: { in: tableIds },
        restaurantId,
      },
    });

    if (tables.length !== tableIds.length) {
      throw new NotFoundException(
        "One or more tables not found or do not belong to this restaurant",
      );
    }

    // Check if any of the tables are already part of a merged table
    const alreadyMerged = tables.find(
      (table) =>
        table.parentTableId !== null || table.mergedTableIds.length > 0,
    );

    if (alreadyMerged) {
      throw new BadRequestException(
        "Cannot merge tables that are already part of a merged table",
      );
    }

    // Calculate the bounding box for the merged table
    const minX = Math.min(...tables.map((table) => table.x));
    const minY = Math.min(...tables.map((table) => table.y));

    // Calculate total capacity
    const totalCapacity = tables.reduce(
      (sum, table) => sum + table.capacity,
      0,
    );

    // Use a transaction to ensure data consistency
    return this.prisma.$transaction(async (tx) => {
      // Create the merged table
      const mergedTable = await tx.table.create({
        data: {
          name: `Merged Table ${tables[0].name}`,
          capacity: totalCapacity,
          x: minX,
          y: minY,
          status: TableStatus.AVAILABLE,
          color: tables[0].color,
          restaurantId,
          floorId: tables[0].floorId,
          mergedTableIds: tableIds,
          isMerged: true,
        },
      });

      // Update the original tables to be hidden and reference the merged table
      await tx.table.updateMany({
        where: {
          id: { in: tableIds },
        },
        data: {
          isHidden: true,
          parentTableId: mergedTable.id,
        },
      });

      return mergedTable;
    });
  }

  async unmergeTables(
    id: string,
    restaurantId: string,
    userId: string,
  ): Promise<Table[]> {
    // Check if the table exists and if the user has permission
    const mergedTable = await this.findOne(id, restaurantId, userId);

    // Check if this is actually a merged table
    if (!mergedTable.isMerged || mergedTable.mergedTableIds.length === 0) {
      throw new BadRequestException("This is not a merged table");
    }

    // Use a transaction to ensure data consistency
    return this.prisma.$transaction(async (tx) => {
      // Get all the original tables
      const originalTables = await tx.table.findMany({
        where: {
          id: { in: mergedTable.mergedTableIds },
        },
      });

      // Update the original tables to remove the parent reference and unhide them
      await tx.table.updateMany({
        where: {
          id: { in: mergedTable.mergedTableIds },
        },
        data: {
          parentTableId: null,
          isHidden: false,
        },
      });

      // Delete the merged table
      await tx.table.delete({
        where: { id },
      });

      return originalTables;
    });
  }
}
