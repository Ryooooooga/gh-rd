const ghrdConfigFile = () => Deno.env.get("GHRD_CONFIG_FILE");
const ghrdConfigHome = () => Deno.env.get("GHRD_CONFIG_HOME");
const ghrdDataHome = () => Deno.env.get("GHRD_DATA_HOME");
const ghrdStateFile = () => Deno.env.get("GHRD_STATE_FILE");
const ghrdStateHome = () => Deno.env.get("GHRD_STATE_HOME");

const home = () => Deno.env.get("HOME") ?? "";
const xdgConfigHome = () => Deno.env.get("XDG_CONFIG_HOME");
const xdgDataHome = () => Deno.env.get("XDG_DATA_HOME");
const xdgStateHome = () => Deno.env.get("XDG_STATE_HOME");

function getConfigDir(): string {
  return ghrdConfigHome() ?? `${xdgConfigHome() ?? `${home()}/.config`}/gh-rd`;
}

export function getConfigPath(): string {
  return ghrdConfigFile() ?? `${getConfigDir()}/config.ts`;
}

function getDataHomePath(): string {
  return ghrdDataHome() ?? `${xdgDataHome() ?? `${home()}/.local/share`}/gh-rd`;
}

export function getBinDir(): string {
  return `${getDataHomePath()}/bin`;
}

export function getPackagesDir(): string {
  return `${getDataHomePath()}/packages`;
}

export function getPackageDir(user: string, repo: string): string {
  return `${getPackagesDir()}/github.com/${encodeURIComponent(user)}/${
    encodeURIComponent(repo)
  }`;
}

function getStateDir(): string {
  return ghrdStateHome() ??
    `${xdgStateHome() ?? `${home()}/.local/state`}/gh-rd`;
}

export function getStatePath(): string {
  return ghrdStateFile() ?? `${getStateDir()}/state.yaml`;
}
