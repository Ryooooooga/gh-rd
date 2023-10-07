import { getConfigPath } from "../path.ts";
import { Config } from "./types.ts";

export async function loadConfig(): Promise<Config> {
  const { default: config } = await import(getConfigPath());

  const nameSet = new Set<string>();
  for (const tool of config.tools) {
    if (nameSet.has(tool.name)) {
      throw new Error(`Duplicate tool name: ${tool.name}`);
    }
    nameSet.add(tool.name);
  }

  return config;
}
