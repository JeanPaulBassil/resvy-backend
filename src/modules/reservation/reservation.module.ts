import { Module } from "@nestjs/common";
import { ReservationController } from "./reservation.controller";
import { ReservationService } from "./reservation.service";
import { PrismaService } from "nestjs-prisma";
import { SmsService } from "../sms/sms.service";

@Module({
  controllers: [ReservationController],
  providers: [ReservationService, PrismaService, SmsService],
  exports: [ReservationService],
})
export class ReservationModule {}
