import { Module } from "@nestjs/common";
import { GuestService } from "./guest.service";
import { GuestController } from "./guest.controller";

@Module({
  controllers: [GuestController],
  providers: [GuestService],
  exports: [GuestService],
})
export class GuestModule {}
