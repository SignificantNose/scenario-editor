import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AudioFileService {
  private http = inject(HttpClient);
  private controller = 'http://localhost:4000/api/v1/audio';

  uploadAudio(file: File): Observable<{ uri: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ uri: string }>(this.controller, formData);
  }
}
