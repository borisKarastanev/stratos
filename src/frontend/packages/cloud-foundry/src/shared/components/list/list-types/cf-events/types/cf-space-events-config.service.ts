import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { IListConfig } from '../../../../../../../../core/src/shared/components/list/list.component.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { CFAppState } from '../../../../../../cf-app-state';
import { CloudFoundrySpaceService } from '../../../../../../features/cloud-foundry/services/cloud-foundry-space.service';
import { CfEventsConfigService } from '../cf-events-config.service';


@Injectable()
export class CfSpaceEventsConfigService extends CfEventsConfigService implements IListConfig<APIResource> {

  constructor(store: Store<CFAppState>, spaceService: CloudFoundrySpaceService) {
    super(
      store,
      spaceService.cfGuid,
      null,
      spaceService.spaceGuid
    );
  }
}
