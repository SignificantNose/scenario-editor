import { HttpClient, HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, Observable, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { RoutePaths } from 'app/app.router-path';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(
    private router: Router,
    private httpClient: HttpClient,
  ) { }

  get<T>(
    reqUrl: string,
    data?: any
  ): Observable<T> {
    return this.request('GET', reqUrl, data);
  }

  post<T>(
    reqUrl: string,
    data?: any
  ): Observable<T> {
    return this.request('POST', reqUrl, data);
  }

  put<T>(
    reqUrl: string,
    data?: any
  ): Observable<T> {
    return this.request('PUT', reqUrl, data);
  }

  delete<T>(
    reqUrl: string,
    data?: any
  ): Observable<T> {
    return this.request('DELETE', reqUrl, data);
  }

  private request<T>(
    method: 'POST' | 'GET' | 'PUT' | 'DELETE',
    reqUrl: string,
    data?: any
  ): Observable<T> {
    let request: Observable<T>;

    switch (method) {
      case 'POST':
        request = this.httpClient.post<T>(reqUrl, data, { withCredentials: true });
        break;
      case 'GET':
        request = this.httpClient.get<T>(reqUrl, { params: data, withCredentials: true });
        break;
      case 'PUT':
        request = this.httpClient.put<T>(reqUrl, data, { withCredentials: true });
        break;
      case 'DELETE':
        request = this.httpClient.delete<T>(reqUrl, { body: data, withCredentials: true });
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }

    return request.pipe(
      catchError((err: HttpErrorResponse) => {

        if (err.status == HttpStatusCode.Unauthorized) {
          const authService = inject(AuthService);
          authService.logout();
          this.router.navigate([`/${RoutePaths.Auth}`]);
        }
        return throwError(() => err);
      }),
    );
  }
}

