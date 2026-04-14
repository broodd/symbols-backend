import { Socket } from 'socket.io';

import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  ConnectedSocket,
} from '@nestjs/websockets';
import { BadRequestException, UseFilters, UsePipes } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { SocketsExceptionFilter } from 'src/common/filters';
import { validationPipe } from 'src/common/pipes';
import { ErrorTypeEnum } from 'src/common/enums';

import { JwtAccessTokenPayloadDto } from 'src/modules/auth';
import { UsersService } from 'src/modules/users/services';

import { SocketsService } from './sockets.service';

function getCookieValue(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map((part) => part.trim());
  const found = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  if (!found) return null;

  return decodeURIComponent(found.slice(name.length + 1));
}

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
  /**
   * [description]
   * @param jwtService
   * @param usersService
   * @param socketsService
   */
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly socketsService: SocketsService,
  ) {}

  /**
   * [description]
   * @param socket
   */
  public async handleConnection(@ConnectedSocket() socket: Socket): Promise<void> {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      const accessToken = getCookieValue(cookieHeader, 'accessToken');
      if (!accessToken) throw new BadRequestException('Missing accessToken cookie');

      const { id } = this.jwtService.verify<JwtAccessTokenPayloadDto>(accessToken);
      await this.usersService.selectOne({ id }, { projection: 'id' });

      socket.data = { user: { id } };
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
}
