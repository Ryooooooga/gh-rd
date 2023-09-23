export type Config = Readonly<{
  tools: ReadonlyArray<ToolConfig>;
}>;

export type ToolConfig = Readonly<{
  name: `${string}/${string}`; // <user>/<repo>
  tag?: string | undefined;
  executables?: ReadonlyArray<ExecutableConfig> | undefined;
}>;

export type ExecutableConfig = Readonly<{
  glob: string;
  as?: string | undefined;
}>;

export function defineConfig(config: Config): Config {
  return config;
}
