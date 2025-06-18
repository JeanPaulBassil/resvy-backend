import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "nestjs-prisma";
import {
  CreateReservationDto,
  UpdateReservationDto,
  AssignTableDto,
} from "./dto";
import { Prisma, Reservation, ReservationStatus } from "@prisma/client";
import { SmsService } from "../sms/sms.service";

// Helper function to convert UTC time back to local time format
function convertToLocalTimeString(date: Date): string {
  // Get the timezone offset in minutes
  const offsetMinutes = date.getTimezoneOffset();
  
  // Add the offset to get the local time (getTimezoneOffset returns negative values for positive offsets)
  const localTime = new Date(date.getTime() - (offsetMinutes * 60 * 1000));
  
  // Format as ISO string without the Z suffix
  return localTime.toISOString().slice(0, 19);
}

// Helper function to transform reservation for frontend
function transformReservation(reservation: any): any {
  if (!reservation) return reservation;
  
  return {
    ...reservation,
    startTime: convertToLocalTimeString(reservation.startTime),
    endTime: reservation.endTime ? convertToLocalTimeString(reservation.endTime) : reservation.endTime,
    date: reservation.date.toISOString().split('T')[0], // Keep date as YYYY-MM-DD
  };
}

@Injectable()
export class ReservationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly smsService: SmsService,
  ) {}

  /**
   * Create a new reservation
   */
  async create(
    createReservationDto: CreateReservationDto,
  ): Promise<Reservation> {
    const { date, startTime, endTime, ...rest } = createReservationDto;

    // Convert string dates to Date objects
    const dateObj = new Date(date);

    // Handle timezone properly for local times
    let startTimeObj: Date;
    if (
      startTime.endsWith("Z") ||
      startTime.includes("+") ||
      startTime.includes("-")
    ) {
      // Has timezone info, use as-is
      startTimeObj = new Date(startTime);
    } else {
      // No timezone info - treat as local time by parsing components manually
      const match = startTime.match(
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/,
      );
      if (match) {
        const [, year, month, day, hours, minutes, seconds] = match;
        startTimeObj = new Date(
          parseInt(year),
          parseInt(month) - 1, // Month is 0-indexed
          parseInt(day),
          parseInt(hours),
          parseInt(minutes),
          parseInt(seconds),
        );
      } else {
        // Fallback to regular parsing
        startTimeObj = new Date(startTime);
      }
    }

    // Handle optional end time
    let endTimeObj: Date | undefined;
    if (endTime) {
      if (
        endTime.endsWith("Z") ||
        endTime.includes("+") ||
        endTime.includes("-")
      ) {
        // Has timezone info, use as-is
        endTimeObj = new Date(endTime);
      } else {
        // No timezone info - treat as local time by parsing components manually
        const match = endTime.match(
          /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/,
        );
        if (match) {
          const [, year, month, day, hours, minutes, seconds] = match;
          endTimeObj = new Date(
            parseInt(year),
            parseInt(month) - 1, // Month is 0-indexed
            parseInt(day),
            parseInt(hours),
            parseInt(minutes),
            parseInt(seconds),
          );
        } else {
          // Fallback to regular parsing
          endTimeObj = new Date(endTime);
        }
      }
    }

    // Create the reservation
    const reservation = await this.prisma.reservation.create({
      data: {
        ...rest,
        date: dateObj,
        startTime: startTimeObj,
        endTime: endTimeObj,
      },
      include: {
        guest: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
            smsEnabled: true,
          },
        },
        table: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Send confirmation SMS if SMS is enabled for the restaurant
    if (reservation.restaurant.smsEnabled && reservation.guest.phone) {
      try {
        console.log("=== Attempting to send reservation confirmation SMS ===");
        console.log(
          "Restaurant SMS enabled:",
          reservation.restaurant.smsEnabled,
        );
        console.log("Guest phone:", reservation.guest.phone);

        const smsResult = await this.smsService.sendReservationConfirmation(
          reservation.restaurantId,
          {
            guestName: reservation.guest.name,
            guestPhone: reservation.guest.phone,
            restaurantName: reservation.restaurant.name,
            startTime: reservation.startTime,
            numberOfGuests: reservation.numberOfGuests,
            tableNumber: reservation.table?.name,
          },
        );

        if (smsResult.success) {
          console.log("✅ Reservation confirmation SMS sent successfully");
        } else {
          console.log(
            "❌ Failed to send reservation confirmation SMS:",
            smsResult.message,
          );
        }
      } catch (error) {
        console.error(
          "❌ Error sending reservation confirmation SMS:",
          error.message,
        );
      }
    } else {
      console.log("⚠️ SMS not sent - SMS disabled or no guest phone number");
      console.log("SMS enabled:", reservation.restaurant.smsEnabled);
      console.log("Guest phone:", reservation.guest.phone);
    }

    // Return the reservation without the extra includes to maintain API compatibility
    const finalReservation = await this.prisma.reservation.findUnique({
      where: { id: reservation.id },
      include: {
        guest: true,
        table: true,
        shift: true,
      },
    });
    
    return transformReservation(finalReservation);
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

    const reservations = await this.prisma.reservation.findMany({
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

    // Transform all reservations to local time format
    return reservations.map(transformReservation);
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

    const reservations = await this.prisma.reservation.findMany({
      where,
      include: {
        guest: true,
        table: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    // Transform all reservations to local time format
    return reservations.map(transformReservation);
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

    return transformReservation(reservation);
  }

  /**
   * Update a reservation
   */
  async update(
    id: string,
    updateReservationDto: UpdateReservationDto,
  ): Promise<Reservation> {
    const { date, startTime, endTime, ...rest } = updateReservationDto;

    // Get the current reservation to check for status changes
    const currentReservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: {
        guest: true,
        restaurant: true,
        table: true,
        shift: true,
      },
    });

    if (!currentReservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    // Prepare data object for update
    const data: Prisma.ReservationUpdateInput = { ...rest };

    // Handle date and time fields if provided
    if (date) {
      data.date = new Date(date);
    }

    if (startTime) {
      // Handle timezone properly for local times
      if (
        startTime.endsWith("Z") ||
        startTime.includes("+") ||
        startTime.includes("-")
      ) {
        // Has timezone info, use as-is
        data.startTime = new Date(startTime);
      } else {
        // No timezone info - treat as local time by parsing components manually
        const match = startTime.match(
          /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/,
        );
        if (match) {
          const [, year, month, day, hours, minutes, seconds] = match;
          data.startTime = new Date(
            parseInt(year),
            parseInt(month) - 1, // Month is 0-indexed
            parseInt(day),
            parseInt(hours),
            parseInt(minutes),
            parseInt(seconds),
          );
        } else {
          // Fallback to regular parsing
          data.startTime = new Date(startTime);
        }
      }
    }

    if (endTime) {
      // Handle timezone properly for local times
      if (
        endTime.endsWith("Z") ||
        endTime.includes("+") ||
        endTime.includes("-")
      ) {
        // Has timezone info, use as-is
        data.endTime = new Date(endTime);
      } else {
        // No timezone info - treat as local time by parsing components manually
        const match = endTime.match(
          /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/,
        );
        if (match) {
          const [, year, month, day, hours, minutes, seconds] = match;
          data.endTime = new Date(
            parseInt(year),
            parseInt(month) - 1, // Month is 0-indexed
            parseInt(day),
            parseInt(hours),
            parseInt(minutes),
            parseInt(seconds),
          );
        } else {
          // Fallback to regular parsing
          data.endTime = new Date(endTime);
        }
      }
    }

    // Check if status is being changed to CANCELLED
    const isBeingCancelled =
      updateReservationDto.status === "CANCELLED" &&
      currentReservation.status !== "CANCELLED";

    // Update the reservation
    const updatedReservation = await this.prisma.reservation.update({
      where: { id },
      data,
      include: {
        guest: true,
        restaurant: true,
        table: true,
        shift: true,
      },
    });

    // Send cancellation SMS if status changed to CANCELLED
    if (
      isBeingCancelled &&
      currentReservation.restaurant.smsEnabled &&
      currentReservation.guest.phone
    ) {
      console.log(
        "=== Attempting to send reservation cancellation SMS (status change) ===",
      );
      console.log(
        "Restaurant SMS enabled:",
        currentReservation.restaurant.smsEnabled,
      );
      console.log("Guest phone:", currentReservation.guest.phone);

      try {
        const smsResult = await this.smsService.sendReservationCancellation(
          currentReservation.restaurantId,
          {
            guestName: currentReservation.guest.name,
            guestPhone: currentReservation.guest.phone,
            restaurantName: currentReservation.restaurant.name,
            startTime: currentReservation.startTime,
            numberOfGuests: currentReservation.numberOfGuests,
            tableNumber: currentReservation.table?.name,
          },
        );

        if (smsResult.success) {
          console.log("✅ Reservation cancellation SMS sent successfully");
        } else {
          console.log(
            "❌ Failed to send reservation cancellation SMS:",
            smsResult.message,
          );
        }
      } catch (error) {
        console.error("Error sending reservation cancellation SMS:", error);
      }
    }

    return transformReservation(updatedReservation);
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

    const updatedReservation = await this.prisma.reservation.update({
      where: { id },
      data,
      include: {
        guest: true,
        table: true,
        shift: true,
      },
    });

    return transformReservation(updatedReservation);
  }

  /**
   * Remove a reservation
   */
  async remove(id: string): Promise<Reservation> {
    // Get the reservation with all related data before deleting
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: {
        guest: true,
        restaurant: true,
        table: true,
        shift: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    // Send cancellation SMS if SMS is enabled and guest has phone
    if (reservation.restaurant.smsEnabled && reservation.guest.phone) {
      console.log("=== Attempting to send reservation cancellation SMS ===");
      console.log("Restaurant SMS enabled:", reservation.restaurant.smsEnabled);
      console.log("Guest phone:", reservation.guest.phone);

      try {
        const smsResult = await this.smsService.sendReservationCancellation(
          reservation.restaurantId,
          {
            guestName: reservation.guest.name,
            guestPhone: reservation.guest.phone,
            restaurantName: reservation.restaurant.name,
            startTime: reservation.startTime,
            numberOfGuests: reservation.numberOfGuests,
            tableNumber: reservation.table?.name,
          },
        );

        if (smsResult.success) {
          console.log("✅ Reservation cancellation SMS sent successfully");
        } else {
          console.log(
            "❌ Failed to send reservation cancellation SMS:",
            smsResult.message,
          );
        }
      } catch (error) {
        console.error("Error sending reservation cancellation SMS:", error);
      }
    } else {
      console.log("SMS not sent - SMS disabled or no phone number");
      console.log("SMS enabled:", reservation.restaurant.smsEnabled);
      console.log("Guest phone:", reservation.guest.phone);
    }

    // Delete the reservation and transform the result
    const deletedReservation = await this.prisma.reservation.delete({
      where: { id },
    });

    return transformReservation(deletedReservation);
  }
}
