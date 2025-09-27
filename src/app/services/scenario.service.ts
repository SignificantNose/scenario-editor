import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ListScenarioDataResponse, ScenarioData } from '@models/scenario/list-scenario-data.model';
import { CreateScenarioData } from '@models/scenario/create-scenario-data.model';
import { UpdateScenarioData } from '@models/scenario/update-scenario-data.model';
import { DeleteScenarioData } from '@models/scenario/delete-scenario-data.model';
import { ScenarioFilter } from '@models/scenario/filter.model';

@Injectable({ providedIn: 'root' })
export class ScenarioService {
  private http = inject(HttpClient);
  private base = '/api/v1/scenario';

  list(filter: ScenarioFilter | null = null): Observable<ListScenarioDataResponse> {
    const params: any = {};
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params[key] = value;
        }
      });

    }
    return this.http.get<ListScenarioDataResponse>(this.base, { params });
  }

  get(id: number | string): Observable<ScenarioData> {
    return this.http.get<ScenarioData>(`${this.base}/${id}`);
  }

  create(data: CreateScenarioData): Observable<ScenarioData> {
    return this.http.post<ScenarioData>(this.base, data);
  }

  update(id: number | string, data: UpdateScenarioData): Observable<ScenarioData> {
    return this.http.put<ScenarioData>(`${this.base}/${id}`, data);
  }

  delete(data: DeleteScenarioData): Observable<void> {
    return this.http.request<void>('delete', `${this.base}/${data.id}`);
  }
}
