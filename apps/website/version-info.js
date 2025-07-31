import { writeFileSync } from 'node:fs';
import gitDescribe from 'git-describe';
import pkg from './package.json' with { type: 'json' };

const gitInfo = gitDescribe.gitDescribeSync({ match: '*' });
const versionInfo = `export const versionInfo = ${JSON.stringify({ version: pkg.version, hash: gitInfo.hash, date: new Date().toISOString() }, null, 2)};`;
writeFileSync('src/util/version-info.ts', versionInfo);
