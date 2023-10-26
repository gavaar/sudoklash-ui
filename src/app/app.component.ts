import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { UserService } from './services';

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
export class AppComponent implements OnInit {
  user$ = this.userService.user$;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.userService.init().subscribe();
  }
}
