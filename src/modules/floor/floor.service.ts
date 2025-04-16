import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "nestjs-prisma";
import { CreateFloorDto, UpdateFloorDto } from "./dto";
import { Floor } from "./entities/floor.entity";
import { Role } from "@prisma/client";

@Injectable()
export class FloorService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createFloorDto: CreateFloorDto, userId: string): Promise<Floor> {
    // Check if the user has permission to access this restaurant
    await this.checkRestaurantPermission(createFloorDto.restaurantId, userId);

    // Check if a floor with the same name already exists in this restaurant
    const existingFloor = await this.prisma.floor.findFirst({
      where: {
        restaurantId: createFloorDto.restaurantId,
        name: createFloorDto.name,
      },
    });

    if (existingFloor) {
      throw new ConflictException(
        `A floor with the name "${createFloorDto.name}" already exists in this restaurant`,
      );
    }

    return this.prisma.floor.create({
      data: {
        ...createFloorDto,
        restaurantId: createFloorDto.restaurantId,
      },
    });
  }

  async findAll(restaurantId: string, userId: string): Promise<Floor[]> {
    // Check if the user has permission to access this restaurant
    await this.checkRestaurantPermission(restaurantId, userId);

    return this.prisma.floor.findMany({
      where: {
        restaurantId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  async findOne(
    id: string,
    restaurantId: string,
    userId: string,
  ): Promise<Floor> {
    // Check if the user has permission to access this restaurant
    await this.checkRestaurantPermission(restaurantId, userId);

    const floor = await this.prisma.floor.findFirst({
      where: {
        id,
        restaurantId,
      },
    });

    if (!floor) {
      throw new NotFoundException(`Floor with ID ${id} not found`);
    }

    return floor;
  }

  async update(
    id: string,
    updateFloorDto: UpdateFloorDto,
    restaurantId: string,
    userId: string,
  ): Promise<Floor> {
    // Check if the floor exists and if the user has permission
    await this.findOne(id, restaurantId, userId);

    // If updating the name, check if the new name already exists
    if (updateFloorDto.name) {
      const existingFloor = await this.prisma.floor.findFirst({
        where: {
          restaurantId,
          name: updateFloorDto.name,
          NOT: {
            id,
          },
        },
      });

      if (existingFloor) {
        throw new ConflictException(
          `A floor with the name "${updateFloorDto.name}" already exists in this restaurant`,
        );
      }
    }

    try {
      return await this.prisma.floor.update({
        where: { id },
        data: updateFloorDto,
      });
    } catch (error) {
      throw new NotFoundException(`Floor with ID ${id} not found`);
    }
  }

  async remove(
    id: string,
    restaurantId: string,
    userId: string,
  ): Promise<Floor> {
    // Check if the floor exists and if the user has permission
    await this.findOne(id, restaurantId, userId);

    // Check if this is the only floor in the restaurant
    const floorCount = await this.prisma.floor.count({
      where: {
        restaurantId,
      },
    });

    if (floorCount <= 1) {
      throw new ForbiddenException(
        "Cannot delete the only floor in a restaurant. Create another floor first.",
      );
    }

    try {
      // Use a transaction to ensure data consistency
      return this.prisma.$transaction(async (tx) => {
        // First, update any tables on this floor to have no floor
        await tx.table.updateMany({
          where: {
            floorId: id,
          },
          data: {
            floorId: null,
          },
        });

        // Then delete the floor
        return tx.floor.delete({
          where: { id },
        });
      });
    } catch (error) {
      throw new NotFoundException(`Floor with ID ${id} not found`);
    }
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
