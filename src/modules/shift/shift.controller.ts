import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  Query,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ShiftService } from "./shift.service";
import { CreateShiftDto, UpdateShiftDto, ToggleShiftActiveDto } from "./dto";
import { Shift } from "./entities/shift.entity";

@ApiTags("shifts")
@Controller("shifts")
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) {}

  @Post()
  @ApiOperation({ summary: "Create a new shift" })
  @ApiResponse({
    status: 201,
    description: "The shift has been successfully created.",
    type: Shift,
  })
  create(
    @Body() createShiftDto: CreateShiftDto,
    @Query("restaurantId") restaurantId: string,
    @Request() req,
  ) {
    return this.shiftService.create(createShiftDto, restaurantId, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: "Get all shifts for a restaurant" })
  @ApiResponse({
    status: 200,
    description: "Return all shifts for the specified restaurant.",
    type: [Shift],
  })
  findAll(@Query("restaurantId") restaurantId: string, @Request() req) {
    return this.shiftService.findAll(restaurantId, req.user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a shift by id" })
  @ApiResponse({
    status: 200,
    description: "Return the shift with the specified id.",
    type: Shift,
  })
  @ApiResponse({
    status: 404,
    description: "Shift not found.",
  })
  findOne(
    @Param("id") id: string,
    @Query("restaurantId") restaurantId: string,
    @Request() req,
  ) {
    return this.shiftService.findOne(id, restaurantId, req.user.id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a shift" })
  @ApiResponse({
    status: 200,
    description: "The shift has been successfully updated.",
    type: Shift,
  })
  @ApiResponse({
    status: 404,
    description: "Shift not found.",
  })
  update(
    @Param("id") id: string,
    @Body() updateShiftDto: UpdateShiftDto,
    @Query("restaurantId") restaurantId: string,
    @Request() req,
  ) {
    return this.shiftService.update(
      id,
      updateShiftDto,
      restaurantId,
      req.user.id,
    );
  }

  @Patch(":id/active")
  @ApiOperation({ summary: "Toggle the active status of a shift" })
  @ApiResponse({
    status: 200,
    description: "The shift status has been successfully updated.",
    type: Shift,
  })
  @ApiResponse({
    status: 404,
    description: "Shift not found.",
  })
  toggleActive(
    @Param("id") id: string,
    @Body() toggleDto: ToggleShiftActiveDto,
    @Query("restaurantId") restaurantId: string,
    @Request() req,
  ) {
    return this.shiftService.toggleActive(
      id,
      toggleDto,
      restaurantId,
      req.user.id,
    );
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a shift" })
  @ApiResponse({
    status: 204,
    description: "The shift has been successfully deleted.",
  })
  @ApiResponse({
    status: 404,
    description: "Shift not found.",
  })
  remove(
    @Param("id") id: string,
    @Query("restaurantId") restaurantId: string,
    @Request() req,
  ) {
    return this.shiftService.remove(id, restaurantId, req.user.id);
  }
}
