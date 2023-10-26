import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, concatMap, of, tap } from 'rxjs';
import { UserService } from 'src/app/services';
import { RoomWSService } from 'src/app/services/websocket/room.wsService';

interface RoomUpdate {
  message: string;
  room_id: string;
  users: string[];
}

@Component({
  standalone: true,
  imports: [NgIf, NgFor, AsyncPipe],
  template: `<section style="display: flex; flex-flow: column wrap; height: 100%" *ngIf="(room$ | async) as room">
    <h1>Room {{room.room_id}}</h1>
    <h2>Users: </h2>
    <div style="display: flex; flex-direction: column;">
      <ol>
        <li *ngFor="let user of room.users" style="font-weight: bold">{{ user }}</li>
      </ol>
    </div>
    <h2>Messages: </h2>
    <div style="display: flex; flex-direction: column-reverse;">
      <ul>
        <li *ngFor="let message of messages; trackBy: messagesFn">{{message}}</li>
      </ul>
    </div>
    <input #input type="text" (keyup.enter)="sendMessage(input)">
  <section>`,
  styles: [`li { font-size: 20px }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomComponent implements OnInit, OnDestroy {
  myName = '';
  room$: Observable<RoomUpdate> = of();
  messages: string[] = [];

  messagesFn = (_id: number, message: string) => message;

  constructor(private userService: UserService, private roomService: RoomWSService, private activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.myName = this.userService.user?.name || '';
    this.room$ = this.activatedRoute.params.pipe(
      concatMap(({ id }) => this.roomService.create_or_join_room(id)),
      tap(({ message }) => this.messages.push(message)),
    );
  }

  ngOnDestroy(): void {
    this.roomService.destroy();
  }

  sendMessage(input: HTMLInputElement): void {
    this.roomService.sendMessage(input.value);
    input.value = '';
  }
}
