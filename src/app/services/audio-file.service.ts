import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';

@Injectable({ providedIn: 'root' })
export class AudioFileService {
  private appConfigService = inject(AppConfigService);
  private controller = `${this.appConfigService.config?.apiUrl ?? ''}/api/v1/audio`;

  constructor(private http: HttpClient) { }

  uploadAudio(file: File): Observable<{ uri: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ uri: string }>(this.controller, formData);
  }
}
