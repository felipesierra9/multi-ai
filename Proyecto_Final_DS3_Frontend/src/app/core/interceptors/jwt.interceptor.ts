import { Injectable, inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenStorageService } from '../services/token-storage.service';


@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private storage = inject(TokenStorageService);
  private router = inject(Router);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.storage.getToken();
    const isApi = req.url.startsWith(environment.apiUrl);
    const isPublic = req.url.includes('/auth/');

    const authReq =
      token && isApi && !isPublic
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;

    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 && isApi && !isPublic) {
          this.storage.clear();
          this.router.navigate(['/auth/login']);
        }
        return throwError(() => err);
      }),
    );
  }
}
