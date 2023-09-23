export type Config = Readonly<{
  tools: ReadonlyArray<ToolConfig>;
}>;

export type ToolConfig = Readonly<{
  name: `${string}/${string}`; // <user>/<repo>
  tag?: string | undefined;
}>;

export function defineConfig(config: Config): Config {
  return config;
}
