import { AsyncPipe, JsonPipe, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { tap } from 'rxjs';
import { RoomWsService } from 'src/app/services/websocket/room.wsService';

@Component({
  standalone: true,
  imports: [NgIf, NgFor, AsyncPipe, JsonPipe],
  template: `
    <section style="
      position: relative;
      display: flex;
      flex-flow: column nowrap;
      max-height: 49%;
      overflow: overlay;"
      *ngIf="(user$ | async) as user">
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
      Connect to game
      <input #connect type="number" (keydown.enter)="connectToGame(connect.value)">
      {{ game | json }}
    </section>
  `,
  styles: [`li { font-size: 20px }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomComponent implements OnDestroy {
  user$ = this.roomService.user$.pipe(
    tap(console.log),
    tap(({ message }) => this.messages.push(message)),
  );
  game$ = this.roomService.game$;
  messages: string[] = [];

  messagesFn = (_id: number, message: string) => message;

  constructor(private roomService: RoomWsService) {}

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
      throw Error('Trash validation: wrong number entered to join as player');
    }

    this.roomService.playerConnect(+value);
  }
}
