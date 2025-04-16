import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "nestjs-prisma";
import { CreateGuestDto, UpdateGuestDto } from "./dto";
import { Guest } from "./entities/guest.entity";
import { Role } from "@prisma/client";

@Injectable()
export class GuestService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createGuestDto: CreateGuestDto,
    restaurantId: string,
    userId: string,
  ): Promise<Guest> {
    // Check if user has permission to add guests to this restaurant
    await this.checkRestaurantPermission(restaurantId, userId);

    return this.prisma.guest.create({
      data: {
        ...createGuestDto,
        restaurantId,
      },
    });
  }

  async findAll(restaurantId: string, userId: string): Promise<Guest[]> {
    // Check if user has permission to view guests for this restaurant
    await this.checkRestaurantPermission(restaurantId, userId);

    console.log("restaurantId", restaurantId);
    const guests = await this.prisma.guest.findMany({
      where: {
        restaurantId,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    console.log(guests);

    return guests;
  }

  async findOne(
    id: string,
    restaurantId: string,
    userId: string,
  ): Promise<Guest> {
    // Check if user has permission to view guests for this restaurant
    await this.checkRestaurantPermission(restaurantId, userId);

    const guest = await this.prisma.guest.findUnique({
      where: {
        id,
      },
    });

    if (!guest || guest.restaurantId !== restaurantId) {
      throw new NotFoundException(
        `Guest with ID ${id} not found in this restaurant`,
      );
    }

    return guest;
  }

  async update(
    id: string,
    updateGuestDto: UpdateGuestDto,
    restaurantId: string,
    userId: string,
  ): Promise<Guest> {
    // Check if user has permission to update guests for this restaurant
    await this.checkRestaurantPermission(restaurantId, userId);

    // Check if the guest exists and belongs to the restaurant
    const guest = await this.prisma.guest.findUnique({
      where: { id },
    });

    if (!guest || guest.restaurantId !== restaurantId) {
      throw new NotFoundException(
        `Guest with ID ${id} not found in this restaurant`,
      );
    }

    return this.prisma.guest.update({
      where: { id },
      data: updateGuestDto,
    });
  }

  async remove(
    id: string,
    restaurantId: string,
    userId: string,
  ): Promise<Guest> {
    // Check if user has permission to delete guests for this restaurant
    await this.checkRestaurantPermission(restaurantId, userId);

    // Check if the guest exists and belongs to the restaurant
    const guest = await this.prisma.guest.findUnique({
      where: { id },
    });

    if (!guest || guest.restaurantId !== restaurantId) {
      throw new NotFoundException(
        `Guest with ID ${id} not found in this restaurant`,
      );
    }

    return this.prisma.guest.delete({
      where: { id },
    });
  }

  async recordVisit(
    id: string,
    restaurantId: string,
    userId: string,
  ): Promise<Guest> {
    // Check if user has permission to update guests for this restaurant
    await this.checkRestaurantPermission(restaurantId, userId);

    // Check if the guest exists and belongs to the restaurant
    const guest = await this.prisma.guest.findUnique({
      where: { id },
    });

    if (!guest || guest.restaurantId !== restaurantId) {
      throw new NotFoundException(
        `Guest with ID ${id} not found in this restaurant`,
      );
    }

    return this.prisma.guest.update({
      where: { id },
      data: {
        visitCount: { increment: 1 },
        lastVisit: new Date(),
      },
    });
  }

  // Helper method to check if user has permission to access the restaurant
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

    // Check if the user is the restaurant owner
    if (restaurant.ownerId === userId) {
      return;
    }

    // Check if the user is an admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== Role.ADMIN) {
      throw new ForbiddenException(
        "You don't have permission to access guests for this restaurant",
      );
    }
  }
}
