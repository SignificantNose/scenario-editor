import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withFetch} from '@angular/common/http';
import { inject, provideAppInitializer } from '@angular/core';
import { AppConfigService } from 'core/services/config/app-config.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

function initializeApp(appConfigService: AppConfigService){
  return appConfigService.setConfig().pipe(takeUntilDestroyed());
}

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...appConfig.providers,
    provideHttpClient(withFetch()),
    provideAppInitializer(() => {
      return initializeApp(inject(AppConfigService));
    }),
  ]
})
  .catch((err) => console.error(err));
