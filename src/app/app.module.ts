import { NgModule } from '@angular/core';
import { CommonModule, APP_BASE_HREF } from '@angular/common';
import { HttpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { EffectsModule } from '@ngrx/effects';
import { StoreModule, MetaReducer, META_REDUCERS } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { RouterStateSerializer, StoreRouterConnectingModule } from '@ngrx/router-store';

import { storeFreeze } from 'ngrx-store-freeze';

import { TranslateModule } from '@ngx-translate/core';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { appEffects } from './app.effects';
import { appReducers, AppState } from './app.reducer';
import { appMetaReducers } from './app.metareducers';

import { CoreModule } from './core/core.module';
import { AppRoutingModule } from './app-routing.module';
import { TransferHttpModule } from '../modules/transfer-http/transfer-http.module';

import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { PageNotFoundComponent } from './pagenotfound/pagenotfound.component';

import { GLOBAL_CONFIG, ENV_CONFIG, GlobalConfig } from '../config';

import { DSpaceRouterStateSerializer } from './shared/ngrx/dspace-router-state-serializer';

export function getConfig() {
  return ENV_CONFIG;
}

export function getBase() {
  return ENV_CONFIG.ui.nameSpace;
}

export function getMetaReducers(config: GlobalConfig): Array<MetaReducer<AppState>> {
  return config.production ? appMetaReducers : [...appMetaReducers, storeFreeze];
}

const DEV_MODULES: any[] = [];

if (!ENV_CONFIG.production) {
  DEV_MODULES.push(StoreDevtoolsModule.instrument({ maxAge: 50 }));
}

@NgModule({
  imports: [
    CommonModule,
    HttpModule,
    RouterModule,
    AppRoutingModule,
    CoreModule.forRoot(),
    NgbModule.forRoot(),
    TranslateModule.forRoot(),
    EffectsModule.forRoot(appEffects),
    StoreModule.forRoot(appReducers),
    StoreRouterConnectingModule,
    TransferHttpModule,
    ...DEV_MODULES
  ],
  providers: [
    {
      provide: GLOBAL_CONFIG,
      useFactory: (getConfig)
    },
    {
      provide: APP_BASE_HREF,
      useFactory: (getBase)
    },
    {
      provide: META_REDUCERS,
      useFactory: getMetaReducers,
      deps: [GLOBAL_CONFIG]
    },
    {
      provide: RouterStateSerializer,
      useClass: DSpaceRouterStateSerializer
    }
  ],
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    PageNotFoundComponent
  ],
  exports: [AppComponent]
})
export class AppModule {

}
