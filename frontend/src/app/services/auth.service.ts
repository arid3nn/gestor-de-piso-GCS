import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly tokenKey = 'auth_token';

  constructor(private api: ApiService, private router: Router) {}

  login(email: string, password: string) {
    return this.api.post<{ access_token: string }>('auth/login', {
      email,
      password,
    }).pipe(
      tap((response) => {
        localStorage.setItem(this.tokenKey, response.access_token);
      })
    );
  }

  register(firstName: string, lastName: string, email: string, password: string) {
    return this.api.post<{ access_token: string }>('auth/register', {
      firstName,
      lastName,
      email,
      password,
    }).pipe(
      tap((response) => {
        localStorage.setItem(this.tokenKey, response.access_token);
      })
    );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }
}
