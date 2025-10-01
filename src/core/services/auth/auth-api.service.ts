import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { AuthRequest } from '@models/auth/auth-request.model';
import { AuthResponse } from '@models/auth/auth-response.model';
import { AppConfigService } from '../config/app-config.service';

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private appConfigService = inject(AppConfigService);
  private controller = `${this.appConfigService.config?.apiUrl ?? ''}/api/v1/auth`;

  constructor(private apiService: ApiService) {}

  login(data: AuthRequest) {
    return this.apiService.post<AuthResponse>(`${this.controller}/login`, data);
  }

  logout() {
    return this.apiService.post(`${this.controller}/logout`, {});
  }

  me() {
    return this.apiService.get<{ id: number; login: string }>(`${this.controller}/me`);
  }

  register(data: AuthRequest) {
    return this.apiService.post(`${this.controller}/register`, data);
  }
}

