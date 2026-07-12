import { lazy } from 'react';

export const LoginPage = lazy(() => import('./pages/LoginPage'));
export const RegisterPage = lazy(() => import('./pages/RegisterPage'));
export const ProfilePage = lazy(() => import('./pages/ProfilePage'));
export const PreferencesPage = lazy(() => import('./pages/PreferencesPage'));
export const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'));
