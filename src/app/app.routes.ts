import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'how-to-play', loadComponent: () => import('./routes/how_to_play/how_to_play.component').then(c => c.HowToPlayComponent) },
  { path: 'room', loadComponent: () => import('./routes/room/room.component').then(c => c.RoomComponent) },
];
