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
      max-height: calc(50% - 1rem);
      overflow: overlay;">
      <h1 (click)="copyId(user.room_id)">Room {{user.room_id}}</h1>
      <h2>Users: </h2>
      <div>
        <ul style="
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin: 0;
          padding: 0.5rem;
        ">
          <li *ngFor="let user of user.users" style="
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 1rem;">
            <img [src]="user.avatar" alt="user photo" style="
                width: 2.5rem;
                border-radius: 50%;" />
            {{ user.username }}
          </li>
        </ul>
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
      max-height: calc(50% - 1rem);
      overflow: overlay;"
      *ngIf="(game$ | async) as game">
      <ng-container [ngSwitch]="game.game_status">
        <ng-container *ngSwitchCase="GameStatus.Awaiting">
          <div style="font-weight: bold" [style.color]="game.players[0].id ? 'darkgreen' : 'gray'">
            <div style="
              font-weight: bold;
              display: flex;
              align-items: center;
              gap: 1rem;">
              <img *ngIf="game.players[0].id" [src]="game.players[0].avatar" alt="user photo" style="
                  width: 2.5rem;
                  border-radius: 50%;" />
              {{ game.players[0].username || 'Player 1' }}
            </div>
          </div>
          <div style="font-weight: bold" [style.color]="game.players[1].id ? 'darkgreen' : 'gray'">
            <div style="
              font-weight: bold;
              display: flex;
              align-items: center;
              gap: 1rem;">
              <img *ngIf="game.players[1].id" [src]="game.players[1].avatar" alt="user photo" style="
                  width: 2.5rem;
                  border-radius: 50%;" />
              {{ game.players[1].username || 'Player 2' }}
            </div>
          </div>
          <input #connect
            type="number"
            style="position: sticky; bottom: 0"
            [disabled]="user.users[0].id != currentUser.id && user.users[1].id != currentUser.id || game.players[0].id === currentUser.id"
            (keydown.enter)="connectToGame(connect.value)" />
          <p *ngIf="user.users[0].id != currentUser.id && user.users[1].id != currentUser.id">
            Can't join the game, two other players are already sitting
          </p>
          <p *ngIf="game.players[0].id === currentUser.id">
            Waiting for another player...
          </p>
        </ng-container>

        <ng-container *ngSwitchCase="GameStatus.Started">
          <ng-container *ngTemplateOutlet="gameHistory; context: { $implicit: game, user }"></ng-container>
          <label>Play your turn: </label>
          <input #turn type="number"
            style="position: sticky; bottom: 0"
            [disabled]="!(game.players[0].id === currentUser.id && game.current_player_turn ||
                          game.players[1].id === currentUser.id && !game.current_player_turn)"
            (keydown.enter)="playTurn(turn)"/>
        </ng-container>

        <ng-container *ngSwitchCase="GameStatus.Ended">
          <div style="position: sticky;
            top: 0;
            background-color: white;
            align-self: center;
            display: flex;
            flex-flow: column nowrap;
            width: 100%;">
            <img [src]="game.history[game.history.length - 1].user_id === game.players[0].id ? game.players[0].avatar : game.players[1].avatar"
              alt="user photo" style="
              width: 5rem;
              border-radius: 50%;
              align-self: center;" />
            <h2 style="align-self: center;">
              {{ game.history[game.history.length - 1].user_id === game.players[0].id ? user.users[0].username : user.users[1].username }}
              have won!
            </h2>
          </div>
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
        [style.align-self]="play.user_id === game.players[0].id ? 'flex-start' : 'flex-end'">
        <i>{{ play.played_at | date: 'mm:ss' }}</i>
        <strong [style.color]="play.user_id === game.players[0].id ? 'purple' : 'darkblue'">
          {{ play.user_id === game.players[0].id ? user.users[0].username : user.users[1].username }}
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
