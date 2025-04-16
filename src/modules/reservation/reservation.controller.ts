import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from "@nestjs/common";
import { ReservationService } from "./reservation.service";
import {
  CreateReservationDto,
  UpdateReservationDto,
  AssignTableDto,
} from "./dto";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { Reservation, ReservationStatus } from "@prisma/client";

@ApiTags("Reservations")
@ApiBearerAuth()
@Controller("reservations")
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  @ApiOperation({ summary: "Create a new reservation" })
  @ApiCreatedResponse({ description: "Reservation created successfully" })
  create(
    @Body() createReservationDto: CreateReservationDto,
  ): Promise<Reservation> {
    return this.reservationService.create(createReservationDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all reservations with optional filters" })
  @ApiOkResponse({ description: "Reservations retrieved successfully" })
  @ApiQuery({ name: "restaurantId", required: false, type: String })
  @ApiQuery({
    name: "date",
    required: false,
    type: String,
    description: "Date in ISO format",
  })
  @ApiQuery({ name: "status", required: false, enum: ReservationStatus })
  @ApiQuery({ name: "shiftId", required: false, type: String })
  @ApiQuery({ name: "skip", required: false, type: Number })
  @ApiQuery({ name: "take", required: false, type: Number })
  findAll(
    @Query("restaurantId") restaurantId?: string,
    @Query("date") dateString?: string,
    @Query("status") status?: ReservationStatus,
    @Query("shiftId") shiftId?: string,
    @Query("skip") skip?: number,
    @Query("take") take?: number,
  ): Promise<Reservation[]> {
    // Parse date if provided
    const date = dateString ? new Date(dateString) : undefined;

    return this.reservationService.findAll({
      restaurantId,
      date,
      status,
      shiftId,
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
    });
  }

  @Get("by-shift/:shiftId")
  @ApiOperation({ summary: "Get reservations by shift ID" })
  @ApiOkResponse({ description: "Reservations retrieved successfully" })
  @ApiParam({ name: "shiftId", required: true, type: String })
  @ApiQuery({
    name: "date",
    required: false,
    type: String,
    description: "Date in ISO format",
  })
  findByShift(
    @Param("shiftId", ParseUUIDPipe) shiftId: string,
    @Query("date") dateString?: string,
  ): Promise<Reservation[]> {
    // Parse date if provided
    const date = dateString ? new Date(dateString) : undefined;

    return this.reservationService.findByShift(shiftId, date);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a reservation by ID" })
  @ApiOkResponse({ description: "Reservation retrieved successfully" })
  @ApiParam({ name: "id", required: true, type: String })
  findOne(@Param("id", ParseUUIDPipe) id: string): Promise<Reservation> {
    return this.reservationService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a reservation" })
  @ApiOkResponse({ description: "Reservation updated successfully" })
  @ApiParam({ name: "id", required: true, type: String })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateReservationDto: UpdateReservationDto,
  ): Promise<Reservation> {
    return this.reservationService.update(id, updateReservationDto);
  }

  @Patch(":id/assign-table")
  @ApiOperation({ summary: "Assign a table to a reservation" })
  @ApiOkResponse({ description: "Table assigned successfully" })
  @ApiParam({ name: "id", required: true, type: String })
  assignTable(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() assignTableDto: AssignTableDto,
  ): Promise<Reservation> {
    return this.reservationService.assignTable(id, assignTableDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a reservation" })
  @ApiOkResponse({ description: "Reservation deleted successfully" })
  @ApiParam({ name: "id", required: true, type: String })
  remove(@Param("id", ParseUUIDPipe) id: string): Promise<Reservation> {
    return this.reservationService.remove(id);
  }
}
