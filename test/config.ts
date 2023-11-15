import { defineConfig } from "../src/config/types.ts";

async function saveCommandOutput(
  to: string,
  cmd: string,
  ...args: string[]
) {
  const { stdout } = await new Deno.Command(cmd, {
    args,
    stderr: "inherit",
  }).output();

  await Deno.writeFile(to, stdout);
}

async function saveRemoteFile(
  to: string,
  from: string,
) {
  const res = await fetch(new URL(from));
  if (res.body !== null) {
    await Deno.writeFile(to, res.body);
  }
}

export default defineConfig({
  shell: "zsh",
  tools: [
    {
      name: "rossmacarthur/sheldon",
    },
    {
      name: "Ryooooooga/croque",
      async onDownload({ packageDir, bin }) {
        await saveCommandOutput(
          `${packageDir}/croque.zsh`,
          bin.croque,
          "init",
          "zsh",
        );
      },
    },
    {
      name: "Ryooooooga/zabrze",
      async onDownload({ packageDir, bin }) {
        await saveCommandOutput(
          `${packageDir}/zabrze.zsh`,
          bin.zabrze,
          "init",
          "--bind-keys",
        );
      },
    },
    {
      name: "Ryooooooga/qwy",
      async onDownload({ packageDir, bin }) {
        await saveCommandOutput(
          `${packageDir}/qwy.zsh`,
          bin.qwy,
          "init",
        );
      },
    },
    {
      name: "Ryooooooga/zouch",
    },
    {
      name: "Ryooooooga/monkeywrench",
    },
    {
      name: "direnv/direnv",
      rename: [
        { from: "direnv*", to: "direnv" },
      ],
      async onDownload({ packageDir, bin }) {
        await Deno.chmod(bin.direnv, 0o755);
        await saveCommandOutput(
          `${packageDir}/direnv.zsh`,
          bin.direnv,
          "hook",
          "zsh",
        );
      },
    },
    {
      name: "dandavison/delta",
    },
    {
      name: "itchyny/mmv",
    },
    {
      name: "BurntSushi/ripgrep",
      executables: [
        { glob: "**/rg", as: "rg" },
      ],
    },
    {
      name: "x-motemen/ghq",
    },
    {
      name: "jesseduffield/lazygit",
    },
    {
      name: "cli/cli",
      async onDownload({ packageDir, bin }) {
        await saveCommandOutput(
          `${packageDir}/_gh`,
          bin.gh,
          "completion",
          "--shell",
          "zsh",
        );
      },
    },
    {
      name: "eza-community/eza",
      enabled: Deno.build.os !== "darwin",
      async onDownload({ packageDir }) {
        await saveRemoteFile(
          `${packageDir}/_eza`,
          "https://raw.githubusercontent.com/eza-community/eza/main/completions/zsh/_eza",
        );
      },
    },
    {
      name: "mikefarah/yq",
      rename: [
        { from: "yq_*", to: "yq" },
      ],
      async onDownload({ packageDir, bin }) {
        await saveCommandOutput(
          `${packageDir}/_yq`,
          bin.yq,
          "shell-completion",
          "zsh",
        );
      },
    },
    {
      name: "rhysd/hgrep",
      async onDownload({ packageDir, bin }) {
        await saveCommandOutput(
          `${packageDir}/_hgrep`,
          bin.hgrep,
          "--generate-completion-script",
          "zsh",
        );
      },
    },
    {
      name: "denisidoro/navi",
    },
    {
      name: "dbrgn/tealdeer",
      rename: [
        { from: "tealdeer*", to: "tldr" },
      ],
      executables: [
        { glob: "tldr", as: "tldr" },
      ],
      async onDownload({ packageDir }) {
        await saveRemoteFile(
          `${packageDir}/_tldr`,
          "https://github.com/dbrgn/tealdeer/releases/latest/download/completions_zsh",
        );
      },
    },
    {
      name: "himanoa/mdmg",
      async onDownload({ packageDir }) {
        await saveRemoteFile(
          `${packageDir}/_mdmg`,
          "https://raw.githubusercontent.com/Ryooooooga/mdmg/master/completions/mdmg.completion.zsh",
        );
      },
    },
    {
      name: "junegunn/fzf",
      async onDownload({ packageDir }) {
        await saveRemoteFile(
          `${packageDir}/_fzf`,
          "https://raw.githubusercontent.com/junegunn/fzf/master/shell/completion.zsh",
        );
      },
    },
    {
      name: "sharkdp/bat",
    },
    {
      name: "sharkdp/fd",
    },
    {
      name: "XAMPPRocky/tokei",
    },
    {
      name: "neovim/neovim",
      enabled: Deno.build.arch === "x86_64",
      use: (() => {
        switch (Deno.build.os) {
          case "darwin":
            return "nvim-macos.tar.gz";
          case "linux":
            return "nvim-linux64.tar.gz";
          default:
            return undefined;
        }
      })(),
    },
  ],
});
