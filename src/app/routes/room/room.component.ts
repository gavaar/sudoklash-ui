import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  standalone: true,
  template: `Hello from room`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomComponent {}
