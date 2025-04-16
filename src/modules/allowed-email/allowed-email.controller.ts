import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { AllowedEmailService } from "./allowed-email.service";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { CreateAllowedEmailDto, UpdateAllowedEmailDto } from "./dto";

@ApiTags("allowed-emails")
@Controller("allowed-emails")
export class AllowedEmailController {
  constructor(private readonly allowedEmailService: AllowedEmailService) {}

  @Get()
  @ApiOperation({ summary: "Get all allowed emails" })
  @ApiResponse({ status: 200, description: "Return all allowed emails" })
  async findAll() {
    return this.allowedEmailService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get allowed email by ID" })
  @ApiResponse({ status: 200, description: "Return allowed email by ID" })
  @ApiResponse({ status: 404, description: "Allowed email not found" })
  async findOne(@Param("id") id: string) {
    const allowedEmail = await this.allowedEmailService.findOne(id);
    if (!allowedEmail) {
      throw new HttpException("Allowed email not found", HttpStatus.NOT_FOUND);
    }
    return allowedEmail;
  }

  @Post()
  @ApiOperation({ summary: "Create a new allowed email" })
  @ApiResponse({ status: 201, description: "Allowed email created" })
  async create(@Body() createAllowedEmailDto: CreateAllowedEmailDto) {
    return this.allowedEmailService.create(createAllowedEmailDto);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update an allowed email" })
  @ApiResponse({ status: 200, description: "Allowed email updated" })
  @ApiResponse({ status: 404, description: "Allowed email not found" })
  async update(
    @Param("id") id: string,
    @Body() updateAllowedEmailDto: UpdateAllowedEmailDto,
  ) {
    try {
      return await this.allowedEmailService.update(id, updateAllowedEmailDto);
    } catch (error) {
      if (error.code === "P2025") {
        throw new HttpException(
          "Allowed email not found",
          HttpStatus.NOT_FOUND,
        );
      }
      throw error;
    }
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete an allowed email" })
  @ApiResponse({ status: 200, description: "Allowed email deleted" })
  @ApiResponse({ status: 404, description: "Allowed email not found" })
  async remove(@Param("id") id: string) {
    try {
      return await this.allowedEmailService.delete(id);
    } catch (error) {
      if (error.code === "P2025") {
        throw new HttpException(
          "Allowed email not found",
          HttpStatus.NOT_FOUND,
        );
      }
      throw error;
    }
  }
}
