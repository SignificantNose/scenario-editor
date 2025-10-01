import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AppConfigService } from '../config/app-config.service';
import { ApiService } from '../api/api.service';

@Injectable({ providedIn: 'root' })
export class AudioFileService {
  private appConfigService = inject(AppConfigService);
  private controller = `${this.appConfigService.config?.apiUrl ?? ''}/api/v1/audio`;

  constructor(private api: ApiService) { }

  uploadAudio(file: File): Observable<{ uri: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post<{ uri: string }>(this.controller, formData);
  }
}
