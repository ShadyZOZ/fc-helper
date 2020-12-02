export interface ICredentials {
  accessKeyId?: string;
  accessKeySecret?: string;
  securityToken?: string;
}

export interface IFunctions {
  name?: string;
  handler?: string;
  memory?: number; // Integer, in MB.
  timeout?: number; // Integer, in seconds.
}

export interface IService {
  name: string;
  logProject: string;
  logStore: string;
  qualifier: string;
  versionId: string;
}

export interface FCContext {
  requestId?: string;
  credentials?: ICredentials;
  function?: IFunctions;
  service?: IService;
  region?: string;
  accountId?: string;
}
