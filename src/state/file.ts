import { dirname } from "../deps/std/path.ts";
import * as YAML from "../deps/std/yaml.ts";
import { getStatePath } from "../path.ts";
import { State } from "./types.ts";

export async function loadState(): Promise<State> {
  try {
    const content = await Deno.readTextFile(getStatePath());
    return YAML.parse(content) as State;
  } catch (_err) {
    return { tools: [] };
  }
}

export async function saveState(state: State) {
  const statePath = getStatePath();
  const content = YAML.stringify(state);
  await Deno.mkdir(dirname(statePath), { recursive: true });
  await Deno.writeTextFile(statePath, content);
}
