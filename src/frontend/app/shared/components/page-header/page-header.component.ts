import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Logout } from '../../../store/actions/auth.actions';
import { AuthState } from '../../../store/reducers/auth.reducer';
import { InternalEventSeverity } from '../../../store/types/internal-events.types';
import { ISubHeaderTabs } from '../page-subheader/page-subheader.types';
import { ToggleSideNav } from './../../../store/actions/dashboard-actions';
import { AppState } from './../../../store/app-state';
import { BREADCRUMB_URL_PARAM, IHeaderBreadcrumb, IHeaderBreadcrumbLink } from './page-header.types';
import { TabNavService } from '../../../features/dashboard/tab-nav.service';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss']
})
export class PageHeaderComponent implements OnInit, OnDestroy {

  public breadcrumbDefinitions: IHeaderBreadcrumbLink[] = null;
  private breadcrumbKey: string;
  public eventSeverity = InternalEventSeverity;

  @Input() hideSideNavButton = false;

  @Input() hideMenu = false;

  @Input()
  endpointIds$: Observable<string[]>;

  @Input()
  set tabs(tabs: ISubHeaderTabs[]) {
    this.tabNavService.setTabs(tabs.map(tab => ({
      ...tab,
      link: this.router.createUrlTree([tab.link], {
        relativeTo: this.route
      }).toString()
    })));
  }

  @Input() showUnderFlow = false;

  public userNameFirstLetter$: Observable<string>;
  public username$: Observable<string>;
  public actionsKey: String;

  @Input()
  set breadcrumbs(breadcrumbs: IHeaderBreadcrumb[]) {
    this.breadcrumbDefinitions = this.getBreadcrumb(breadcrumbs);
  }

  // Used when non-admin logs in with no-endpoints -> only show logout in the menu
  @Input() logoutOnly: boolean;

  private getBreadcrumb(breadcrumbs: IHeaderBreadcrumb[]) {
    if (!breadcrumbs || !breadcrumbs.length) {
      return [];
    }
    return this.getBreadcrumbFromKey(breadcrumbs).breadcrumbs;
  }

  private getBreadcrumbFromKey(breadcrumbs: IHeaderBreadcrumb[]) {
    if (breadcrumbs.length === 1 || !this.breadcrumbKey) {
      return breadcrumbs[0];
    }
    return breadcrumbs.find(breadcrumb => {
      return breadcrumb.key === this.breadcrumbKey;
    }) || breadcrumbs[0];
  }

  toggleSidenav() {
    this.store.dispatch(new ToggleSideNav());
  }

  logout() {
    this.store.dispatch(new Logout());
  }

  constructor(
    private store: Store<AppState>,
    private route: ActivatedRoute,
    private router: Router,
    private tabNavService: TabNavService,
  ) {
    this.actionsKey = this.route.snapshot.data ? this.route.snapshot.data.extensionsActionsKey : null;
    this.breadcrumbKey = route.snapshot.queryParams[BREADCRUMB_URL_PARAM] || null;
    this.username$ = store.select(s => s.auth).pipe(
      map((auth: AuthState) => auth && auth.sessionData ? auth.sessionData.user.name : 'Unknown')
    );
    this.userNameFirstLetter$ = this.username$.pipe(
      map(name => name[0].toLocaleUpperCase())
    );
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    this.tabNavService.setTabs(undefined);
  }

}
