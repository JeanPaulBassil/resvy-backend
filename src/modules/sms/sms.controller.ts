import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Request,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from "@nestjs/swagger";
import { IsOptional, IsBoolean, IsString, IsNotEmpty } from "class-validator";
import { SmsService, SmsConfig, SendSmsOptions } from "./sms.service";

export class SendSmsDto {
  @IsNotEmpty()
  numbers: string | string[];

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsString()
  textType?: "text" | "unicode";

  @IsOptional()
  scheduledTime?: Date;
}

export class UpdateSmsConfigDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  senderId?: string;

  @IsOptional()
  @IsBoolean()
  confirmationEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  cancellationEnabled?: boolean;
}

export class RequestSenderIdDto {
  senderId: string;
  countryCode: string;
}

@ApiTags("sms")
@Controller("sms/:restaurantId")
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post("send")
  @ApiOperation({ summary: "Send SMS message" })
  @ApiResponse({
    status: 200,
    description: "SMS sent successfully",
  })
  @ApiParam({ name: "restaurantId", description: "Restaurant ID" })
  async sendSms(
    @Param("restaurantId") restaurantId: string,
    @Body() sendSmsDto: SendSmsDto,
    @Request() req,
  ) {
    // TODO: Add authorization check for restaurant access
    console.log("=== SMS sendSms controller called ===");
    console.log("Restaurant ID:", restaurantId);
    console.log("SendSmsDto received:", sendSmsDto);
    console.log("SendSmsDto type:", typeof sendSmsDto);
    console.log("SendSmsDto keys:", Object.keys(sendSmsDto));
    console.log("Raw request body:", req.body);
    console.log("sendSmsDto.numbers:", sendSmsDto.numbers);
    console.log("sendSmsDto.message:", sendSmsDto.message);

    return this.smsService.sendSms(restaurantId, sendSmsDto);
  }

  @Get("credits")
  @ApiOperation({ summary: "Get SMS credits balance" })
  @ApiResponse({
    status: 200,
    description: "SMS credits retrieved successfully",
  })
  @ApiParam({ name: "restaurantId", description: "Restaurant ID" })
  async getCredits(
    @Param("restaurantId") restaurantId: string,
    @Request() req,
  ) {
    // TODO: Add authorization check for restaurant access
    return this.smsService.getSmsCredits(restaurantId);
  }

  @Get("sender-ids")
  @ApiOperation({ summary: "Get available sender IDs" })
  @ApiResponse({
    status: 200,
    description: "Sender IDs retrieved successfully",
  })
  @ApiParam({ name: "restaurantId", description: "Restaurant ID" })
  async getSenderIds(
    @Param("restaurantId") restaurantId: string,
    @Request() req,
  ) {
    // TODO: Add authorization check for restaurant access
    return this.smsService.getSenderIds(restaurantId);
  }

  @Post("request-sender-id")
  @ApiOperation({ summary: "Request a new sender ID" })
  @ApiResponse({
    status: 200,
    description: "Sender ID request submitted successfully",
  })
  @ApiParam({ name: "restaurantId", description: "Restaurant ID" })
  async requestSenderId(
    @Param("restaurantId") restaurantId: string,
    @Body() requestDto: RequestSenderIdDto,
    @Request() req,
  ) {
    // TODO: Add authorization check for restaurant access
    return this.smsService.requestSenderId(
      restaurantId,
      requestDto.senderId,
      requestDto.countryCode,
    );
  }

  @Put("config")
  @ApiOperation({ summary: "Update SMS configuration" })
  @ApiResponse({
    status: 200,
    description: "SMS configuration updated successfully",
  })
  @ApiParam({ name: "restaurantId", description: "Restaurant ID" })
  async updateConfig(
    @Param("restaurantId") restaurantId: string,
    @Body() configDto: UpdateSmsConfigDto,
    @Request() req,
  ) {
    // TODO: Add authorization check for restaurant access
    console.log("=== SMS updateConfig called ===");
    console.log("Restaurant ID:", restaurantId);
    console.log("Config data:", configDto);
    console.log("Config data type:", typeof configDto);
    console.log("Config data keys:", Object.keys(configDto));
    console.log("Raw request body:", req.body);

    try {
      // Update the configuration
      await this.smsService.updateSmsConfig(restaurantId, configDto);

      // Return the updated configuration in the same format as getConfig
      const updatedConfig = await this.smsService.getSmsConfig(
        restaurantId,
        req.user?.id,
      );
      console.log("SMS config updated successfully:", updatedConfig);

      return updatedConfig;
    } catch (error) {
      console.error("Error in SMS updateConfig:", error.message);
      throw error;
    }
  }

  @Post("test")
  @ApiOperation({ summary: "Test SMS configuration" })
  @ApiResponse({
    status: 200,
    description: "SMS test completed",
  })
  @ApiParam({ name: "restaurantId", description: "Restaurant ID" })
  async testConfig(
    @Param("restaurantId") restaurantId: string,
    @Request() req,
  ) {
    // TODO: Add authorization check for restaurant access
    return this.smsService.testSmsConfig(restaurantId);
  }

  @Get("config")
  @ApiOperation({ summary: "Get SMS configuration" })
  @ApiResponse({
    status: 200,
    description: "SMS configuration retrieved successfully",
  })
  @ApiParam({ name: "restaurantId", description: "Restaurant ID" })
  async getConfig(@Param("restaurantId") restaurantId: string, @Request() req) {
    // Add authorization check for restaurant access
    console.log("=== SMS getConfig called ===");
    console.log("Restaurant ID:", restaurantId);
    console.log(
      "User from request:",
      req.user
        ? {
            id: req.user.id,
            email: req.user.email,
            role: req.user.role,
          }
        : "NO USER FOUND",
    );
    console.log("Request headers:", {
      authorization: req.headers.authorization
        ? "Bearer [REDACTED]"
        : "NO AUTH HEADER",
      userAgent: req.headers["user-agent"],
    });

    try {
      const result = await this.smsService.getSmsConfig(
        restaurantId,
        req.user.id,
      );
      console.log(
        "SMS config retrieved successfully for restaurant:",
        restaurantId,
      );
      return result;
    } catch (error) {
      console.error("Error in SMS getConfig:", error.message);
      throw error;
    }
  }

  @Post("test-reservation-confirmation")
  @ApiOperation({ summary: "Test reservation confirmation SMS" })
  @ApiResponse({
    status: 200,
    description: "Reservation confirmation SMS test completed",
  })
  @ApiParam({ name: "restaurantId", description: "Restaurant ID" })
  async testReservationConfirmation(
    @Param("restaurantId") restaurantId: string,
    @Body()
    testData: {
      guestName: string;
      guestPhone: string;
      restaurantName: string;
      startTime: string; // ISO string
      numberOfGuests: number;
      tableNumber?: string;
    },
    @Request() req,
  ) {
    console.log("=== Testing reservation confirmation SMS ===");
    console.log("Restaurant ID:", restaurantId);
    console.log("Test data:", testData);

    return this.smsService.sendReservationConfirmation(restaurantId, {
      ...testData,
      startTime: new Date(testData.startTime),
    });
  }

  @Post("test-reservation-cancellation")
  @ApiOperation({ summary: "Test reservation cancellation SMS" })
  @ApiResponse({
    status: 200,
    description: "Reservation cancellation SMS test completed",
  })
  @ApiParam({ name: "restaurantId", description: "Restaurant ID" })
  async testReservationCancellation(
    @Param("restaurantId") restaurantId: string,
    @Body()
    testData: {
      guestName: string;
      guestPhone: string;
      restaurantName: string;
      startTime: string; // ISO string
      numberOfGuests: number;
      tableNumber?: string;
    },
    @Request() req,
  ) {
    console.log("=== Testing reservation cancellation SMS ===");
    console.log("Restaurant ID:", restaurantId);
    console.log("Test data:", testData);

    return this.smsService.sendReservationCancellation(restaurantId, {
      ...testData,
      startTime: new Date(testData.startTime),
    });
  }
}
