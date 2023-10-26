import { Injectable } from '@angular/core';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { UserService } from '../user';

const WSUrl = 'ws://localhost:8000/v1/rooms';

@Injectable({ providedIn: 'root' })
export class RoomWSService {
  private roomWs?: WebSocketSubject<any>;

  constructor(private userService: UserService) {}

  create_or_join_room(roomId?: string) {
    let roomUrl = WSUrl;
    if (roomId) roomUrl += `/${roomId}`;
    roomUrl += encodeURI(`?token=${this.userService.token}`);

    this.roomWs = webSocket(roomUrl);
    return this.roomWs?.asObservable();
  }

  sendMessage(message: string) {
    this.roomWs?.next({ username: this.userService.user?.name, message });
  }

  destroy(): void {
    this.roomWs?.complete();
  }
}
