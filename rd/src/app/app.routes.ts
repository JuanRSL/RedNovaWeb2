import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'posts', pathMatch: 'full' },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'posts',
    loadComponent: () => import('./features/post/postList/postList.component').then(m => m.PostListComponent)
  },
  {
    path: 'posts/new',
    loadComponent: () => import('./features/post/postForm/postForm.component').then(m => m.PostFormComponent)
  },
  {
    path: 'posts/:id',
    loadComponent: () => import('./features/post/postDetail/postDetail.component').then(m => m.PostDetailComponent)
  },
  {
    path: 'forums',
    loadComponent: () => import('./features/forum/forumList/forumList.component').then(m => m.ForumListComponent)
  },
  {
    path: 'forums/new',
    loadComponent: () => import('./features/forum/forumForm/forumForm.component').then(m => m.ForumFormComponent)
  },
  {
    path: 'forums/:id',
    loadComponent: () => import('./features/forum/forumDetail/forumDetail.component').then(m => m.ForumDetailComponent)
  },
  {
    path: 'subforums/new',
    loadComponent: () => import('./features/subforum/subforumForm/subforumForm.component').then(m => m.SubforumFormComponent)
  },
  {
    path: 'subforums/:id',
    loadComponent: () => import('./features/subforum/subforumDetail/subforumDetail.component').then(m => m.SubforumDetailComponent)
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/user/user.component').then(m => m.ProfileComponent)
  },
  { path: '**', redirectTo: 'posts' }
];
