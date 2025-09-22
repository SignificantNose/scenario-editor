import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { config } from './app/app.config.server';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http';

const bootstrap = (context: BootstrapContext) =>
    bootstrapApplication(AppComponent, {
    ...config,
    providers: [
      ...config.providers,
      provideHttpClient(),
    ]

  }, context);

export default bootstrap;

