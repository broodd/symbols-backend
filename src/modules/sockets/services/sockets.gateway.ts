import { Server, Socket } from 'socket.io';

import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  ConnectedSocket,
  WebSocketServer,
  MessageBody,
} from '@nestjs/websockets';
import { BadRequestException, UseFilters, UsePipes } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { SocketsExceptionFilter } from 'src/common/filters';
import { validationPipe } from 'src/common/pipes';
import { ErrorTypeEnum } from 'src/common/enums';

import { SymbolPriceUpdateType } from 'src/modules/binance-provider/types';
import { SymbolsService } from 'src/modules/symbols/services';
import { JwtAccessTokenPayloadDto } from 'src/modules/auth';
import { UsersService } from 'src/modules/users/services';

import { SymbolSubscribeDto } from '../dto/symbol-subscribe.dto';
import { SymbolEventsEnum, addSymbolPrefix } from '../enums';

import { SocketsService } from './sockets.service';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:8080', 'http://localhost:3000'],
    credentials: true,
  },
  transports: ['websocket'],
})
@UsePipes(validationPipe)
@UseFilters(SocketsExceptionFilter)
export class SocketsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private readonly server: Server;

  /**
   * [description]
   * @param jwtService
   * @param usersService
   * @param socketsService
   */
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly symbolsService: SymbolsService,
    private readonly socketsService: SocketsService,
  ) {}

  /**
   * Decode cookie
   * @param cookieHeader
   * @param name
   */
  private getCookieValue(cookieHeader: string | undefined, name: string): string | null {
    if (!cookieHeader) return null;

    const cookies = cookieHeader.split(';').map((part) => part.trim());
    const found = cookies.find((cookie) => cookie.startsWith(`${name}=`));
    if (!found) return null;

    return decodeURIComponent(found.slice(name.length + 1));
  }

  /**
   * [description]
   * @param socket
   */
  public async handleConnection(@ConnectedSocket() socket: Socket): Promise<void> {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      const accessToken = this.getCookieValue(cookieHeader, 'accessToken');
      if (!accessToken) throw new BadRequestException('Missing accessToken cookie');

      const { id } = this.jwtService.verify<JwtAccessTokenPayloadDto>(accessToken);
      const user = await this.usersService.selectOne({ id }, { projection: 'id role' });

      socket.data = { user: { id: user.id, role: user.role } };
      this.socketsService.addOne(id, socket);
    } catch (error) {
      socket.emit(ErrorTypeEnum.SOCKET_ERROR, { message: error.message });
      socket.disconnect();
    }
  }

  /**
   * [description]
   * @param socket
   */
  public async handleDisconnect(@ConnectedSocket() socket: Socket): Promise<void> {
    const userId = socket.data?.user?.id;
    if (userId) this.socketsService.removeOne(userId, socket.id);
  }

  /**
   * Emit to sockets about price update
   * @param update
   */
  public emitSymbolPriceChanged(update: SymbolPriceUpdateType): void {
    this.server
      ?.to(addSymbolPrefix(update.providerSymbol))
      .emit(SymbolEventsEnum.PRICE_CHANGED, update);
  }

  /**
   * [description]
   * @param socket
   * @param providerSymbol
   */
  public joinSymbolRoom(socket: Socket, providerSymbol: string): void {
    socket.join(addSymbolPrefix(providerSymbol));
  }

  /**
   * [description]
   * @param socket
   * @param providerSymbol
   */
  public leaveSymbolRoom(socket: Socket, providerSymbol: string): void {
    socket.leave(addSymbolPrefix(providerSymbol));
  }

  /**
   * Subscribe socket to symbol room
   * @param socket
   * @param data
   */
  @SubscribeMessage(SymbolEventsEnum.SUBSCRIBE)
  public async subscribeToSymbol(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: SymbolSubscribeDto,
  ): Promise<void> {
    await this.symbolsService.selectOne({ providerSymbol: data.providerSymbol, isPublic: true });
    this.joinSymbolRoom(socket, data.providerSymbol);
  }

  /**
   * Unsubscribe socket from symbol room
   * @param socket
   * @param data
   */
  @SubscribeMessage(SymbolEventsEnum.UNSUBSCRIBE)
  public async unsubscribeFromSymbol(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: SymbolSubscribeDto,
  ): Promise<void> {
    this.leaveSymbolRoom(socket, data.providerSymbol);
  }
}
