import { resolve } from "path";

import { config } from "dotenv";

config({ path: resolve(__dirname, "../../.env") });

const envHandler = (envName: string): string => {
  const env = process.env[envName];
  if (!env) throw new Error(`${envName} ENV is not set`);
  return env;
};

export default envHandler;
