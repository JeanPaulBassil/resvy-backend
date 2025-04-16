import { Module } from "@nestjs/common";
import { AllowedEmailService } from "./allowed-email.service";
import { AllowedEmailController } from "./allowed-email.controller";
import { PrismaService } from "nestjs-prisma";

@Module({
  controllers: [AllowedEmailController],
  providers: [AllowedEmailService, PrismaService],
  exports: [AllowedEmailService],
})
export class AllowedEmailModule {}
