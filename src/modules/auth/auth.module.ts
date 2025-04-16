import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { UserModule } from "../user/user.module";
import { AllowedEmailModule } from "../allowed-email/allowed-email.module";
import { PrismaModule } from "nestjs-prisma";
import { AuthService } from "./auth.service";

@Module({
  imports: [UserModule, AllowedEmailModule, PrismaModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
