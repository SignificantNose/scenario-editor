import { Injectable } from '@angular/core';
import { BehaviorSubject, tap } from 'rxjs';
import { AuthApiService } from './auth-api.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _isAuth$ = new BehaviorSubject(false);
  get isAuth$() { return this._isAuth$.asObservable(); }
  get isAuthValue() { return this._isAuth$.value; }

  constructor(private authApi: AuthApiService) { }

  login(login: string, password: string) {
    return this.authApi.login({ login, password }).pipe(
      tap(() => this._isAuth$.next(true))
    );
  }

  logout() {
    return this.authApi.logout().pipe(
      tap(() => this._isAuth$.next(false))
    );
  }

  checkAuth() {
    return this.authApi.me().pipe(
      tap(() => this._isAuth$.next(true), () => this._isAuth$.next(false))
    );
  }
}

