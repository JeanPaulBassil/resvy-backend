import { Injectable, UnauthorizedException, Logger } from "@nestjs/common";
import { UserService } from "../user/user.service";
import { AllowedEmailService } from "../allowed-email/allowed-email.service";
import { admin } from "../../config/firebase-admin";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userService: UserService,
    private allowedEmailService: AllowedEmailService,
  ) {}

  async verifyToken(token: string) {
    if (!token) {
      throw new UnauthorizedException("No token provided");
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      return decodedToken;
    } catch (error) {
      throw new UnauthorizedException("Invalid token");
    }
  }

  async login(token: string, userData: { name: string; email: string }) {
    this.logger.log(`Login attempt with email: ${userData.email}`);

    const decodedToken = await this.verifyToken(token);
    const firebaseUid = decodedToken.uid;
    const email = userData.email.toLowerCase();

    this.logger.log(`Firebase UID: ${firebaseUid}, email: ${email}`);

    // Check for admin claim in Firebase token
    const hasAdminClaim = decodedToken.admin === true;
    this.logger.log(`Firebase token has admin claim: ${hasAdminClaim}`);

    // Check if email is allowed
    this.logger.log(`Checking if email ${email} is allowed`);
    const isAllowed = await this.allowedEmailService.isEmailAllowed(email);
    this.logger.log(`Email allowed: ${isAllowed}`);

    // Create or update user
    this.logger.log(`Creating/updating user with UID: ${firebaseUid}`);
    try {
      let user = await this.userService.createUser(
        firebaseUid,
        email,
        userData.name,
      );

      this.logger.log(
        `User created/updated successfully: ${user.id}, role: ${user.role}`,
      );

      // Also log the role type and value to help with debugging
      this.logger.log(
        `User role type: ${typeof user.role}, value: ${String(user.role)}`,
      );

      // If Firebase token has admin claim but user is not admin in database, update role
      if (hasAdminClaim && String(user.role) !== "ADMIN") {
        this.logger.log(
          `User has admin claim in Firebase but not in database. Updating role to ADMIN`,
        );

        user = await this.userService.updateUser(user.id, { role: "ADMIN" });

        this.logger.log(`Updated user role to ADMIN: ${user.id}`);
      }

      // Check if user is admin using string comparison to be safe
      const isAdmin = String(user.role) === "ADMIN";
      this.logger.log(`User is admin? ${isAdmin}`);

      if (!isAllowed && !isAdmin) {
        // Throw unauthorized, but include the user data
        // This allows the frontend to know the user exists but isn't allowed yet
        this.logger.warn(`User ${email} not allowed to access the system`);
        throw new UnauthorizedException({
          message: "Email not allowed to access the system",
          user: {
            id: user.id,
            firebaseUid: user.firebaseUid,
            email: user.email,
            name: user.name,
            role: user.role,
            isRegistered: true,
            isAllowed: false,
          },
        });
      }

      return {
        message: "Login successful",
        user: {
          ...user,
          isAllowed: true, // Add isAllowed flag for frontend compatibility
        },
      };
    } catch (error) {
      this.logger.error(
        `Error creating/updating user: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async checkAdmin(token: string) {
    // Verify the token first
    const decodedToken = await this.verifyToken(token);
    const firebaseUid = decodedToken.uid;

    console.log(`Checking admin status for user with UID: ${firebaseUid}`);

    // Get the user from the database
    const user = await this.userService.getUserByUid(firebaseUid);

    console.log(
      "User found:",
      user
        ? `email: ${user.email}, role: ${user.role}, roleType: ${typeof user.role}`
        : "No user found",
    );

    // If user doesn't exist, throw an error
    if (!user) {
      console.log("User not found in database");
      throw new UnauthorizedException("User not found");
    }

    // Check if the user is an admin using string comparison for safety
    const isAdmin = String(user.role) === "ADMIN";
    console.log(`Is admin (string comparison): ${isAdmin}`);

    // Also log direct comparison for debugging
    console.log(`Direct role comparison: ${user.role === "ADMIN"}`);

    // If user is not an admin, throw an error
    if (!isAdmin) {
      console.log(
        `User is not an admin. Role: ${user.role}, Type: ${typeof user.role}`,
      );
      throw new UnauthorizedException("User is not an admin");
    }

    // If we get here, the user is an admin
    console.log(`User is confirmed as admin: ${user.email}`);
    return {
      message: "User is admin",
      user,
      // Include any other data needed for the frontend
      isAdmin: true,
    };
  }
}
