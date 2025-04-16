import { Module } from "@nestjs/common";
import { ReservationController } from "./reservation.controller";
import { ReservationService } from "./reservation.service";
import { PrismaService } from "nestjs-prisma";

@Module({
  controllers: [ReservationController],
  providers: [ReservationService, PrismaService],
  exports: [ReservationService],
})
export class ReservationModule {}
