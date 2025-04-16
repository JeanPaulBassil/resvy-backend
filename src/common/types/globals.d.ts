export {};
declare global {
  namespace Express {
    export interface Request {
      realIp?: string;
    }
  }
}
