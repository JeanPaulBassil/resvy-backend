import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { PrismaService } from "nestjs-prisma";
import axios from "axios";

export interface SmsConfig {
  username: string;
  password: string;
  senderId: string;
}

export interface SendSmsOptions {
  numbers: string | string[]; // Phone number(s)
  message: string;
  textType?: "text" | "unicode"; // text for English, unicode for Arabic
  scheduledTime?: Date; // Optional scheduling
}

export interface SmsResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface SmsCreditsResponse {
  credits: number;
  success: boolean;
}

export interface SmsSenderIdsResponse {
  senderIds: string[];
  success: boolean;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly baseUrl = "http://best2sms.com/http.php";

  constructor(private prisma: PrismaService) {}

  /**
   * Send SMS using Best2sms API
   */
  async sendSms(
    restaurantId: string,
    options: SendSmsOptions,
  ): Promise<SmsResponse> {
    try {
      // Get restaurant SMS configuration
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: {
          smsEnabled: true,
          smsUsername: true,
          smsPassword: true,
          smsSenderId: true,
        },
      });

      if (!restaurant) {
        throw new BadRequestException("Restaurant not found");
      }

      if (!restaurant.smsEnabled) {
        throw new BadRequestException("SMS is not enabled for this restaurant");
      }

      if (
        !restaurant.smsUsername ||
        !restaurant.smsPassword ||
        !restaurant.smsSenderId
      ) {
        throw new BadRequestException("SMS configuration is incomplete");
      }

      // Prepare phone numbers
      const numbers = Array.isArray(options.numbers)
        ? options.numbers.join(",")
        : options.numbers;

      // Prepare message content
      let message = options.message;
      if (options.textType === "unicode") {
        // URL encode for Arabic text
        message = encodeURIComponent(message);
      }

      // Build request parameters
      const params = new URLSearchParams({
        username: restaurant.smsUsername,
        password: restaurant.smsPassword,
        msg: message,
        texttype: options.textType || "text",
        numbers: numbers,
        sender: restaurant.smsSenderId,
      });

      // Add scheduled time if provided
      if (options.scheduledTime) {
        const dtime = options.scheduledTime
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");
        params.append("dtime", dtime);
      }

      // Send SMS request
      console.log("=== Best2SMS sendSms API Call ===");
      console.log("=== DEBUG: Input validation ===");
      console.log("options received:", options);
      console.log("options.message:", options.message);
      console.log("options.numbers:", options.numbers);
      console.log("message variable:", message);
      console.log("numbers variable:", numbers);
      
      console.log("Request URL:", `${this.baseUrl}?${params.toString()}`);
      console.log("Request params:", {
        username: restaurant.smsUsername,
        password: "[REDACTED]",
        msg:
          message && message.length > 50
            ? message.substring(0, 50) + "..."
            : message,
        texttype: options.textType || "text",
        numbers: numbers,
        sender: restaurant.smsSenderId,
        dtime: params.get("dtime") || "not set",
      });

      const response = await axios.get(`${this.baseUrl}?${params.toString()}`, {
        timeout: 30000, // 30 seconds timeout
      });

