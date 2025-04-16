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
import { FloorService } from "./floor.service";
import { CreateFloorDto, UpdateFloorDto } from "./dto";
import { Floor } from "./entities/floor.entity";
import { TableService } from "../table/table.service";
import { Table } from "../table/entities/table.entity";

@ApiTags("floors")
@Controller("floors")
export class FloorController {
  constructor(
    private readonly floorService: FloorService,
    private readonly tableService: TableService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Create a new floor" })
  @ApiResponse({
    status: 201,
    description: "The floor has been successfully created.",
    type: Floor,
  })
  create(@Body() createFloorDto: CreateFloorDto, @Request() req) {
    return this.floorService.create(createFloorDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: "Get all floors for a restaurant" })
  @ApiResponse({
    status: 200,
    description: "Return all floors for the specified restaurant.",
    type: [Floor],
  })
  findAll(@Query("restaurantId") restaurantId: string, @Request() req) {
    return this.floorService.findAll(restaurantId, req.user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a floor by id" })
  @ApiResponse({
    status: 200,
    description: "Return the floor with the specified id.",
    type: Floor,
  })
  @ApiResponse({
    status: 404,
    description: "Floor not found.",
  })
  findOne(
    @Param("id") id: string,
    @Query("restaurantId") restaurantId: string,
    @Request() req,
  ) {
    return this.floorService.findOne(id, restaurantId, req.user.id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a floor" })
  @ApiResponse({
    status: 200,
    description: "The floor has been successfully updated.",
    type: Floor,
  })
  @ApiResponse({
    status: 404,
    description: "Floor not found.",
  })
  update(
    @Param("id") id: string,
    @Body() updateFloorDto: UpdateFloorDto,
    @Query("restaurantId") restaurantId: string,
    @Request() req,
  ) {
    return this.floorService.update(
      id,
      updateFloorDto,
      restaurantId,
      req.user.id,
    );
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a floor" })
  @ApiResponse({
    status: 200,
    description: "The floor has been successfully deleted.",
    type: Floor,
  })
  @ApiResponse({
    status: 404,
    description: "Floor not found.",
  })
  @ApiResponse({
    status: 403,
    description: "Cannot delete the only floor in a restaurant.",
  })
  remove(
    @Param("id") id: string,
    @Query("restaurantId") restaurantId: string,
    @Request() req,
  ) {
    return this.floorService.remove(id, restaurantId, req.user.id);
  }

  @Get(":id/tables")
  @ApiOperation({ summary: "Get all tables for a floor" })
  @ApiResponse({
    status: 200,
    description: "Return all tables for the specified floor.",
    type: [Table],
  })
  @ApiResponse({
    status: 404,
    description: "Floor not found.",
  })
  findAllTables(
    @Param("id") id: string,
    @Query("restaurantId") restaurantId: string,
    @Request() req,
  ) {
    // First check if the floor exists and if the user has permission
    this.floorService.findOne(id, restaurantId, req.user.id);

    // Then get all tables for this floor
    return this.tableService.findAll(restaurantId, id, req.user.id);
  }
}
