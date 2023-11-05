import { AsyncPipe, DatePipe, JsonPipe, NgFor, NgIf, NgSwitch, NgSwitchCase, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { tap } from 'rxjs';
import { UserService } from 'src/app/services';
import { GameServerTurn, GameStatus, RoomWsService } from 'src/app/services/websocket/room.wsService';

@Component({
  standalone: true,
  imports: [NgIf, NgFor, AsyncPipe, DatePipe, NgSwitch, NgSwitchCase, NgTemplateOutlet],
  template: `
  <ng-container *ngIf="currentUser$ | async as currentUser">
    <ng-container *ngIf="(user$ | async) as user">
    <section style="
      position: relative;
      display: flex;
      flex-flow: column nowrap;
      max-height: 49%;
      overflow: overlay;">
      <h1 (click)="copyId(user.room_id)">Room {{user.room_id}}</h1>
      <h2>Users: </h2>
      <div style="display: flex; flex-direction: column;">
        <ol>
          <li *ngFor="let user of user.users" style="font-weight: bold">{{ user }}</li>
        </ol>
      </div>
      <h2>Messages: </h2>
      <div style="display: flex; flex-direction: column-reverse;">
        <ul>
          <li *ngFor="let message of messages; trackBy: messagesFn">{{message}}</li>
        </ul>
      </div>
      <input #input type="text" (keyup.enter)="sendMessage(input)" style="position: sticky; bottom: 0">
    </section>
    <hr/>
    <section style="
      position: relative;
      display: flex;
      flex-flow: column nowrap;
      max-height: 49%;
      overflow: overlay;"
      *ngIf="(game$ | async) as game">
      <ng-container [ngSwitch]="game.game_status">
        <ng-container *ngSwitchCase="GameStatus.Awaiting">
          <p style="font-weight: bold" [style.color]="game.players[0].user_id != emptyId ? 'darkgreen' : 'gray'">Player 1</p>
          <p style="font-weight: bold" [style.color]="game.players[1].user_id != emptyId ? 'darkgreen' : 'gray'">Player 2</p>
          <input #connect
            type="number"
            style="position: sticky; bottom: 0"
            [disabled]="user.users[0] != currentUser.name && user.users[1] != currentUser.name || game.players[0].user_id === currentUser.id"
            (keydown.enter)="connectToGame(connect.value)" />
          <p *ngIf="user.users[0] != currentUser.name && user.users[1] != currentUser.name">
            Can't join the game, two other players are already sitting
          </p>
          <p *ngIf="game.players[0].user_id === currentUser.id">
            Waiting for another player...
          </p>
        </ng-container>

        <ng-container *ngSwitchCase="GameStatus.Started">
          <ng-container *ngTemplateOutlet="gameHistory; context: { $implicit: game, user }"></ng-container>
          <label>Play your turn: </label>
          <input #turn type="number"
            style="position: sticky; bottom: 0"
            [disabled]="!(game.players[0].user_id === currentUser.id && game.current_player_turn ||
                          game.players[1].user_id === currentUser.id && !game.current_player_turn)"
            (keydown.enter)="playTurn(turn)"/>
        </ng-container>

        <ng-container *ngSwitchCase="GameStatus.Ended">
          <h2>
            {{ game.history[game.history.length - 1].user_id === game.players[0].user_id ? user.users[0] : user.users[1] }}
            have won!
          </h2>
          <ng-container *ngTemplateOutlet="gameHistory; context: { $implicit: game, user }"></ng-container>
        </ng-container>
      </ng-container>
    </section>
    </ng-container>
  </ng-container>

  <ng-template #gameHistory let-game let-user="user">
    <div style="display: flex; flex-direction: column;">
      <h3>History</h3>
      <p *ngFor="let play of game.history; trackBy: historyFn"
        style="display: flex;
          flex-direction: column;
          border: 1px solid darkgray;
          padding: 8px;
          max-width: fit-content;
          margin: 0 1rem;
          align-items: center;"
        [style.align-self]="play.user_id === game.players[0].user_id ? 'flex-start' : 'flex-end'">
        <i>{{ play.played_at | date: 'mm:ss' }}</i>
        <strong [style.color]="play.user_id === game.players[0].user_id ? 'purple' : 'darkblue'">
          {{ play.user_id === game.players[0].user_id ? user.users[0] : user.users[1] }}
        </strong>
        <strong>{{ play.play }}</strong>
        <span>{{ play.result[1] }} 🎯 | {{ play.result[0] }} 💀</span>
      </p>
    </div>
  </ng-template>
  `,
  styles: [`li { font-size: 20px }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomComponent implements OnDestroy {
  GameStatus = GameStatus;

  currentUser$ = this.userService.user$;
  user$ = this.roomService.user$.pipe(
    tap(({ message }) => this.messages.push(message)),
  );
  game$ = this.roomService.game$;
  messages: string[] = [];

  readonly emptyId = '00000000-0000-0000-0000-000000000000';

  messagesFn = (_id: number, message: string) => message;
  historyFn = (_id: number, turn: GameServerTurn) => turn.played_at;

  constructor(private userService: UserService, private roomService: RoomWsService) {}

  ngOnDestroy(): void {
    this.roomService.destroy();
  }

  copyId(id: string): void {
    navigator.clipboard.writeText(id);
  }

  sendMessage(input: HTMLInputElement): void {
    this.roomService.sendMessage(input.value);
    input.value = '';
  }

  connectToGame(value: string): void {
    const numValue = +value;
    if (Number.isNaN(numValue) || numValue <= 0 || numValue > 9876) {
      throw Error('TrashValidation: wrong number entered to join as player');
    }

    this.roomService.playerConnect(+value);
  }

  playTurn(turn: HTMLInputElement): void {
    this.roomService.playTurn(turn.value);
    turn.value = '';
  }
}
