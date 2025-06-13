import * as admin from "firebase-admin";
import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { PrismaService } from "nestjs-prisma";
import { UserService } from "../modules/user/user.service";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuthMiddleware.name);

  constructor(
    private prisma: PrismaService,
    private userService: UserService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split("Bearer ")[1];

    // Log SMS-related requests for debugging
    if (req.url.includes("/sms/")) {
      console.log("=== AUTH MIDDLEWARE - SMS Request ===");
      console.log("URL:", req.url);
      console.log("Method:", req.method);
      console.log("Has token:", !!token);
    }

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      this.logger.log(`Verifying token: ${token.substring(0, 10)}...`);
      const decodedToken = await admin.auth().verifyIdToken(token);
      this.logger.log(
        `Token verified successfully for user: ${decodedToken.uid}`,
      );

      // Check if the user's token has been revoked
      const isRevoked = await this.userService.isUserRevoked(decodedToken.uid);
      if (isRevoked) {
        this.logger.warn(
          `Rejecting request from revoked user: ${decodedToken.uid}`,
        );

        // For admins, automatically remove from revoked list instead of blocking
        const existingUser = await this.prisma.user.findUnique({
          where: { firebaseUid: decodedToken.uid },
        });

        if (existingUser && String(existingUser.role) === "ADMIN") {
          this.logger.log(
            `User ${decodedToken.uid} is an admin, removing from revoked list automatically`,
          );
          await this.userService.removeUserFromRevokedList(decodedToken.uid);
          // Continue with the request for admins
        } else {
          return res.status(401).json({
            message: "Token revoked",
            error:
              "Your account has been deactivated. Please contact an administrator.",
            code: "AUTH_USER_DEACTIVATED",
          });
        }
      }

      let user = await this.prisma.user.findUnique({
        where: { firebaseUid: decodedToken.uid },
      });

      if (!user) {
        this.logger.warn(
          `User not found for Firebase UID: ${decodedToken.uid}`,
        );

        // Try to get Firebase user info
        try {
          const firebaseUser = await admin.auth().getUser(decodedToken.uid);
          this.logger.log(
            `Retrieved Firebase user: ${JSON.stringify(firebaseUser.toJSON())}`,
          );

          // If we have an email, try to create the user
          if (firebaseUser.email) {
            this.logger.log(
              `Attempting to auto-create user with email: ${firebaseUser.email}`,
            );

            try {
              user = await this.userService.createUser(
                decodedToken.uid,
                firebaseUser.email,
                firebaseUser.displayName || undefined,
              );

              this.logger.log(
                `Auto-created user: ${user.id}, role: ${user.role}`,
              );
            } catch (createError) {
              this.logger.error(
                `Failed to auto-create user: ${createError.message}`,
                createError.stack,
              );
            }
          }
        } catch (firebaseError) {
          this.logger.error(
            `Failed to retrieve Firebase user: ${firebaseError.message}`,
            firebaseError.stack,
          );
        }

        // If we still don't have a user, return 403
        if (!user) {
          return res.status(403).json({
            message: "User not found",
            error:
              "User exists in Firebase but not in the application database. Please log in again.",
          });
        }
      }

      // Check for admin claim in Firebase token
      if (decodedToken.admin === true && String(user.role) !== "ADMIN") {
        this.logger.log(
          `User ${decodedToken.uid} has admin claim in Firebase but not in database, updating role to ADMIN`,
        );

        // Update user to be admin
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { role: "ADMIN" },
        });

        this.logger.log(`Updated user role to ADMIN: ${user.id}`);
      }

      console.log("user", user);

      // Check if the user's email is in the AllowedEmail table
      const allowedEmail = await this.prisma.allowedEmail.findUnique({
        where: { email: user.email },
      });

      console.log("allowedEmail", allowedEmail);

      if (!allowedEmail && String(user.role) !== "ADMIN") {
        this.logger.warn(
          `User with non-allowed email attempting to access the system: ${decodedToken.uid}`,
        );

        // Log the user role for debugging
        this.logger.log(`User role: ${user.role}, type: ${typeof user.role}`);

        // Check if user is admin (using string comparison for safety)
        const isAdmin = String(user.role) === "ADMIN";
        if (!isAdmin) {
          this.logger.log(`User ${decodedToken.uid} email not in allowed list`);

          // IMPORTANT: Return 403 with a different code than for deactivated users
          return res.status(403).json({
            message: "Account not allowed",
            error:
              "Your account is pending approval. Please contact an administrator.",
            code: "AUTH_USER_PENDING_APPROVAL",
          });
        } else {
          this.logger.log(
            `User ${decodedToken.uid} is admin, bypassing email allowlist check`,
          );
        }
      }

      req["user"] = user;
      next();
    } catch (error) {
      this.logger.error(
        `Token verification failed: ${error.message}`,
        error.stack,
      );

      // Check for specific Firebase auth errors
      if (error.code === "auth/id-token-expired") {
        return res.status(401).json({
          message: "Token expired",
          error:
            "Your authentication token has expired. Please refresh the page to get a new token.",
        });
      } else if (error.code === "auth/id-token-revoked") {
        return res.status(401).json({
          message: "Token revoked",
          error:
            "Your authentication token has been revoked. Please log in again.",
        });
      } else if (error.code === "auth/invalid-id-token") {
        return res.status(401).json({
          message: "Invalid token",
          error: "Your authentication token is invalid. Please log in again.",
        });
      }

      // Generic error for other cases
      return res
        .status(401)
        .json({ message: "Invalid token", error: error.message });
    }
  }
}
