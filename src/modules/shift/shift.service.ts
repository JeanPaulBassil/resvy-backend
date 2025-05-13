import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "nestjs-prisma";
import {
  CreateShiftDto,
  UpdateShiftDto,
  ToggleShiftActiveDto,
  ShiftReservationCountDto,
} from "./dto";
import { Shift } from "./entities/shift.entity";

@Injectable()
export class ShiftService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new shift
   */
  async create(
    createShiftDto: CreateShiftDto,
    restaurantId: string,
    userId: string,
  ): Promise<Shift> {
    // Verify user has access to this restaurant
    await this.verifyRestaurantAccess(restaurantId, userId);

    // Set default color if not provided
    if (!createShiftDto.color) {
      createShiftDto.color = "#75CAA6"; // Default teal color
    }

    // Create shift
    return this.prisma.shift.create({
      data: {
        name: createShiftDto.name,
        startTime: createShiftDto.startTime,
        endTime: createShiftDto.endTime,
        days: createShiftDto.days,
        color: createShiftDto.color,
        restaurant: {
          connect: {
            id: restaurantId,
          },
        },
      },
    });
  }

  /**
   * Find all shifts for a restaurant
   */
  async findAll(restaurantId: string, userId: string): Promise<Shift[]> {
    // Verify user has access to this restaurant
    await this.verifyRestaurantAccess(restaurantId, userId);

    // Get all shifts for the restaurant
    return this.prisma.shift.findMany({
      where: {
        restaurantId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  /**
   * Find a specific shift by ID
   */
  async findOne(
    id: string,
    restaurantId: string,
    userId: string,
  ): Promise<Shift> {
    // Verify user has access to this restaurant
    await this.verifyRestaurantAccess(restaurantId, userId);

    // Find the shift
    const shift = await this.prisma.shift.findFirst({
      where: {
        id,
        restaurantId,
      },
    });

    // Check if shift exists
    if (!shift) {
      throw new NotFoundException(`Shift with ID ${id} not found`);
    }

    return shift;
  }

  /**
   * Update a shift
   */
  async update(
    id: string,
    updateShiftDto: UpdateShiftDto,
    restaurantId: string,
    userId: string,
  ): Promise<Shift> {
    // First check if shift exists and user has access
    await this.findOne(id, restaurantId, userId);

    // Update the shift
    return this.prisma.shift.update({
      where: {
        id,
      },
      data: updateShiftDto,
    });
  }

  /**
   * Remove a shift
   */
  async remove(
    id: string,
    restaurantId: string,
    userId: string,
  ): Promise<void> {
    // First check if shift exists and user has access
    await this.findOne(id, restaurantId, userId);

    // Delete the shift
    await this.prisma.shift.delete({
      where: {
        id,
      },
    });
  }

  /**
   * Toggle shift active status
   */
  async toggleActive(
    id: string,
    toggleDto: ToggleShiftActiveDto,
    restaurantId: string,
    userId: string,
  ): Promise<Shift> {
    // First check if shift exists and user has access
    await this.findOne(id, restaurantId, userId);

    // Update the active status
    return this.prisma.shift.update({
      where: {
        id,
      },
      data: {
        active: toggleDto.active,
      },
    });
  }

  /**
   * Get reservation counts for shifts within a date range
   */
  async getReservationCounts(
    restaurantId: string,
    startDate: string,
    endDate: string,
    userId: string,
  ): Promise<ShiftReservationCountDto[]> {
    // Verify user has access to this restaurant
    await this.verifyRestaurantAccess(restaurantId, userId);

    // Convert string dates to Date objects
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    // Set the end date to the end of the day
    endDateObj.setHours(23, 59, 59, 999);

    // Get all reservations for this restaurant within the date range
    const reservations = await this.prisma.reservation.groupBy({
      by: ["shiftId", "date"],
      where: {
        restaurantId,
        date: {
          gte: startDateObj,
          lte: endDateObj,
        },
        shiftId: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
    });

    // Transform the data to match our DTO format
    return reservations.map((item) => ({
      shiftId: item.shiftId,
      date: item.date.toISOString().split("T")[0], // Format as YYYY-MM-DD
      count: item._count.id,
    }));
  }

  /**
   * Verify that the user has access to the restaurant
   * @private
   */
  private async verifyRestaurantAccess(
    restaurantId: string,
    userId: string,
  ): Promise<void> {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: {
        id: restaurantId,
        ownerId: userId,
      },
    });

    if (!restaurant) {
      throw new ForbiddenException("You do not have access to this restaurant");
    }
  }
}
