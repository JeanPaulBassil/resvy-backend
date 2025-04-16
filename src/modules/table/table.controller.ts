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
import { TableService } from "./table.service";
import {
  CreateTableDto,
  UpdateTableDto,
  UpdateTablePositionDto,
  MergeTablesDto,
  UpdateTableStatusDto,
} from "./dto";
import { Table } from "./entities/table.entity";

@ApiTags("tables")
@Controller("tables")
export class TableController {
  constructor(private readonly tableService: TableService) {}

  @Post()
  @ApiOperation({ summary: "Create a new table" })
  @ApiResponse({
    status: 201,
    description: "The table has been successfully created.",
    type: Table,
  })
  create(
    @Body() createTableDto: CreateTableDto,
    @Query("restaurantId") restaurantId: string,
    @Request() req,
  ) {
    return this.tableService.create(createTableDto, restaurantId, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: "Get all tables for a restaurant" })
  @ApiResponse({
    status: 200,
    description: "Return all tables for the specified restaurant.",
    type: [Table],
  })
  findAll(
    @Query("restaurantId") restaurantId: string,
    @Query("floorId") floorId: string,
    @Request() req,
  ) {
    return this.tableService.findAll(restaurantId, floorId, req.user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a table by id" })
  @ApiResponse({
    status: 200,
    description: "Return the table with the specified id.",
    type: Table,
  })
  @ApiResponse({
    status: 404,
    description: "Table not found.",
  })
  findOne(
    @Param("id") id: string,
    @Query("restaurantId") restaurantId: string,
    @Request() req,
  ) {
    return this.tableService.findOne(id, restaurantId, req.user.id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a table" })
  @ApiResponse({
    status: 200,
    description: "The table has been successfully updated.",
    type: Table,
  })
  @ApiResponse({
    status: 404,
    description: "Table not found.",
  })
  update(
    @Param("id") id: string,
    @Body() updateTableDto: UpdateTableDto,
    @Query("restaurantId") restaurantId: string,
    @Request() req,
  ) {
    return this.tableService.update(
      id,
      updateTableDto,
      restaurantId,
      req.user.id,
    );
  }

  @Patch(":id/position")
  @ApiOperation({ summary: "Update a table's position" })
  @ApiResponse({
    status: 200,
    description: "The table position has been successfully updated.",
    type: Table,
  })
  @ApiResponse({
    status: 404,
    description: "Table not found.",
  })
  updatePosition(
    @Param("id") id: string,
    @Body() updateTablePositionDto: UpdateTablePositionDto,
    @Query("restaurantId") restaurantId: string,
    @Request() req,
  ) {
    return this.tableService.updatePosition(
      id,
      updateTablePositionDto,
      restaurantId,
      req.user.id,
    );
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Update a table's status" })
  @ApiResponse({
    status: 200,
    description: "The table status has been successfully updated.",
    type: Table,
  })
  @ApiResponse({
    status: 404,
    description: "Table not found.",
  })
  updateStatus(
    @Param("id") id: string,
    @Body() updateTableStatusDto: UpdateTableStatusDto,
    @Query("restaurantId") restaurantId: string,
    @Request() req,
  ) {
    return this.tableService.updateStatus(
      id,
      updateTableStatusDto,
      restaurantId,
      req.user.id,
    );
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a table" })
  @ApiResponse({
    status: 200,
    description: "The table has been successfully deleted.",
    type: Table,
  })
  @ApiResponse({
    status: 404,
    description: "Table not found.",
  })
  remove(
    @Param("id") id: string,
    @Query("restaurantId") restaurantId: string,
    @Request() req,
  ) {
    return this.tableService.remove(id, restaurantId, req.user.id);
  }

  @Post("merge")
  @ApiOperation({ summary: "Merge multiple tables into one" })
  @ApiResponse({
    status: 201,
    description: "The tables have been successfully merged.",
    type: Table,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request. At least 2 tables are required for merging.",
  })
  @ApiResponse({
    status: 404,
    description: "One or more tables not found.",
  })
  mergeTables(
    @Body() mergeTablesDto: MergeTablesDto,
    @Query("restaurantId") restaurantId: string,
    @Request() req,
  ) {
    return this.tableService.mergeTables(
      mergeTablesDto,
      restaurantId,
      req.user.id,
    );
  }

  @Post(":id/unmerge")
  @ApiOperation({
    summary: "Unmerge a merged table back into individual tables",
  })
  @ApiResponse({
    status: 200,
    description: "The table has been successfully unmerged.",
    type: [Table],
  })
  @ApiResponse({
    status: 400,
    description: "Bad request. This is not a merged table.",
  })
  @ApiResponse({
    status: 404,
    description: "Table not found.",
  })
  unmergeTables(
    @Param("id") id: string,
    @Query("restaurantId") restaurantId: string,
    @Request() req,
  ) {
    return this.tableService.unmergeTables(id, restaurantId, req.user.id);
  }
}
