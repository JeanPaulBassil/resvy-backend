import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "nestjs-prisma";
import {
  CreateReservationDto,
  UpdateReservationDto,
  AssignTableDto,
} from "./dto";
import { Prisma, Reservation, ReservationStatus } from "@prisma/client";

@Injectable()
export class ReservationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new reservation
   */
  async create(
    createReservationDto: CreateReservationDto,
  ): Promise<Reservation> {
    const { date, startTime, endTime, ...rest } = createReservationDto;

    // Convert string dates to Date objects
    const dateObj = new Date(date);
    const startTimeObj = new Date(startTime);

    // Handle optional end time
    let endTimeObj: Date | undefined;
    if (endTime) {
      endTimeObj = new Date(endTime);
    }

    return this.prisma.reservation.create({
      data: {
        ...rest,
        date: dateObj,
        startTime: startTimeObj,
        endTime: endTimeObj,
      },
    });
  }

  /**
   * Find all reservations with optional filters
   */
  async findAll(params: {
    restaurantId?: string;
    date?: Date;
    status?: ReservationStatus;
    shiftId?: string;
    skip?: number;
    take?: number;
  }): Promise<Reservation[]> {
    const { skip, take, restaurantId, date, status, shiftId } = params;

    // Build where conditions based on provided filters
    const where: Prisma.ReservationWhereInput = {};

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    if (date) {
      // If date is provided, filter by the specific date
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      where.date = {
        gte: date,
        lt: nextDay,
      };
    }

    if (status) {
      where.status = status;
    }

    if (shiftId) {
      where.shiftId = shiftId;
    }

    return this.prisma.reservation.findMany({
      where,
      skip,
      take,
      include: {
        guest: true,
        table: true,
        shift: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });
  }

  /**
   * Find reservations by shift ID
   */
  async findByShift(shiftId: string, date?: Date): Promise<Reservation[]> {
    const where: Prisma.ReservationWhereInput = {
      shiftId,
    };

    if (date) {
      // If date is provided, filter by the specific date
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      where.date = {
        gte: date,
        lt: nextDay,
      };
    }

    return this.prisma.reservation.findMany({
      where,
      include: {
        guest: true,
        table: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });
  }

  /**
   * Find a reservation by ID
   */
  async findOne(id: string): Promise<Reservation> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: {
        guest: true,
        table: true,
        shift: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    return reservation;
  }

  /**
   * Update a reservation
   */
  async update(
    id: string,
    updateReservationDto: UpdateReservationDto,
  ): Promise<Reservation> {
    const { date, startTime, endTime, ...rest } = updateReservationDto;

    // Prepare data object for update
    const data: Prisma.ReservationUpdateInput = { ...rest };

    // Handle date and time fields if provided
    if (date) {
      data.date = new Date(date);
    }

    if (startTime) {
      data.startTime = new Date(startTime);
    }

    if (endTime) {
      data.endTime = new Date(endTime);
    }

    return this.prisma.reservation.update({
      where: { id },
      data,
      include: {
        guest: true,
        table: true,
        shift: true,
      },
    });
  }

  /**
   * Assign a reservation to a table
   */
  async assignTable(
    id: string,
    assignTableDto: AssignTableDto,
  ): Promise<Reservation> {
    const { tableId, notes } = assignTableDto;

    // If tableId is null or empty, we're removing table assignment
    const data: Prisma.ReservationUpdateInput = {
      table: tableId ? { connect: { id: tableId } } : { disconnect: true },
    };

    // Add notes if provided
    if (notes) {
      data.note = notes;
    }

    return this.prisma.reservation.update({
      where: { id },
      data,
      include: {
        guest: true,
        table: true,
        shift: true,
      },
    });
  }

  /**
   * Remove a reservation
   */
  async remove(id: string): Promise<Reservation> {
    // Check if reservation exists
    await this.findOne(id);

    // Delete the reservation
    return this.prisma.reservation.delete({
      where: { id },
    });
  }
}
