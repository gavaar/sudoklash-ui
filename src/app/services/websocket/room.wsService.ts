import { Injectable } from '@angular/core';
import { UserService } from '../user';
import { Observable, filter, take, tap } from 'rxjs';
import { WebSocketManager } from './websocket-manager';

export interface UserServerMessage {
  message: string;
  room_id: string;
  users: string[];
}
interface UserClientMessage {
  message: string;
  username?: string;
}

enum GameStatus {
  Awaiting,
  Started,
  Ended,
}
interface GameUserConnect {
  selection?: number;
}
interface GameUserTurn {
  play: string;
  user_id: string;
}
interface GameServerTurn extends GameUserTurn {
  result: [number, number];
  played_at: number; // Time?
}
export interface GameServerMessage {
  history: GameServerTurn[];
  game_status: GameStatus,
  current_player_turn: boolean; // t = player_0, f = player_1
}
type GameUserMessage = GameUserConnect | GameUserTurn;

const WSUrl = 'ws://localhost:8000/v1/rooms';

@Injectable({ providedIn: 'root' })
export class RoomWsService {
  private userWs!: WebSocketManager<UserServerMessage, UserClientMessage>;
  private gameWs!: WebSocketManager<GameServerMessage, GameUserMessage>;

  get user$(): Observable<UserServerMessage | null> {
    return this.userWs.socketUpdates$;
  }
  get game$(): Observable<GameServerMessage | null> {
    return this.gameWs.socketUpdates$;
  }

  constructor(private userService: UserService) {}

  /**
   * Awaits for room initialization for component resolver use.
   */
  roomConnect(id: string | null):Observable<UserServerMessage> {
    let roomUrl = WSUrl;
    if (id) roomUrl += `/${id}`;
    roomUrl += encodeURI(`?token=${this.userService.token}`);

    this.userWs = new WebSocketManager<UserServerMessage, UserClientMessage>(roomUrl);
    const connected = this.user$.pipe(
      filter(Boolean),
      take(1),
      tap(({room_id}) => {
        const gameUrl = `${WSUrl}/game/${room_id}?token=${this.userService.token}`;
        this.gameWs = new WebSocketManager<GameServerMessage, GameUserMessage>(gameUrl);
        this.gameWs.connect();
      })
    );

    this.userWs.connect();
    return connected;
  }

  // ROOM
  sendMessage(message: string) {
    this.userWs.next({ username: this.userService.user?.name, message });
  }

  // GAME
  playerConnect(selection: number) {
    this.gameWs?.next({ selection });
  }

  destroy(): void {
    this.userWs.destroy();
    this.gameWs.destroy();
  }
}
