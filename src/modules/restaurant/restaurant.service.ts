import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "nestjs-prisma";
import { CreateRestaurantDto, UpdateRestaurantDto } from "./dto";
import { Restaurant } from "./entities/restaurant.entity";
import { Role } from "@prisma/client";

@Injectable()
export class RestaurantService {
  private readonly logger = new Logger(RestaurantService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    createRestaurantDto: CreateRestaurantDto,
    userId: string,
  ): Promise<Restaurant> {
    return this.prisma.restaurant.create({
      data: {
        ...createRestaurantDto,
        ownerId: userId,
      },
    });
  }

  async findAll(
    userId?: string,
    includeAll: boolean = false,
  ): Promise<Restaurant[]> {
    this.logger.log(
      `Finding restaurants for userId: ${userId}, includeAll: ${includeAll}`,
    );

    // Check if the user is an admin
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      this.logger.log(`User role: ${user?.role}`);

      // If the user is an admin and the request is for all restaurants
      // Note: includeAll is true when the endpoint is /restaurants and false for /my-restaurants
      if (user && user.role === Role.ADMIN && includeAll) {
        this.logger.log(`Admin user accessing all restaurants`);
        return this.prisma.restaurant.findMany();
      }
    }

    // For non-admin users or when explicitly requesting only owned restaurants
    // Return only the user's restaurants
    const where = userId ? { ownerId: userId } : {};
    this.logger.log(
      `Returning restaurants filtered by: ${JSON.stringify(where)}`,
    );

    return this.prisma.restaurant.findMany({
      where,
    });
  }

  async findOne(id: string, userId?: string): Promise<Restaurant> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${id} not found`);
    }

    // If userId is provided, check if the user has permission
    if (userId) {
      await this.checkPermission(restaurant.ownerId, userId);
    }

    return restaurant;
  }

  async update(
    id: string,
    updateRestaurantDto: UpdateRestaurantDto,
    userId: string,
  ): Promise<Restaurant> {
    // First check if the restaurant exists and if the user has permission
    const restaurant = await this.findOne(id);
    await this.checkPermission(restaurant.ownerId, userId);

    try {
      return await this.prisma.restaurant.update({
        where: { id },
        data: updateRestaurantDto,
      });
    } catch (error) {
      throw new NotFoundException(`Restaurant with ID ${id} not found`);
    }
  }

  async remove(id: string, userId: string): Promise<Restaurant> {
    // First check if the restaurant exists and if the user has permission
    const restaurant = await this.findOne(id);
    await this.checkPermission(restaurant.ownerId, userId);

    try {
      return await this.prisma.restaurant.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Restaurant with ID ${id} not found`);
    }
  }

  // Helper method to check if a user has permission to access a restaurant
  private async checkPermission(
    ownerId: string,
    userId: string,
  ): Promise<void> {
    // If the user is the owner, they have permission
    if (ownerId === userId) {
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
