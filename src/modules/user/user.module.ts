import { Module } from "@nestjs/common";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { AllowedEmailModule } from "../allowed-email/allowed-email.module";

@Module({
  imports: [AllowedEmailModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
