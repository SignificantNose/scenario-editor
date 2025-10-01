import { CommonModule } from '@angular/common';
import { Component, OnDestroy, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { RoutePaths } from 'app/app.router-path';
import { AuthService } from 'core/services/auth/auth.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatToolbarModule,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnDestroy {
  readonly title = signal('Scenar.io');

  private $destroy = new Subject<void>();
  constructor(private authService: AuthService, private router: Router) { }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  onLogout(): void {
    this.authService.logout()
      .pipe(takeUntil(this.$destroy))
      .subscribe(() => {
        this.router.navigate([`/${RoutePaths.Auth}`]);
      });
  }
}
