import type { NestMiddleware } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import { getClientIp } from "@supercharge/request-ip";
import type { NextFunction, Request, Response } from "express";

@Injectable()
export class RealIpMiddleware implements NestMiddleware {
  use(request: Request, _response: Response, next: NextFunction) {
    request.realIp = getClientIp(request)!;
    next();
  }
}
