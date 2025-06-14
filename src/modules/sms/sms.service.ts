import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { PrismaService } from "nestjs-prisma";
import axios from "axios";

export interface SmsConfig {
  username: string;
  password: string;
  senderId: string;
  confirmationEnabled?: boolean;
  cancellationEnabled?: boolean;
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
   * Send SMS using SMS service API
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

      // Parse and analyze the response
      const responseText = String(response.data).toLowerCase();
      console.log("=== Best2SMS Response Analysis ===");
      console.log("Response text (lowercase):", responseText);

      // Check for common error patterns
      const isError =
        responseText.includes("error") ||
        responseText.includes("invalid") ||
        responseText.includes("failed") ||
        responseText.includes("insufficient") ||
        responseText.includes("no credit") ||
        responseText.includes("unauthorized");

      const isSuccess =
        responseText.includes("sms sent") ||
        responseText.includes("message sent") ||
        responseText.includes("delivered");

      console.log("Contains error indicators:", isError);
      console.log("Contains success indicators:", isSuccess);

      // Check for credit issues
      if (responseText.includes("credit") || responseText.includes("balance")) {
        console.log(
          "⚠️  CREDIT/BALANCE mentioned in response - possible low credits!",
        );
      }

      // Check for authentication issues
      if (
        responseText.includes("invalid") ||
        responseText.includes("unauthorized")
      ) {
        console.log("🔐 AUTHENTICATION issue detected!");
      }

      // Check for phone number issues
      if (responseText.includes("number") && responseText.includes("invalid")) {
        console.log("📱 PHONE NUMBER format issue detected!");
      }

      this.logger.log(`SMS sent to ${numbers}: ${response.data}`);

      // Return success/failure based on response analysis
      if (isError && !isSuccess) {
        console.log("❌ SMS sending failed based on response analysis");
        return {
          success: false,
          message: `SMS sending failed: ${response.data}`,
          data: response.data,
        };
      }

      console.log("✅ SMS sending appears successful");

      // Also check credits after sending to see if account has balance
      try {
        const creditsResponse = await this.getSmsCredits(restaurantId);
        console.log("📊 SMS Credits after sending:", creditsResponse.credits);
        if (creditsResponse.credits <= 0) {
          console.log(
            "⚠️  WARNING: SMS account has 0 credits - SMS may not be delivered!",
          );
        }
      } catch (error) {
        console.log("Could not check SMS credits:", error.message);
      }

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

      // Parse credits from HTML response - extract numbers from the response
      let credits = 0;
      const responseText = String(response.data);
      console.log("Raw response text:", responseText);

