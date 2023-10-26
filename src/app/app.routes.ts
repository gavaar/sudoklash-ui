import { Routes } from '@angular/router';
import { userGuard } from './guards/user.guard';

export const routes: Routes = [
  { path: 'how-to-play', loadComponent: () => import('./routes/how_to_play/how_to_play.component').then(c => c.HowToPlayComponent) },
  {
    path: 'room',
    children: [
      { path: ':id', loadComponent: () => import('./routes/room/room.component').then(c => c.RoomComponent) },
      { path: '', loadComponent: () => import('./routes/room/room.component').then(c => c.RoomComponent) },
    ],
    canActivateChild: [userGuard],
  },
];
