import { Injectable, Logger } from "@nestjs/common";
import { Role, User } from "@prisma/client";
import { PrismaService } from "nestjs-prisma";
import { AllowedEmailService } from "../allowed-email/allowed-email.service";
import { admin } from "../../config/firebase-admin";

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private prisma: PrismaService,
    private allowedEmailService: AllowedEmailService,
  ) {}

  async createUser(
    firebaseUid: string,
    email: string,
    name?: string,
  ): Promise<User> {
    this.logger.log(
      `Creating/updating user with firebaseUid: ${firebaseUid}, email: ${email}`,
    );

    try {
      // First check if a user with this Firebase UID already exists
      const existingUserByUid = await this.prisma.user.findUnique({
        where: { firebaseUid },
      });

      // If user exists with this UID, return it (no update needed)
      if (existingUserByUid) {
        this.logger.log(
          `User already exists with firebaseUid ${firebaseUid}, returning existing user`,
        );
        return existingUserByUid;
      }

      // Then check if a user with this email already exists
      const existingUserByEmail = await this.prisma.user.findUnique({
        where: { email },
      });

      // If a user already exists with this email, update the Firebase UID
      if (existingUserByEmail) {
        this.logger.log(
          `User already exists with email ${email} but different UID. Updating Firebase UID from ${existingUserByEmail.firebaseUid} to ${firebaseUid}`,
        );

        const updatedUser = await this.prisma.user.update({
          where: { id: existingUserByEmail.id },
          data: {
            firebaseUid, // Update to the new Firebase UID
            name: name || existingUserByEmail.name, // Keep existing name if no new one provided
          },
        });

        this.logger.log(
          `Updated user with new Firebase UID: ${updatedUser.id}, firebaseUid: ${updatedUser.firebaseUid}`,
        );
        return updatedUser;
      }

      // If no user exists with this UID or email, create a new one
      const newUser = await this.prisma.user.create({
        data: {
          firebaseUid,
          email,
          name,
          role: Role.USER,
        },
      });

      this.logger.log(
        `Created new user: ${newUser.id}, firebaseUid: ${newUser.firebaseUid}`,
      );
      return newUser;
    } catch (error) {
      this.logger.error(
        `Error creating/updating user: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getUserByUid(firebaseUid: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { firebaseUid },
    });
  }

  async findAllClients(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: Role;
    isAllowed?: boolean;
  }): Promise<{
    data: (User & { isAllowed: boolean })[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      role = Role.USER,
      isAllowed,
    } = params;
    const skip = (page - 1) * limit;

    // Get all allowed emails
    const allowedEmailRecords = await this.allowedEmailService.findAll();
    const allowedEmails = allowedEmailRecords.map((record) => record.email);

    // Build the where clause based on the provided filters
    const where: any = { role };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    // If we're filtering by allowed status, add that to the where clause
    if (isAllowed !== undefined) {
      if (isAllowed) {
        // Only include users whose email is in the allowed list
        where.email = { in: allowedEmails };
      } else {
        // Only include users whose email is NOT in the allowed list
        where.email = { notIn: allowedEmails };
      }
    }

    // Get total count for pagination
    const total = await this.prisma.user.count({ where });

    // Get the users with pagination
    const users = await this.prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    // Add isAllowed flag to each user
    const usersWithAllowedStatus = users.map((user) => ({
      ...user,
      isAllowed: allowedEmails.includes(user.email),
    }));

    return {
      data: usersWithAllowedStatus,
      total,
      page,
      limit,
    };
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async updateUserAllowedStatus(
    id: string,
    isAllowed: boolean,
  ): Promise<User & { isAllowed: boolean }> {
    // First, get the user to access their email
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Handle the AllowedEmail table
    if (isAllowed) {
      // If allowing the user, add their email to allowed emails
      const existingAllowedEmail = await this.allowedEmailService.findByEmail(
        user.email,
      );

      if (!existingAllowedEmail) {
        // Only create if it doesn't already exist
        await this.allowedEmailService.create({
          email: user.email,
          description: `Auto-added for client ${user.name || user.email}`,
          createdBy: "system",
        });
      }

      // If the user is being re-allowed, remove them from revoked users table
      await this.removeUserFromRevokedList(user.firebaseUid);
    } else {
      // If disallowing the user, remove their email from allowed emails
      const existingAllowedEmail = await this.allowedEmailService.findByEmail(
        user.email,
      );

      if (existingAllowedEmail) {
        await this.allowedEmailService.delete(existingAllowedEmail.id);
      }

      // Only revoke the user's session if they're being actively disallowed (deactivated)
      // This is different from a user who was never allowed in the first place
      await this.revokeUserSession(
        user.firebaseUid,
        "User disallowed by admin",
      );
    }

    return {
      ...user,
      isAllowed,
    };
  }

  async getUserById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Revokes a user's session by adding them to the revoked users table
   * and attempting to revoke their Firebase tokens
   */
  async revokeUserSession(firebaseUid: string, reason?: string): Promise<void> {
    // Add the user to the revoked users table
    await this.addUserToRevokedList(firebaseUid, reason);

    // Attempt to revoke Firebase tokens, but don't let failures affect our process
    try {
      // Try to revoke all Firebase tokens for this user
      await admin.auth().revokeRefreshTokens(firebaseUid);
      this.logger.log(
        `Successfully revoked Firebase tokens for user: ${firebaseUid}`,
      );
    } catch (error) {
      // Log the error but continue - our custom revocation mechanism will still work
      this.logger.error(
        `Error revoking Firebase tokens for user ${firebaseUid}:`,
        error,
      );
      this.logger.log(`Continuing with database revocation mechanism only`);
    }
  }

  /**
   * Add a user to the revoked users table
   */
  async addUserToRevokedList(
    firebaseUid: string,
    reason?: string,
  ): Promise<void> {
    this.logger.log(`Adding user ${firebaseUid} to revoked users table`);
    await this.prisma.revokedUser.upsert({
      where: { firebaseUid },
      update: { revokedAt: new Date(), reason },
      create: { firebaseUid, reason },
    });
  }

  /**
   * Remove a user from the revoked users table
   */
  async removeUserFromRevokedList(firebaseUid: string): Promise<void> {
    this.logger.log(`Removing user ${firebaseUid} from revoked users table`);
    await this.prisma.revokedUser.deleteMany({
      where: { firebaseUid },
    });
  }

  /**
   * Check if a user is in the revoked users table
   */
  async isUserRevoked(firebaseUid: string): Promise<boolean> {
    const revokedUser = await this.prisma.revokedUser.findUnique({
      where: { firebaseUid },
    });
    return !!revokedUser;
  }

  /**
   * Clean up old entries from the revoked users table
   * This should be called periodically, e.g., by a cron job
   */
  async cleanupRevokedUsers(
    maxAgeMs: number = 24 * 60 * 60 * 1000,
  ): Promise<void> {
    const cutoffDate = new Date(Date.now() - maxAgeMs);
    await this.prisma.revokedUser.deleteMany({
      where: {
        revokedAt: {
          lt: cutoffDate,
        },
      },
    });
  }
}
