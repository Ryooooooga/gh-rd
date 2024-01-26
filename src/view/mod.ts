import { basename } from "../deps/std/path.ts";
import { MultiProgressBar } from "../deps/progress.ts";
import { ToolConfig } from "../config/mod.ts";

export type InstallationState = Readonly<
  // In progress states
  | { type: "fetching_release_tag" }
  | { type: "fetching_artifact_urls"; tag: string }
  | { type: "downloading_asset"; assetURL: string }
  | { type: "extracting_asset"; assetPath: string }
  | { type: "renaming_files" }
  | { type: "linking_executables" }
  | { type: "linking_completions" }
  | { type: "linking_manuals" }
  // Completed states
  | { type: "completed"; tag: string }
  | { type: "skipped" }
  | { type: "up_to_date"; tag: string }
  | { type: "error"; error: unknown }
>;

export interface View {
  start(tools: ReadonlyArray<ToolConfig>): void;
  finish(): void;

  update(name: string, state: InstallationState): void;
}

export class ConsoleView implements View {
  start(_tools: ReadonlyArray<ToolConfig>): void {
  }

  finish(): void {
  }

  update(name: string, state: InstallationState): void {
    switch (state.type) {
      case "fetching_release_tag":
        break;
      case "fetching_artifact_urls":
        break;
      case "downloading_asset":
        console.log(`Downloading asset '${state.assetURL}'...`);
        break;
      case "extracting_asset":
        console.log(`Extracting asset '${basename(state.assetPath)}'...`);
        break;
      case "renaming_files":
        break;
      case "linking_executables":
        break;
      case "linking_completions":
        break;
      case "linking_manuals":
        break;
      case "completed":
        console.log(`Install completed '${name}' (${state.tag})`);
        break;
      case "skipped":
        console.log(`Skipped '${name}'`);
        break;
      case "up_to_date":
        console.log(`'${name}' is up to date (${state.tag})`);
        break;
      case "error":
        console.error(`Error while installing '${name}': ${state.error}`);
        break;
      default:
        state satisfies never;
        break;
    }
  }
}

export class ProgressView implements View {
  private progressBars: MultiProgressBar;
  private bars: Array<{ name: string; text: string }>;

  constructor() {
    this.progressBars = new MultiProgressBar({
      title: "Installing packages",
      display: ":text",
      interval: 20,
    });

    this.bars = [];
  }

  start(tools: ReadonlyArray<ToolConfig>): void {
    this.bars = tools.map(({ name }) => ({
      name,
      text: "Installing package...",
    }));

    this.render();
  }

  finish(): void {
    setTimeout(() => {
      this.render();
      this.progressBars.end();
    }, 25);
  }

  update(name: string, state: InstallationState): void {
    switch (state.type) {
      case "fetching_release_tag":
        break;
      case "fetching_artifact_urls":
        break;
      case "downloading_asset":
        this.updateBar(name, `Downloading asset...`);
        break;
      case "extracting_asset":
        this.updateBar(
          name,
          `Extracting asset '${basename(state.assetPath)}'...`,
        );
        break;
      case "renaming_files":
        break;
      case "linking_executables":
        break;
      case "linking_completions":
        break;
      case "linking_manuals":
        break;
      case "completed":
        this.updateBar(
          name,
          `Install completed (${state.tag})`,
        );
        break;
      case "skipped":
        this.updateBar(name, "Skipped");
        break;
      case "up_to_date":
        this.updateBar(name, `Up to date (${state.tag})`);
        break;
      case "error":
        this.updateBar(name, `Error: ${state.error}`);
        break;
      default:
        state satisfies never;
        break;
    }

    this.render();
  }

  private updateBar(name: string, text: string): void {
    const bar = this.bars.find((bar) => bar.name === name);
    if (bar !== undefined) {
      bar.text = text.padEnd(bar.text.length, " ");
    } else {
      this.bars.push({ name, text: text });
    }
  }

  private render(): void {
    const nameLength = this.bars.reduce(
      (length, bar) => Math.max(length, bar.name.length),
      0,
    );

    this.progressBars.render(this.bars.map(({ name, text }) => ({
      completed: 0,
      total: 100,
      text: `${name.padEnd(nameLength, " ")}  ${text}`,
    })));
  }
}

export function createView(): View {
  if (Deno.stdout.isTerminal()) {
    return new ProgressView();
  } else {
    return new ConsoleView();
  }
}
