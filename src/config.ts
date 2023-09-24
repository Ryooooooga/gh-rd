export type Config = Readonly<{
  tools: ReadonlyArray<ToolConfig>;
}>;

export type ToolConfig = Readonly<{
  name: `${string}/${string}`; // <user>/<repo>
  tag?: string | undefined;
  rename?: ReadonlyArray<RenameConfig> | undefined;
  executables?: ReadonlyArray<ExecutableConfig> | undefined;

  onDownload?: ((event: DownloadEvent) => Promise<void>) | undefined;
}>;

export type RenameConfig = Readonly<{
  from: string;
  to: string;
}>;

export type ExecutableConfig = Readonly<{
  glob: string;
  as?: string | undefined;
}>;

export type DownloadEvent = {
  name: string;
  tag: string;
  packageDir: string;
};

export function defineConfig(config: Config): Config {
  return config;
}
