import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppConfigModel } from '@models/config/app-config.model';

import { BehaviorSubject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AppConfigService {
  private _config$: BehaviorSubject<AppConfigModel | null> =
    new BehaviorSubject<AppConfigModel | null>(null);
  config$ = this._config$.asObservable();
  get config() {
    return this._config$.getValue();
  }

  constructor(
    private httpClient: HttpClient,
  ) { }

  setConfig() {
    return this.httpClient.get('assets/config/config.json').pipe(
      tap((config: AppConfigModel) => {
        this._config$.next(config);
      }),
    );
  }
}

