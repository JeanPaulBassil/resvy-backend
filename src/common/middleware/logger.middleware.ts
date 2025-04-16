import { Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  /**
   * Logger Middleware
   * @param req {Request}
   * @param res {Response}
   * @param next {NextFunction}
   * @returns {void}
   */
  private readonly logger = new Logger(LoggerMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    this.logger.log(`${req.method} ${req.url}`);
    next();
  }
}
