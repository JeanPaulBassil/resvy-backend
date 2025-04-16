import { Controller, Get } from "@nestjs/common";
import {
  ApiControllerConfig,
  IgnoreCaching,
  Public,
} from "src/common/decorators";
@ApiControllerConfig("App")
@Controller()
export class AppController {
  @IgnoreCaching()
  @Get("health")
  @Public()
  health(): string {
    return "Healthy";
  }
}
