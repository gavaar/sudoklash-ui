import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Observable, take } from 'rxjs';
import { UserService } from './services';
import { User } from './models';

@Component({
  selector: 'sudo-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  template: `
    <main>
      <h1>Hello {{ (user$ | async)?.name }}</h1>
      <br/>
      <router-outlet></router-outlet>
      <br/>
      <a routerLink="">Home</a>
      <br/>
      <a routerLink="how-to-play">How to play</a>
      <br/>
      <a routerLink="room">Room</a>
    </main>
  `,
  styles: [],
})
export class AppComponent {
  user$: Observable<User> = this.userService.init().pipe(take(1));

  constructor(private userService: UserService) {}
}
