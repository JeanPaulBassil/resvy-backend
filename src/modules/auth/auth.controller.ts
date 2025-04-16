import {
  Controller,
  Post,
  Req,
  Body,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { PrismaService } from "nestjs-prisma";
import * as admin from "firebase-admin";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
  ) {}

  @Post("login")
  @ApiOperation({ summary: "Login with Firebase token" })
  @ApiResponse({ status: 200, description: "Login successful" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async login(@Req() req, @Body() body: { name: string; email: string }) {
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      throw new HttpException("No token provided", HttpStatus.UNAUTHORIZED);
    }

    try {
      return await this.authService.login(token, body);
    } catch (error) {
      console.error("Authentication Error:", error);
      throw new HttpException(
        error.message || "Authentication failed",
        error.status || HttpStatus.UNAUTHORIZED,
      );
    }
  }

  @Post("check-admin")
  @ApiOperation({ summary: "Check if user is an admin" })
  @ApiResponse({ status: 200, description: "User is admin" })
  @ApiResponse({ status: 401, description: "Unauthorized or not admin" })
  async checkAdmin(@Req() req, @Body() body: { email: string }) {
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      throw new HttpException("No token provided", HttpStatus.UNAUTHORIZED);
    }

    try {
      console.log(`Checking admin status for email: ${body.email}`);

      // Add more debug logging
      if (req.user) {
        console.log(
          `Request contains user with role: ${req.user.role}, email: ${req.user.email}`,
        );
      } else {
        console.log("No user object in request");
      }

      const result = await this.authService.checkAdmin(token);
      console.log(
        `Admin check successful, returning user with role: ${result.user?.role}`,
      );
      return result;
    } catch (error) {
      console.error("Admin Check Error:", error);
      throw new HttpException(
        error.message || "Admin check failed",
        error.status || HttpStatus.UNAUTHORIZED,
      );
    }
  }

  @Post("set-admin")
  @ApiOperation({ summary: "Manually set a user as admin (TEMPORARY)" })
  @ApiResponse({ status: 200, description: "User role updated" })
  @ApiResponse({ status: 404, description: "User not found" })
  async setUserAsAdmin(@Body() body: { email: string }) {
    try {
      console.log(`Attempting to set user with email ${body.email} as admin`);

      // Find user by email
      const user = await this.prisma.user.findUnique({
        where: { email: body.email.toLowerCase() },
      });

      if (!user) {
        console.error(`User with email ${body.email} not found`);
        throw new HttpException("User not found", HttpStatus.NOT_FOUND);
      }

      console.log(`Found user: ${user.id}, current role: ${user.role}`);

      // Update user role to ADMIN
      const updatedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: { role: "ADMIN" },
      });

      console.log(`Updated user role to ADMIN: ${updatedUser.id}`);

      // Try to set custom claim in Firebase
      try {
        await admin
          .auth()
          .setCustomUserClaims(user.firebaseUid, { admin: true });
        console.log(`Set admin claim in Firebase for user ${user.firebaseUid}`);
      } catch (firebaseError) {
        console.error(
          `Failed to set admin claim in Firebase: ${firebaseError.message}`,
        );
      }

      return {
        message: "User role updated to ADMIN",
        user: updatedUser,
      };
    } catch (error) {
      console.error("Error setting admin role:", error);
      throw new HttpException(
        error.message || "Failed to update user role",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
