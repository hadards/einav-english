import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'lesson/:id',
    loadComponent: () => import('./features/lesson/lesson-player.component').then(m => m.LessonPlayerComponent),
    canActivate: [authGuard],
  },
  {
    path: 'vocabulary',
    loadComponent: () => import('./features/vocabulary/vocabulary.component').then(m => m.VocabularyComponent),
    canActivate: [authGuard],
  },
  {
    path: 'progress',
    loadComponent: () => import('./features/progress/progress.component').then(m => m.ProgressComponent),
    canActivate: [authGuard],
  },
  {
    path: 'chat',
    loadComponent: () => import('./features/chat/chat.component').then(m => m.ChatComponent),
    canActivate: [authGuard],
  },
  {
    path: 'kids',
    loadComponent: () => import('./features/kids/kids-home.component').then(m => m.KidsHomeComponent),
  },
  {
    path: 'kids/story/:locationId',
    loadComponent: () => import('./features/kids/kids-story.component').then(m => m.KidsStoryComponent),
  },
  {
    path: 'kids/game/:locationId/:mode',
    loadComponent: () => import('./features/kids/kids-game.component').then(m => m.KidsGameComponent),
  },
  { path: '**', redirectTo: 'login' },
];