      console.log("=== Best2SMS sendSms API Response ===");
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);
      console.log("Response data:", response.data);
      console.log("Response data type:", typeof response.data);

      this.logger.log(`SMS sent to ${numbers}: ${response.data}`);

      return {
        success: true,
        message: "SMS sent successfully",
        data: response.data,
      };
    } catch (error) {
      this.logger.error(`Failed to send SMS: ${error.message}`, error.stack);
      return {
        success: false,
        message: error.message || "Failed to send SMS",
      };
    }
  }

  /**
   * Get SMS credits for a restaurant
   */
  async getSmsCredits(restaurantId: string): Promise<SmsCreditsResponse> {
    try {
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: {
          smsUsername: true,
          smsPassword: true,
        },
      });

      if (!restaurant?.smsUsername || !restaurant?.smsPassword) {
        throw new BadRequestException("SMS credentials not configured");
      }

      const params = new URLSearchParams({
        username: restaurant.smsUsername,
        password: restaurant.smsPassword,
        type: "credits",
      });

      console.log("=== Best2SMS getSmsCredits API Call ===");
      console.log("Request URL:", `${this.baseUrl}?${params.toString()}`);
      console.log("Request params:", {
        username: restaurant.smsUsername,
        password: "[REDACTED]",
        type: "credits",
      });

      const response = await axios.get(`${this.baseUrl}?${params.toString()}`);
      
      console.log("=== Best2SMS getSmsCredits API Response ===");
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);
      console.log("Response data:", response.data);
      console.log("Response data type:", typeof response.data);
      
      const credits = parseInt(response.data) || 0;
      console.log("Parsed credits:", credits);

      // Update credits in database
      await this.prisma.restaurant.update({
        where: { id: restaurantId },
        data: {
          smsCredits: credits,
          smsLastUpdated: new Date(),
        },
      });

      return {
        credits,
        success: true,
      };
    } catch (error) {
      this.logger.error(`Failed to get SMS credits: ${error.message}`);
      return {
        credits: 0,
        success: false,
      };
    }
  }

  /**
   * Get available sender IDs for a restaurant
   */
  async getSenderIds(restaurantId: string): Promise<SmsSenderIdsResponse> {
    try {
      console.log("Getting sender IDs for restaurant:", restaurantId);

      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: {
          smsUsername: true,
          smsPassword: true,
        },
      });

      if (!restaurant?.smsUsername || !restaurant?.smsPassword) {
        console.log(
          "SMS credentials not configured for restaurant:",
          restaurantId,
        );
        return {
          senderIds: [],
          success: false,
        };
      }

      const params = new URLSearchParams({
        username: restaurant.smsUsername,
        password: restaurant.smsPassword,
        type: "senders",
      });

      console.log("Making Best2SMS API call for sender IDs...");

      console.log("=== Best2SMS getSenderIds API Call ===");
      console.log("Request URL:", `${this.baseUrl}?${params.toString()}`);
      console.log("Request params:", {
        username: restaurant.smsUsername,
        password: "[REDACTED]",
        type: "senders",
      });

      const response = await axios.get(`${this.baseUrl}?${params.toString()}`, {
        timeout: 25000, // 25 second timeout
        headers: {
          "User-Agent": "Restaurant-SMS-Service/1.0",
        },
      });

      console.log("=== Best2SMS getSenderIds API Response ===");
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);
      console.log("Best2SMS response:", response.data);
      console.log("Response data type:", typeof response.data);

      // Handle different response formats
      let senderIds: string[] = [];

      if (typeof response.data === "string") {
        // Parse sender IDs from response (assuming comma-separated or line-separated)
        senderIds = response.data
          .split(/[,\n\r\t]/)
          .map((id: string) => id.trim())
          .filter(
            (id: string) =>
              id.length > 0 && !id.toLowerCase().includes("error"),
          );
      } else if (Array.isArray(response.data)) {
        senderIds = response.data
          .map((id) => String(id).trim())
          .filter((id) => id.length > 0);
      } else if (response.data && typeof response.data === "object") {
        // Handle object response
        if (Array.isArray(response.data.senderIds)) {
          senderIds = response.data.senderIds;
        } else if (Array.isArray(response.data.data)) {
          senderIds = response.data.data;
        }
      }

      console.log("Parsed sender IDs:", senderIds);

      return {
        senderIds,
        success: true,
      };
    } catch (error) {
      console.error("Failed to get sender IDs:", error);

      let errorMessage = "Failed to get sender IDs";

      if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        errorMessage = "Request timed out - Best2SMS API is slow to respond";
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        errorMessage = "Invalid SMS credentials";
      } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
        errorMessage = "Cannot connect to Best2SMS API";
      }

      this.logger.error(`${errorMessage}: ${error.message}`);

      return {
        senderIds: [],
        success: false,
      };
    }
  }

  /**
   * Request a new sender ID
   */
  async requestSenderId(
    restaurantId: string,
    senderId: string,
    countryCode: string,
  ): Promise<SmsResponse> {
    try {
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: {
          smsUsername: true,
          smsPassword: true,
        },
      });

      if (!restaurant?.smsUsername || !restaurant?.smsPassword) {
        throw new BadRequestException("SMS credentials not configured");
      }

      const params = new URLSearchParams({
        username: restaurant.smsUsername,
        password: restaurant.smsPassword,
        type: "requestsender",
        sender: senderId,
        countrycode: countryCode,
      });

      console.log("=== Best2SMS requestSenderId API Call ===");
      console.log("Request URL:", `${this.baseUrl}?${params.toString()}`);
      console.log("Request params:", {
        username: restaurant.smsUsername,
        password: "[REDACTED]",
        type: "requestsender",
        sender: senderId,
        countrycode: countryCode,
      });

      const response = await axios.get(`${this.baseUrl}?${params.toString()}`);

      console.log("=== Best2SMS requestSenderId API Response ===");
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);
      console.log("Response data:", response.data);
      console.log("Response data type:", typeof response.data);

      return {
        success: true,
        message: "Sender ID request submitted",
        data: response.data,
      };
    } catch (error) {
      this.logger.error(`Failed to request sender ID: ${error.message}`);
      return {
        success: false,
        message: error.message || "Failed to request sender ID",
      };
    }
  }

  /**
   * Update SMS configuration for a restaurant
   */
  async updateSmsConfig(
    restaurantId: string,
    config: Partial<SmsConfig> & { enabled?: boolean },
  ) {
    console.log("=== updateSmsConfig Debug ===");
    console.log("Restaurant ID:", restaurantId);
    console.log("Received config:", {
      enabled: config.enabled,
      username: config.username ? "[REDACTED]" : "NULL/EMPTY",
      password: config.password ? "[REDACTED]" : "NULL/EMPTY",
      senderId: config.senderId,
    });

    const updateData: any = {};

    if (config.enabled !== undefined) {
      updateData.smsEnabled = config.enabled;
      console.log("Setting smsEnabled to:", config.enabled);
    }
    if (config.username) {
      updateData.smsUsername = config.username;
      console.log("Setting smsUsername to: [REDACTED]");
    }
    if (config.password) {
      updateData.smsPassword = config.password;
      console.log("Setting smsPassword to: [REDACTED]");
    }
    if (config.senderId) {
      updateData.smsSenderId = config.senderId;
      console.log("Setting smsSenderId to:", config.senderId);
    }

    updateData.smsLastUpdated = new Date();

    console.log("Final updateData object:", {
      smsEnabled: updateData.smsEnabled,
      smsUsername: updateData.smsUsername ? "[REDACTED]" : "NULL/EMPTY",
      smsPassword: updateData.smsPassword ? "[REDACTED]" : "NULL/EMPTY",
      smsSenderId: updateData.smsSenderId,
      smsLastUpdated: updateData.smsLastUpdated,
    });

    const result = await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: updateData,
    });

    console.log("Database update result:", {
      id: result.id,
      smsEnabled: result.smsEnabled,
      smsUsername: result.smsUsername ? "[REDACTED]" : "NULL/EMPTY",
      smsPassword: result.smsPassword ? "[REDACTED]" : "NULL/EMPTY",
      smsSenderId: result.smsSenderId,
      smsLastUpdated: result.smsLastUpdated,
    });

    return result;
  }

  /**
   * Test SMS configuration
   */
  async testSmsConfig(restaurantId: string): Promise<SmsResponse> {
    return this.sendSms(restaurantId, {
      numbers: "96171096633", // Test number from docs
      message: "Test message from restaurant system",
      textType: "text",
    });
  }

  /**
   * Get SMS configuration for a restaurant
   */
  async getSmsConfig(restaurantId: string, userId?: string) {
    console.log("=== getSmsConfig Debug ===");
    console.log("Restaurant ID:", restaurantId);
    console.log("User ID:", userId);

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        ownerId: true,
        smsEnabled: true,
        smsUsername: true,
        smsPassword: true,
        smsSenderId: true,
        smsCredits: true,
        smsLastUpdated: true,
      },
    });

    console.log("Raw restaurant data from DB:", {
      ownerId: restaurant?.ownerId,
      smsEnabled: restaurant?.smsEnabled,
      smsUsername: restaurant?.smsUsername ? "[REDACTED]" : "NULL/EMPTY",
      smsPassword: restaurant?.smsPassword ? "[REDACTED]" : "NULL/EMPTY",
      smsSenderId: restaurant?.smsSenderId,
      smsCredits: restaurant?.smsCredits,
      smsLastUpdated: restaurant?.smsLastUpdated,
    });

    if (!restaurant) {
      throw new BadRequestException("Restaurant not found");
    }

    // Check if user has permission to access this restaurant
    if (userId && restaurant.ownerId !== userId) {
      console.log("Authorization check failed:");
      console.log("Restaurant owner ID:", restaurant.ownerId);
      console.log("Requesting user ID:", userId);
      
      // Check if user is admin
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      console.log("User role:", user?.role);

      if (!user || user.role !== "ADMIN") {
        throw new BadRequestException(
          "You don't have permission to access this restaurant's SMS configuration",
        );
      }
    }

    const result = {
      enabled: restaurant.smsEnabled || false,
      username: restaurant.smsUsername || "",
      password: restaurant.smsPassword || "",
      senderId: restaurant.smsSenderId || "",
      credits: restaurant.smsCredits || 0,
      lastUpdated: restaurant.smsLastUpdated,
    };

    console.log("Final result being returned:", {
      enabled: result.enabled,
      username: result.username ? "[REDACTED]" : "EMPTY",
      password: result.password ? "[REDACTED]" : "EMPTY", 
      senderId: result.senderId,
      credits: result.credits,
      lastUpdated: result.lastUpdated,
    });

    return result;
  }
}
