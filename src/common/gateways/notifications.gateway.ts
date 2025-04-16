import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger } from "@nestjs/common";

@WebSocketGateway()
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger("NotificationGateway");

  afterInit(_: Server) {
    this.logger.log("WebSocket server initialized");
  }

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      client.join(userId);
      this.logger.log(`Client connected: ${client.id} with userId: ${userId}`);
    } else {
      client.disconnect();
      this.logger.warn(`Client disconnected: No userId provided`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      client.leave(userId);
      this.logger.log(
        `Client disconnected: ${client.id} with userId: ${userId}`,
      );
    }
  }

  sendNotificationToUsers(userIds: string[], notification: string) {
    this.server.to(userIds).emit("notification", notification);
  }
}
