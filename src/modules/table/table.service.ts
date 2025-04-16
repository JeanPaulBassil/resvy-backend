import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "nestjs-prisma";
import {
  CreateTableDto,
  UpdateTableDto,
  UpdateTablePositionDto,
  MergeTablesDto,
  UpdateTableStatusDto,
} from "./dto";
import { Table } from "./entities/table.entity";
import { Role } from "@prisma/client";
import { TableStatus } from "@prisma/client";

@Injectable()
export class TableService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createTableDto: CreateTableDto,
    restaurantId: string,
    userId: string,
  ): Promise<Table> {
    // Check if the user has permission to access this restaurant
    await this.checkRestaurantPermission(restaurantId, userId);

    // Check if a table with the same name already exists in this restaurant
    const existingTable = await this.prisma.table.findFirst({
      where: {
        restaurantId,
        name: createTableDto.name,
      },
    });

    if (existingTable) {
      throw new ConflictException(
        `A table with the name "${createTableDto.name}" already exists in this restaurant`,
      );
    }

    // If floorId is provided, check if the floor exists and belongs to the restaurant
    if (createTableDto.floorId) {
      const floor = await this.prisma.floor.findFirst({
        where: {
          id: createTableDto.floorId,
          restaurantId,
        },
      });

      if (!floor) {
        throw new NotFoundException(
          `Floor with ID ${createTableDto.floorId} not found in this restaurant`,
        );
      }
    }

    return this.prisma.table.create({
      data: {
        ...createTableDto,
        restaurantId,
      },
    });
  }

  async findAll(
    restaurantId: string,
    floorId?: string,
    userId?: string,
  ): Promise<Table[]> {
    // Check if the user has permission to access this restaurant

    console.log("Calling findAll tables");
    if (userId) {
      await this.checkRestaurantPermission(restaurantId, userId);
    }

    return this.prisma.table.findMany({
      where: {
        restaurantId,
        ...(floorId ? { floorId } : {}),
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  async findOne(
    id: string,
    restaurantId: string,
    userId?: string,
  ): Promise<Table> {
    // Check if the user has permission to access this restaurant
    if (userId) {
      await this.checkRestaurantPermission(restaurantId, userId);
    }

    const table = await this.prisma.table.findFirst({
      where: {
        id,
        restaurantId,
      },
    });

    if (!table) {
      throw new NotFoundException(`Table with ID ${id} not found`);
    }

    return table;
  }

  async update(
    id: string,
    updateTableDto: UpdateTableDto,
    restaurantId: string,
    userId: string,
  ): Promise<Table> {
    // Check if the table exists and if the user has permission
    await this.findOne(id, restaurantId, userId);

    // If updating the name, check if the new name already exists
    if (updateTableDto.name) {
      const existingTable = await this.prisma.table.findFirst({
        where: {
          restaurantId,
          name: updateTableDto.name,
          NOT: {
            id,
          },
        },
      });

      if (existingTable) {
        throw new ConflictException(
          `A table with the name "${updateTableDto.name}" already exists in this restaurant`,
        );
      }
    }

    // If floorId is provided, check if the floor exists and belongs to the restaurant
    if (updateTableDto.floorId) {
      const floor = await this.prisma.floor.findFirst({
        where: {
          id: updateTableDto.floorId,
          restaurantId,
        },
      });

      if (!floor) {
        throw new NotFoundException(
          `Floor with ID ${updateTableDto.floorId} not found in this restaurant`,
        );
      }
    }

    try {
      return await this.prisma.table.update({
        where: { id },
        data: updateTableDto,
      });
    } catch (error) {
      throw new NotFoundException(`Table with ID ${id} not found`);
    }
  }

  async updatePosition(
    id: string,
    updateTablePositionDto: UpdateTablePositionDto,
    restaurantId: string,
    userId: string,
  ): Promise<Table> {
    // Check if the table exists and if the user has permission
    await this.findOne(id, restaurantId, userId);

    try {
      return await this.prisma.table.update({
        where: { id },
        data: {
          x: updateTablePositionDto.x,
          y: updateTablePositionDto.y,
        },
      });
    } catch (error) {
      throw new NotFoundException(`Table with ID ${id} not found`);
    }
  }

  async updateStatus(
    id: string,
    updateTableStatusDto: UpdateTableStatusDto,
    restaurantId: string,
    userId: string,
  ): Promise<Table> {
    // Check if the table exists and if the user has permission
    await this.findOne(id, restaurantId, userId);

    try {
      return await this.prisma.table.update({
        where: { id },
        data: {
          status: updateTableStatusDto.status,
        },
      });
    } catch (error) {
      throw new NotFoundException(`Table with ID ${id} not found`);
    }
  }

  async remove(
    id: string,
    restaurantId: string,
    userId: string,
  ): Promise<Table> {
    // Check if the table exists and if the user has permission
    await this.findOne(id, restaurantId, userId);

    try {
      return await this.prisma.table.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Table with ID ${id} not found`);
    }
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

  // Helper method to check if a user has permission to access a restaurant
  private async checkRestaurantPermission(
    restaurantId: string,
    userId: string,
  ): Promise<void> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { ownerId: true },
    });

    if (!restaurant) {
      throw new NotFoundException(
        `Restaurant with ID ${restaurantId} not found`,
      );
    }

    // If the user is the owner, they have permission
    if (restaurant.ownerId === userId) {
      return;
    }

    // Check if the user is an admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    // Only allow access if the user is an admin
    if (!user || user.role !== Role.ADMIN) {
      throw new ForbiddenException(
        "You don't have permission to access this restaurant",
      );
    }
  }
}
