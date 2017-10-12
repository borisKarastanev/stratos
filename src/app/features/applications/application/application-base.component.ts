import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Rx';

import { EntityInfo } from '../../../store/actions/api.actions';
import { AppMetadataInfo } from '../../../store/actions/app-metadata.actions';
import { DeleteApplication } from '../../../store/actions/application.actions';
import { AppState } from '../../../store/app-state';
import { ApplicationData, ApplicationService } from '../application.service';

interface ApplicationEdits {
  name: string;
  instances: number;
  memory: number;
  enable_ssh: boolean;
}

@Component({
  selector: 'app-application-base',
  templateUrl: './application-base.component.html',
  styleUrls: ['./application-base.component.scss'],
  providers: [ApplicationService]
})
export class ApplicationBaseComponent implements OnInit, OnDestroy {
  [x: string]: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private applicationService: ApplicationService,
    private store: Store<AppState>
  ) { }

  sub: Subscription[] = [];
  isFetching$: Observable<boolean>;
  application;

  isEditSummary = false;

  summaryExpanded = true;

  summaryDataChanging: Observable<boolean>;

  appEdits: ApplicationEdits;
  appDefaultEdits: ApplicationEdits = {
    enable_ssh: false,
    instances: 0,
    memory: 0,
    name: ''
  };

  tabLinks = [
    { link: 'summary', label: 'Build Info' },
    { link: 'log-stream', label: 'Log Stream' },
    { link: 'services', label: 'Services' },
    { link: 'variables', label: 'Variables' },
    { link: 'events', label: 'Events' },
    { link: 'ssh', label: 'SSH' }
  ];

  startEdit() {
    this.isEditSummary = true;
    this.setAppDefaults();
  }

  endEdit() {
    this.isEditSummary = false;
  }

  saveEdits() {
    this.endEdit();
    this.applicationService.UpdateApplication(this.appEdits);
  }

  setAppDefaults() {
    this.appEdits = { ... this.appDefaultEdits };
  }

  deleteApplication() {
    this.store.dispatch(new DeleteApplication(this.applicationService.appGuid, this.applicationService.cfGuid));
  }

  ngOnInit() {
    this.setAppDefaults();

    this.sub.push(this.route.params.subscribe(params => {
      const { id, cfId } = params;
      this.applicationService.SetApplication(cfId, id);
      this.sub.push(this.applicationService.application$.subscribe(({ app }) => {
        this.application = app.entity;
      }));
      this.isFetching$ = this.applicationService.isFetchingApp$;
    }));

    this.summaryDataChanging$ = this.applicationService.app$
      .combineLatest(
      this.applicationService.isFetchingApp$,
      this.applicationService.isUpdatingApp$,
      this.applicationService.appEnvVars$,
      this.applicationService.appStatsGated$
      ).map(([app, isFetchingApp, isUpdatingApp, appEnvVars, appStatsGated]: [any, boolean, boolean, AppMetadataInfo, any]) => {
        const isFetching = isFetchingApp
          || (appEnvVars ? appEnvVars.metadataRequestState.fetching : false)
          || (appStatsGated ? appStatsGated.metadataRequestState.fetching : false);

        const isUpdating = isUpdatingApp;

        return isFetching || isUpdating;
      });

    this.sub.push(this.summaryDataChanging$
      .filter((isChanging) => {
        return !isChanging;
      })
      .mergeMap(_ => {
        return Observable.combineLatest(this.applicationService.application$, this.applicationService.appSummary$);
      })
      .subscribe(([application, appSummary]: [ApplicationData, EntityInfo]) => {
        this.appDefaultEdits = {
          name: application.app.entity.name,
          instances: appSummary.entity.entity.instances,
          memory: application.app.entity.memory,
          enable_ssh: application.app.entity.enable_ssh
        };
      }, e => {
        if (e.error === this.applicationService.fatalErrorMessage) {
          this.router.navigateByUrl('applications');
        }
      }));
  }


  ngOnDestroy() {
    this.sub.forEach(subscription => subscription.unsubscribe());
  }
}
