import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthApiService } from 'core/services/auth/auth-api.service';
import { AuthService } from 'core/services/auth/auth.service';
import { Subject, takeUntil } from 'rxjs';
import { RoutePaths } from 'app/app.router-path';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatToolbarModule,
    MatSnackBarModule
  ],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
})
export class AuthComponent implements OnInit, OnDestroy {
  hidePassword = true;
  loading = false;
  private destroy$ = new Subject();
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  form = this.fb.nonNullable.group({
    login: ['', Validators.required],
    password: ['', Validators.required],
  });

  constructor(
    private authApiService: AuthApiService,
    private authService: AuthService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.destroy$.complete();
  }

  login() {
    const { login, password } = this.form.value;
    if (!login || !password) return;

    this.loading = true;
    this.authApiService
      .login({ login, password })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/']).then();
        },
        error: (err) => {
          this.loading = false;
          this.snackBar.open('Login failed. Please check your credentials.', 'Close', {
            duration: 5000,
          });
        },
      });
  }

  goToSignUp() {
    this.router.navigate([`/${RoutePaths.SignUp}`]);
  }
}

