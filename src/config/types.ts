import { $Type } from "../deps/dax.ts";
import { WalkEntry } from "../deps/std/fs.ts";

export type Config = Readonly<{
  shell?: Shell;
  tools: ReadonlyArray<ToolConfig>;
}>;

export type Shell = "zsh" | "bash" | "fish" | "powershell";

export type ToolConfig = Readonly<{
  name: `${string}/${string}`; // <user>/<repo>
  tag?: string | undefined;
  enabled?: boolean | undefined;
  use?: string | undefined;
  rename?: ReadonlyArray<RenameConfig> | undefined;
  executables?: ReadonlyArray<ExecutableConfig> | undefined;
  completions?: ReadonlyArray<CompletionConfig> | undefined;
  manuals?: ReadonlyArray<ManualConfig> | undefined;

  onDownload?: ((event: DownloadEvent) => Promise<void>) | undefined;
}>;

export type RenameConfig = Readonly<{
  from: string;
  to: string;
  chmod?: number | undefined;
}>;

export type ExecutableConfig = Readonly<{
  glob: string;
  exclude?: ReadonlyArray<string> | undefined;
  match?: (entry: WalkEntry) => boolean | Promise<boolean> | undefined;
  as?: string | undefined;
}>;

export type CompletionConfig = Readonly<{
  glob: string;
  exclude?: ReadonlyArray<string> | undefined;
  as?: string | undefined;
}>;

export type ManualConfig = Readonly<{
  glob: string;
  exclude?: ReadonlyArray<string> | undefined;
}>;

export type DownloadEvent = {
  name: string;
  tag: string;
  packageDir: string;
  bin: Readonly<Record<string, string>>;
  $: $Type;
};

export function defineConfig(config: Config): Config {
  return config;
}
