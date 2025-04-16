import { Injectable } from "@nestjs/common";
import { PrismaService } from "nestjs-prisma";
import { AllowedEmail } from "@prisma/client";

@Injectable()
export class AllowedEmailService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<AllowedEmail[]> {
    return this.prisma.allowedEmail.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string): Promise<AllowedEmail | null> {
    return this.prisma.allowedEmail.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<AllowedEmail | null> {
    return this.prisma.allowedEmail.findUnique({
      where: { email },
    });
  }

  async create(data: {
    email: string;
    description?: string;
    createdBy?: string;
  }): Promise<AllowedEmail> {
    return this.prisma.allowedEmail.create({
      data,
    });
  }

  async update(
    id: string,
    data: { email?: string; description?: string },
  ): Promise<AllowedEmail> {
    const allowedEmail = await this.prisma.allowedEmail.update({
      where: { id },
      data,
    });

    return allowedEmail;
  }

  async delete(id: string): Promise<AllowedEmail> {
    const deleted = await this.prisma.allowedEmail.delete({
      where: { id },
    });

    return deleted;
  }

  async isEmailAllowed(email: string): Promise<boolean> {
    const allowedEmail = await this.prisma.allowedEmail.findUnique({
      where: { email },
    });
    return !!allowedEmail;
  }

  // Get all allowed emails
  async getAllowedEmails(): Promise<string[]> {
    const allowedEmails = await this.findAll();
    return allowedEmails.map((ae) => ae.email);
  }
}
