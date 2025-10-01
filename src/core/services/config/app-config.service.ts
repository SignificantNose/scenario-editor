import { Injectable } from '@angular/core';
import { AppConfigModel } from '@models/config/app-config.model';

import { BehaviorSubject, tap } from 'rxjs';
import { ApiService } from '../api/api.service';

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
    private api: ApiService
  ) { }

  setConfig() {
    return this.api.get<AppConfigModel>('assets/config/config.json').pipe(
      tap((config) => {
        this._config$.next(config);
      }),
    );
  }
}
