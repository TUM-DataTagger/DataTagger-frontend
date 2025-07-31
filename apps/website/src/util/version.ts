import { versionInfo } from './version-info';

export const version = versionInfo.version ? `v${versionInfo.version}` : versionInfo.hash;
