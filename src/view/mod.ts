import { basename } from "std/path/mod.ts";

export type InstallationState = Readonly<
  // In progress states
  | { type: "fetching_release_tag" }
  | { type: "fetching_artifact_urls"; tag: string }
  | { type: "downloading_asset"; assetURL: string }
  | { type: "extracting_asset"; assetPath: string }
  | { type: "renaming_files" }
  | { type: "linking_executables" }
  | { type: "linking_completions" }
  // Completed states
  | { type: "completed" }
  | { type: "skipped" }
  | { type: "up_to_date" }
  | { type: "error"; error: unknown }
>;

export interface View {
  start(): void;
  finish(): void;

  update(name: string, state: InstallationState): void;
}

export class ConsoleView implements View {
  start(): void {
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
      case "completed":
        console.log(`Install completed '${name}'`);
        break;
      case "skipped":
        console.log(`Skipped '${name}'`);
        break;
      case "up_to_date":
        console.log(`'${name}' is up to date`);
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
