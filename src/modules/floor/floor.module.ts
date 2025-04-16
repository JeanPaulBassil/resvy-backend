import { Module } from "@nestjs/common";
import { FloorService } from "./floor.service";
import { FloorController } from "./floor.controller";
import { TableModule } from "../table/table.module";

@Module({
  imports: [TableModule],
  controllers: [FloorController],
  providers: [FloorService],
  exports: [FloorService],
})
export class FloorModule {}
