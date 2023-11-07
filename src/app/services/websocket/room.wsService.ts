import { Injectable } from '@angular/core';
import { UserService } from '../user';
import { Observable, filter, take, tap } from 'rxjs';
import { WebSocketManager } from './websocket-manager';

interface RoomUser {
  id: string;
  username: string;
  avatar: string;
}

export interface UserServerMessage {
  message: string;
  room_id: string;
  users: RoomUser[];
}
interface UserClientMessage {
  message: string;
  username?: string;
}

export enum GameStatus {
  Awaiting = "Awaiting",
  Started = "Started",
  Ended = "Ended",
}
interface GameUserConnect {
  selection?: number;
}
interface GameUserTurn {
  play: string;
  user_id: string;
}
export interface GameServerTurn extends GameUserTurn {
  result: [number, number];
  played_at: number; // Time?
}
export interface GameServerMessage {
  history: GameServerTurn[];
  game_status: GameStatus,
  current_player_turn: boolean; // t = player_0, f = player_1
  players: [RoomUser, RoomUser]
}
type GameUserMessage = GameUserConnect | GameUserTurn;

const WSUrl = 'ws://localhost:8000/v1/rooms';

@Injectable({ providedIn: 'root' })
export class RoomWsService {
  private userWs!: WebSocketManager<UserServerMessage, UserClientMessage>;
  private gameWs!: WebSocketManager<GameServerMessage, GameUserMessage>;

  get user$(): Observable<UserServerMessage> {
    return this.userWs.socketUpdates$;
  }
  get game$(): Observable<GameServerMessage> {
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

    return this.user$.pipe(
      filter(v => v.room_id != null),
      take(1),
      tap(({room_id}) => {
        const gameUrl = `${WSUrl}/game/${room_id}?token=${this.userService.token}`;
        this.gameWs = new WebSocketManager<GameServerMessage, GameUserMessage>(gameUrl);
      }),
    );
  }

  // ROOM
  sendMessage(message: string) {
    this.userWs.next({ username: this.userService.user?.name, message });
  }

  // GAME
  playerConnect(selection: number): void {
    this.gameWs.next({ selection });
  }

  playTurn(turn: string): void {
    this.gameWs.next({ play: turn, user_id: this.userService.user!.id });
  }

  destroy(): void {
    this.userWs.destroy();
    this.gameWs.destroy();
  }
}
