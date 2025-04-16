import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { GuestService } from "./guest.service";
import { CreateGuestDto, UpdateGuestDto } from "./dto";
import { Guest } from "./entities/guest.entity";

@ApiTags("guests")
@Controller("restaurants/:restaurantId/guests")
export class GuestController {
  constructor(private readonly guestService: GuestService) {}

  @Post()
  @ApiOperation({ summary: "Create a new guest" })
  @ApiResponse({
    status: 201,
    description: "The guest has been successfully created.",
    type: Guest,
  })
  create(
    @Param("restaurantId") restaurantId: string,
    @Body() createGuestDto: CreateGuestDto,
    @Request() req,
  ) {
    return this.guestService.create(createGuestDto, restaurantId, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: "Get all guests for a restaurant" })
  @ApiResponse({
    status: 200,
    description: "Return all guests for the restaurant.",
    type: [Guest],
  })
  findAll(@Param("restaurantId") restaurantId: string, @Request() req) {
    return this.guestService.findAll(restaurantId, req.user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a guest by id" })
  @ApiResponse({
    status: 200,
    description: "Return the guest with the specified id.",
    type: Guest,
  })
  @ApiResponse({
    status: 404,
    description: "Guest not found.",
  })
  findOne(
    @Param("restaurantId") restaurantId: string,
    @Param("id") id: string,
    @Request() req,
  ) {
    return this.guestService.findOne(id, restaurantId, req.user.id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a guest" })
  @ApiResponse({
    status: 200,
    description: "The guest has been successfully updated.",
    type: Guest,
  })
  @ApiResponse({
    status: 404,
    description: "Guest not found.",
  })
  update(
    @Param("restaurantId") restaurantId: string,
    @Param("id") id: string,
    @Body() updateGuestDto: UpdateGuestDto,
    @Request() req,
  ) {
    return this.guestService.update(
      id,
      updateGuestDto,
      restaurantId,
      req.user.id,
    );
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a guest" })
  @ApiResponse({
    status: 200,
    description: "The guest has been successfully deleted.",
    type: Guest,
  })
  @ApiResponse({
    status: 404,
    description: "Guest not found.",
  })
  remove(
    @Param("restaurantId") restaurantId: string,
    @Param("id") id: string,
    @Request() req,
  ) {
    return this.guestService.remove(id, restaurantId, req.user.id);
  }

  @Post(":id/record-visit")
  @ApiOperation({ summary: "Record a visit for a guest" })
  @ApiResponse({
    status: 200,
    description: "Visit has been recorded successfully.",
    type: Guest,
  })
  @ApiResponse({
    status: 404,
    description: "Guest not found.",
  })
  recordVisit(
    @Param("restaurantId") restaurantId: string,
    @Param("id") id: string,
    @Request() req,
  ) {
    return this.guestService.recordVisit(id, restaurantId, req.user.id);
  }
}
