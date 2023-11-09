import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { RoomWsService } from 'src/app/services/websocket/room.wsService';
import { PlayPadComponent } from '../play-pad/play-pad.component';
import { NameplateComponent } from 'src/app/components/nameplate/nameplate.component';
import { UserService } from 'src/app/services';

@Component({
  standalone: true,
  imports: [NgIf, PlayPadComponent, NameplateComponent],
  selector: 'game-awaiting',
  templateUrl: './game-awaiting.component.html',
  styleUrls: ['./game-awaiting.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameAwaitingComponent implements OnInit {
  isSitting = false;

  constructor(private roomService: RoomWsService, private userService: UserService) {}

  ngOnInit(): void {
    const currentUser = this.userService.user!;
    const users = this.roomService.user.users;

    this.isSitting = currentUser.id === users[0]?.id || currentUser.id === users[1]?.id;
  }

  connectToGame(value: string): void {
    const numValue = +value;
    if (Number.isNaN(numValue) || numValue <= 0 || numValue > 9876) {
      throw Error('TrashValidation: wrong number entered to join as player');
    }

    this.roomService.playerConnect(+value);
  }
}
