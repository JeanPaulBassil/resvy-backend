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
import { RestaurantService } from "./restaurant.service";
import { CreateRestaurantDto, UpdateRestaurantDto } from "./dto";
import { Restaurant } from "./entities/restaurant.entity";

@ApiTags("restaurants")
@Controller("restaurants")
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Post()
  @ApiOperation({ summary: "Create a new restaurant" })
  @ApiResponse({
    status: 201,
    description: "The restaurant has been successfully created.",
    type: Restaurant,
  })
  create(@Body() createRestaurantDto: CreateRestaurantDto, @Request() req) {
    return this.restaurantService.create(createRestaurantDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: "Get all restaurants" })
  @ApiResponse({
    status: 200,
    description: "Return all restaurants.",
    type: [Restaurant],
  })
  findAll(@Request() req) {
    return this.restaurantService.findAll(req.user.id, true);
  }

  @Get("my-restaurants")
  @ApiOperation({ summary: "Get all restaurants owned by the current user" })
  @ApiResponse({
    status: 200,
    description: "Return all restaurants owned by the current user.",
    type: [Restaurant],
  })
  findMyRestaurants(@Request() req) {
    return this.restaurantService.findAll(req.user.id, false);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a restaurant by id" })
  @ApiResponse({
    status: 200,
    description: "Return the restaurant with the specified id.",
    type: Restaurant,
  })
  @ApiResponse({
    status: 404,
    description: "Restaurant not found.",
  })
  @ApiResponse({
    status: 403,
    description:
      "Forbidden. You don't have permission to access this restaurant.",
  })
  findOne(@Param("id") id: string, @Request() req) {
    return this.restaurantService.findOne(id, req.user.id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a restaurant" })
  @ApiResponse({
    status: 200,
    description: "The restaurant has been successfully updated.",
    type: Restaurant,
  })
  @ApiResponse({
    status: 404,
    description: "Restaurant not found.",
  })
  @ApiResponse({
    status: 403,
    description:
      "Forbidden. You don't have permission to update this restaurant.",
  })
  update(
    @Param("id") id: string,
    @Body() updateRestaurantDto: UpdateRestaurantDto,
    @Request() req,
  ) {
    return this.restaurantService.update(id, updateRestaurantDto, req.user.id);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a restaurant" })
  @ApiResponse({
    status: 200,
    description: "The restaurant has been successfully deleted.",
    type: Restaurant,
  })
  @ApiResponse({
    status: 404,
    description: "Restaurant not found.",
  })
  @ApiResponse({
    status: 403,
    description:
      "Forbidden. You don't have permission to delete this restaurant.",
  })
  remove(@Param("id") id: string, @Request() req) {
    return this.restaurantService.remove(id, req.user.id);
  }
}