      // Look for numbers in the response (credits are usually displayed as numbers)
      // Match larger numbers first (3+ digits) to avoid matching HTML entities
      const numberMatch = responseText.match(/(\d{3,}(?:\.\d+)?)/);
      if (numberMatch) {
        credits = parseFloat(numberMatch[1]) || 0;
        console.log("Found credits in response:", numberMatch[1]);
      } else {
        // Fallback to any number if no large number found
        const anyNumberMatch = responseText.match(/(\d+(?:\.\d+)?)/);
        if (anyNumberMatch) {
          credits = parseFloat(anyNumberMatch[1]) || 0;
          console.log(
            "Found credits (fallback) in response:",
            anyNumberMatch[1],
          );
        } else {
          console.log("No credits found in response");
        }
      }

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
        errorMessage = "Request timed out - SMS service is slow to respond";
      } else if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        errorMessage = "Invalid SMS credentials";
      } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
        errorMessage = "Cannot connect to SMS service";
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
    if (config.confirmationEnabled !== undefined) {
      updateData.smsConfirmationEnabled = config.confirmationEnabled;
      console.log(
        "Setting smsConfirmationEnabled to:",
        config.confirmationEnabled,
      );
    }
    if (config.cancellationEnabled !== undefined) {
      updateData.smsCancellationEnabled = config.cancellationEnabled;
      console.log(
        "Setting smsCancellationEnabled to:",
        config.cancellationEnabled,
      );
    }

    updateData.smsLastUpdated = new Date();

    console.log("Final updateData object:", {
      smsEnabled: updateData.smsEnabled,
      smsUsername: updateData.smsUsername ? "[REDACTED]" : "NULL/EMPTY",
      smsPassword: updateData.smsPassword ? "[REDACTED]" : "NULL/EMPTY",
      smsSenderId: updateData.smsSenderId,
      smsConfirmationEnabled: updateData.smsConfirmationEnabled,
      smsCancellationEnabled: updateData.smsCancellationEnabled,
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
      smsConfirmationEnabled: result.smsConfirmationEnabled,
      smsCancellationEnabled: result.smsCancellationEnabled,
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
        smsConfirmationEnabled: true,
        smsCancellationEnabled: true,
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
      smsConfirmationEnabled: restaurant?.smsConfirmationEnabled,
      smsCancellationEnabled: restaurant?.smsCancellationEnabled,
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
      confirmationEnabled: restaurant.smsConfirmationEnabled ?? true,
      cancellationEnabled: restaurant.smsCancellationEnabled ?? true,
    };

    console.log("Final result being returned:", {
      enabled: result.enabled,
      username: result.username ? "[REDACTED]" : "EMPTY",
      password: result.password ? "[REDACTED]" : "EMPTY",
      senderId: result.senderId,
      credits: result.credits,
      lastUpdated: result.lastUpdated,
      confirmationEnabled: result.confirmationEnabled,
      cancellationEnabled: result.cancellationEnabled,
    });

    return result;
  }

  /**
   * Send reservation confirmation SMS
   */
  async sendReservationConfirmation(
    restaurantId: string,
    reservationData: {
      guestName: string;
      guestPhone: string;
      restaurantName: string;
      startTime: Date;
      numberOfGuests: number;
      tableNumber?: string;
    },
  ): Promise<SmsResponse> {
    try {
      // Check if confirmation SMS is enabled for this restaurant
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: {
          smsEnabled: true,
          smsConfirmationEnabled: true,
        },
      });

      if (!restaurant) {
        return {
          success: false,
          message: "Restaurant not found",
        };
      }

      if (!restaurant.smsEnabled) {
        console.log("⚠️ SMS not enabled for restaurant");
        return {
          success: false,
          message: "SMS is not enabled for this restaurant",
        };
      }

      if (!restaurant.smsConfirmationEnabled) {
        console.log(
          "⚠️ SMS confirmation notifications are disabled for this restaurant",
        );
        return {
          success: false,
          message: "SMS confirmation notifications are disabled",
        };
      }
      // Format the date and time
      const startTime = reservationData.startTime;

      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      const dayName = dayNames[startTime.getDay()];
      const monthName = monthNames[startTime.getMonth()];
      const dayNumber = startTime.getDate().toString();
      const year = startTime.getFullYear().toString();

      // Format time in 12-hour format
      let hours = startTime.getHours();
      const minutes = startTime.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 should be 12

      const time = `${hours}:${minutes.toString().padStart(2, "0")}`;

      // Determine guest plural
      const guestPlural =
        reservationData.numberOfGuests === 1 ? "guest" : "guests";

      // Create the confirmation message
      const message = `Dear ${reservationData.guestName}, your reservation has been confirmed on ${dayName}, ${monthName} ${dayNumber}, ${year} at ${time} ${ampm} for ${reservationData.numberOfGuests} ${guestPlural}.`;

      console.log("=== Sending Reservation Confirmation SMS ===");
      console.log("Restaurant ID:", restaurantId);
      console.log("Guest:", reservationData.guestName);
      console.log("Phone:", reservationData.guestPhone);
      console.log("Final Message:", message);
      console.log("📏 Message Length:", message.length, "characters");

      return this.sendSms(restaurantId, {
        numbers: reservationData.guestPhone,
        message: message,
        textType: "text",
      });
    } catch (error) {
      this.logger.error(
        `Failed to send reservation confirmation SMS: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        message: error.message || "Failed to send reservation confirmation SMS",
      };
    }
  }

  /**
   * Send reservation cancellation SMS
   */
  async sendReservationCancellation(
    restaurantId: string,
    reservationData: {
      guestName: string;
      guestPhone: string;
      restaurantName: string;
      startTime: Date;
      numberOfGuests: number;
      tableNumber?: string;
    },
  ): Promise<SmsResponse> {
    try {
      // Check if cancellation SMS is enabled for this restaurant
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: {
          smsEnabled: true,
          smsCancellationEnabled: true,
        },
      });

      if (!restaurant) {
        return {
          success: false,
          message: "Restaurant not found",
        };
      }

      if (!restaurant.smsEnabled) {
        console.log("⚠️ SMS not enabled for restaurant");
        return {
          success: false,
          message: "SMS is not enabled for this restaurant",
        };
      }

      if (!restaurant.smsCancellationEnabled) {
        console.log(
          "⚠️ SMS cancellation notifications are disabled for this restaurant",
        );
        return {
          success: false,
          message: "SMS cancellation notifications are disabled",
        };
      }
      // Format the date and time
      const startTime = reservationData.startTime;

      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      const dayName = dayNames[startTime.getDay()];
      const monthName = monthNames[startTime.getMonth()];
      const dayNumber = startTime.getDate().toString();
      const year = startTime.getFullYear().toString();

      // Format time in 12-hour format
      let hours = startTime.getHours();
      const minutes = startTime.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 should be 12

      const time = `${hours}:${minutes.toString().padStart(2, "0")}`;

      // Determine guest plural
      const guestPlural =
        reservationData.numberOfGuests === 1 ? "guest" : "guests";

      // Create the cancellation message (shortened to fit SMS limit)
      const message = `Dear ${reservationData.guestName}, your reservation on ${dayName}, ${monthName} ${dayNumber}, ${year} at ${time} ${ampm} for ${reservationData.numberOfGuests} ${guestPlural} has been cancelled.`;

      console.log("=== Sending Reservation Cancellation SMS ===");
      console.log("Restaurant ID:", restaurantId);
      console.log("Guest:", reservationData.guestName);
      console.log("Phone:", reservationData.guestPhone);
      console.log("Final Message:", message);
      console.log("📏 Message Length:", message.length, "characters");

      // Check if message is too long for SMS (160 chars for single SMS)
      if (message.length > 160) {
        console.log(
          "⚠️  WARNING: Message exceeds 160 characters - will be sent as multiple SMS or may fail",
        );
      }

      return this.sendSms(restaurantId, {
        numbers: reservationData.guestPhone,
        message: message,
        textType: "text",
      });
    } catch (error) {
      this.logger.error(
        `Failed to send reservation cancellation SMS: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        message: error.message || "Failed to send reservation cancellation SMS",
      };
    }
  }
}
