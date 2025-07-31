import { loadEnvConfig } from '@next/env';

const projectDir = process.cwd();
export const { combinedEnv, parsedEnv } = loadEnvConfig(projectDir);
