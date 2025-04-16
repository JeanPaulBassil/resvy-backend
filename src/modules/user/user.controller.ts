import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  HttpStatus,
  HttpException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { UserService } from "./user.service";
import {
  QueryUsersDto,
  UpdateUserDto,
  UpdateUserAllowedStatusDto,
} from "./dto";

@ApiTags("users")
@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post("create")
  @ApiOperation({ summary: "Create a new user" })
  @ApiResponse({ status: 201, description: "User created successfully" })
  async createUser(
    @Body() body: { firebaseUid: string; email: string; name?: string },
  ) {
    return this.userService.createUser(body.firebaseUid, body.email, body.name);
  }

  @Get(":uid")
  @ApiOperation({ summary: "Get user by Firebase UID" })
  @ApiResponse({ status: 200, description: "User found" })
  @ApiResponse({ status: 404, description: "User not found" })
  async getUser(@Param("uid") firebaseUid: string) {
    const user = await this.userService.getUserByUid(firebaseUid);
    if (!user) {
      throw new HttpException("User not found", HttpStatus.NOT_FOUND);
    }
    return user;
  }

  @Get()
  @ApiOperation({ summary: "Get all clients with pagination and search" })
  @ApiResponse({ status: 200, description: "Return clients with pagination" })
  async findAllClients(@Query() query: QueryUsersDto) {
    // Default to USER role if not specified
    const role = query.role || Role.USER;

    return this.userService.findAllClients({
      page: query.page,
      limit: query.limit,
      search: query.search,
      role,
    });
  }

  @Get("id/:id")
  @ApiOperation({ summary: "Get user by ID" })
  @ApiResponse({ status: 200, description: "User found" })
  @ApiResponse({ status: 404, description: "User not found" })
  async getUserById(@Param("id") id: string) {
    const user = await this.userService.getUserById(id);
    if (!user) {
      throw new HttpException("User not found", HttpStatus.NOT_FOUND);
    }
    return user;
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a user" })
  @ApiResponse({ status: 200, description: "User updated successfully" })
  @ApiResponse({ status: 404, description: "User not found" })
  async updateUser(
    @Param("id") id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    try {
      return await this.userService.updateUser(id, updateUserDto);
    } catch (error) {
      if (error.code === "P2025") {
        throw new HttpException("User not found", HttpStatus.NOT_FOUND);
      }
      throw error;
    }
  }

  @Patch(":id/allowed-status")
  @ApiOperation({ summary: "Update a user's allowed status" })
  @ApiResponse({ status: 200, description: "User status updated successfully" })
  @ApiResponse({ status: 404, description: "User not found" })
  async updateUserAllowedStatus(
    @Param("id") id: string,
    @Body() updateStatusDto: UpdateUserAllowedStatusDto,
  ) {
    try {
      return await this.userService.updateUserAllowedStatus(
        id,
        updateStatusDto.isAllowed,
      );
    } catch (error) {
      if (error.code === "P2025") {
        throw new HttpException("User not found", HttpStatus.NOT_FOUND);
      }
      throw error;
    }
  }

  @Post("unrevoke/:firebaseUid")
  @ApiOperation({ summary: "Remove a user from the revoked users list" })
  @ApiResponse({ status: 200, description: "User unrevoked successfully" })
  async unrevokeUser(@Param("firebaseUid") firebaseUid: string) {
    const wasRevoked = await this.userService.isUserRevoked(firebaseUid);
    await this.userService.removeUserFromRevokedList(firebaseUid);

    return {
      message: wasRevoked
        ? "User was successfully removed from revoked list"
        : "User was not in the revoked list",
      wasRevoked,
      firebaseUid,
    };
  }
}
