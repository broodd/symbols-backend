import { Socket } from 'socket.io';

import { Injectable } from '@nestjs/common';

/**
 * [description]
 */
@Injectable()
export class SocketsService {
  /**
   * A map of active connections where **key** is a **userId**
   * and value is a map where **id** is **socketId** and value is **socket**
   * {
   *    'userId': {
   *        'socketId': Socket
   *    }
   * }
   */
  private readonly usersSockets: Map<string, Map<string, Socket>> = new Map<
    string,
    Map<string, Socket>
  >();

  /**
   * [description]
   * @param userId
   * @param socket
   */
  public addOne(userId: string, socket: Socket): void {
    if (!this.usersSockets.get(userId)) this.usersSockets.set(userId, new Map<string, Socket>());
    this.usersSockets.get(userId).set(socket.id, socket);
  }

  /**
   * Select many SocketId of many Users
   * @param userIds
   */
  public selectManyIds(userIds: string[]): string[] {
    return userIds.reduce<string[]>((acc, current) => acc.concat(this.selectOneIds(current)), []);
  }

  /**
   * Select many SocketId of one User
   * @param userId
   */
  public selectOneIds(userId: string): string[] {
    return Array.from(this.usersSockets.get(userId)?.keys() ?? []);
  }

  /**
   * Select Socket of one User
   * @param userId
   * @param socketId
   */
  public selectOne(userId: string, socketId: string): Socket | undefined {
    return this.usersSockets.get(userId)?.get(socketId);
  }

  /**
   * [description]
   * @param userId
   * @param socketId
   */
  public removeOne(userId: string, socketId: string): void {
    const sockets = this.usersSockets.get(userId);
    if (!sockets) return;

    sockets.delete(socketId);
    if (!sockets.size) this.usersSockets.delete(userId);
  }

  /**
   * Disconnect every socket that belongs to the given user.
   * @param userId
   */
  public disconnectMany(userId: string): number {
    const sockets = this.usersSockets.get(userId);
    if (!sockets?.size) return 0;

    const socketIds = sockets.size;
    for (const socket of sockets.values()) {
      try {
        socket.disconnect(true);
      } catch {
        // Best effort disconnect, registry cleanup still happens below
      }
    }

    this.usersSockets.delete(userId);
    return socketIds;
  }
}
