import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { PageNotFoundComponent } from './pagenotfound/pagenotfound.component';
import { AuthenticatedGuard } from './core/auth/authenticated.guard';

const ITEM_MODULE_PATH = 'items';
export function getItemModulePath() {
  return `/${ITEM_MODULE_PATH}`;
}
@NgModule({
  imports: [
    RouterModule.forRoot([
      { path: '', redirectTo: '/home', pathMatch: 'full' },
      { path: 'home', loadChildren: './+home-page/home-page.module#HomePageModule' },
      { path: 'communities', loadChildren: './+community-page/community-page.module#CommunityPageModule' },
      { path: 'collections', loadChildren: './+collection-page/collection-page.module#CollectionPageModule' },
      { path: ITEM_MODULE_PATH, loadChildren: './+item-page/item-page.module#ItemPageModule' },
      { path: 'search', loadChildren: './+search-page/search-page.module#SearchPageModule' },
      { path: 'browse', loadChildren: './+browse-by/browse-by.module#BrowseByModule' },
      { path: 'admin', loadChildren: './+admin/admin.module#AdminModule', canActivate: [AuthenticatedGuard] },
      { path: 'login', loadChildren: './+login-page/login-page.module#LoginPageModule' },
      { path: 'logout', loadChildren: './+logout-page/logout-page.module#LogoutPageModule' },
      { path: '**', pathMatch: 'full', component: PageNotFoundComponent },
    ])
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {

}
