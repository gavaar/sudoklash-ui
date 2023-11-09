import { AsyncPipe, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { tap } from 'rxjs';
import { UserService } from 'src/app/services';
import { GameServerTurn, GameStatus, RoomWsService } from 'src/app/services/websocket/room.wsService';
import { UserListComponent } from './components/user-list/user-list.component';
import { GameAwaitingComponent } from './components/game-awaiting/game-awaiting.component';

@Component({
  standalone: true,
  imports: [NgIf, AsyncPipe, UserListComponent, GameAwaitingComponent],
  template: `
  <section style="display: flex; flex-direction: column; height: 100%">
    <user-list></user-list>
    <div class="chat-placeholder" style="flex: 1 0 0;"></div>
    <game-awaiting></game-awaiting>
  </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomComponent implements OnDestroy {
  constructor(private roomService: RoomWsService) {}

  ngOnDestroy(): void {
    this.roomService.destroy();
  }
}
