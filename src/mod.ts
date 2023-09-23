import { Config } from "./config.ts";
import { getConfigPath } from "./path.ts";

export async function loadConfig(): Promise<Config> {
  const { default: config } = await import(getConfigPath());
  return config;
}
