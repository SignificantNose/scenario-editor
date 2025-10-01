import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy } from '@angular/core';
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
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss'],
})
export class SignUpComponent implements OnDestroy {
  hidePassword = true;
  loading = false;
  private destroy$ = new Subject();
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private authApi = inject(AuthApiService);

  form = this.fb.nonNullable.group({
    login: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(4)]],
  });

  ngOnDestroy(): void {
    this.destroy$.complete();
  }

  signUp() {
    const { login, password } = this.form.value;
    if (!login || !password) return;

    this.loading = true;
    this.authApi.signUp({ login, password })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.snackBar.open('Signed up successfully!', 'Close', { duration: 5000 });
          this.router.navigate(['/auth']);
        },
        error: (err) => {
          this.loading = false;
          const msg = err.error?.error || 'Sign up failed';
          this.snackBar.open(msg, 'Close', { duration: 5000 });
        }
      });
  }
}

