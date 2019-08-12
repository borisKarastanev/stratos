import { compose } from '@ngrx/store';

import { CFAppState } from '../../cf-app-state';
import { DeployApplicationSource, DeployApplicationState, ProjectExists } from '../types/deploy-application.types';

export const selectDeployAppState = (state: CFAppState) => {
  // console.log('selectDeployAppState: ', Object.keys(state));
  // console.log('selectDeployAppState: ', state.deployApplication);
  // console.log('selectDeployAppState: ', state.deployApplication.applicationSource);
  return state.deployApplication;
};

export const getApplicationSource = (state: DeployApplicationState) => state.applicationSource;
export const getSourceType = (state: DeployApplicationSource) => state && state.type;
export const getApplicationProjectName = (state: DeployApplicationSource) => state && state.projectName;
export const getProjectExists = (state: DeployApplicationState) => state && state.projectExists;
export const getCommit = (state: DeployApplicationSource) => state && state.commit;
export const getBranch = (state: DeployApplicationSource) => state && state.branch;
export const getDeployBranchName = (state: DeployApplicationSource) => state && state.branchName;
export const getCFDetails = (state: DeployApplicationState) => state && state.cloudFoundryDetails;
export const getProjectName = (state: ProjectExists) => state && state.name;

export const selectSourceType = compose(
  getSourceType,
  getApplicationSource,
  selectDeployAppState
);
export const selectApplicationSource = compose(
  getApplicationSource,
  selectDeployAppState
);

export const selectProjectName = compose(
  getApplicationProjectName,
  getApplicationSource,
  selectDeployAppState
);

export const selectProjectExists = compose(
  getProjectExists,
  selectDeployAppState
);

export const selectNewProjectCommit = compose(
  getCommit,
  getApplicationSource,
  selectDeployAppState
);

export const selectNewProjectBranch = compose(
  getBranch,
  getApplicationSource,
  selectDeployAppState
);

export const selectCfDetails = compose(
  getCFDetails,
  selectDeployAppState
);

export const selectDeployBranchName = compose(
  getDeployBranchName,
  getApplicationSource,
  selectDeployAppState
);

export const selectPEProjectName = compose(
  getProjectName,
  getProjectExists,
  selectDeployAppState
);
