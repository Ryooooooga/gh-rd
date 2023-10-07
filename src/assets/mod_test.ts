import { assertEquals } from "std/assert/mod.ts";
import { findAssetURL } from "./mod.ts";

Deno.test(async function testFindAssetURL(t) {
  type Test = {
    description: string;
    input: {
      artifactURLs: ReadonlyArray<string>;
      use?: string;
    };
    expected: {
      linux_x86_64: string | undefined;
      linux_aarch64: string | undefined;
      darwin_x86_64: string | undefined;
      darwin_aarch64: string | undefined;
    };
  };

  const downloads = {
    "BurntSushi/ripgrep": [
      "https://github.com/BurntSushi/ripgrep/releases/download/13.0.0/ripgrep-13.0.0-arm-unknown-linux-gnueabihf.tar.gz",
      "https://github.com/BurntSushi/ripgrep/releases/download/13.0.0/ripgrep-13.0.0-i686-pc-windows-msvc.zip",
      "https://github.com/BurntSushi/ripgrep/releases/download/13.0.0/ripgrep-13.0.0-x86_64-apple-darwin.tar.gz",
      "https://github.com/BurntSushi/ripgrep/releases/download/13.0.0/ripgrep-13.0.0-x86_64-pc-windows-gnu.zip",
      "https://github.com/BurntSushi/ripgrep/releases/download/13.0.0/ripgrep-13.0.0-x86_64-pc-windows-msvc.zip",
      "https://github.com/BurntSushi/ripgrep/releases/download/13.0.0/ripgrep-13.0.0-x86_64-unknown-linux-musl.tar.gz",
      "https://github.com/BurntSushi/ripgrep/releases/download/13.0.0/ripgrep_13.0.0_amd64.deb",
    ],
    "cli/cli": [
      "https://github.com/cli/cli/releases/download/v2.35.0/gh_2.35.0_checksums.txt",
      "https://github.com/cli/cli/releases/download/v2.35.0/gh_2.35.0_linux_386.deb",
      "https://github.com/cli/cli/releases/download/v2.35.0/gh_2.35.0_linux_386.rpm",
      "https://github.com/cli/cli/releases/download/v2.35.0/gh_2.35.0_linux_386.tar.gz",
      "https://github.com/cli/cli/releases/download/v2.35.0/gh_2.35.0_linux_amd64.deb",
      "https://github.com/cli/cli/releases/download/v2.35.0/gh_2.35.0_linux_amd64.rpm",
      "https://github.com/cli/cli/releases/download/v2.35.0/gh_2.35.0_linux_amd64.tar.gz",
      "https://github.com/cli/cli/releases/download/v2.35.0/gh_2.35.0_linux_arm64.deb",
      "https://github.com/cli/cli/releases/download/v2.35.0/gh_2.35.0_linux_arm64.rpm",
      "https://github.com/cli/cli/releases/download/v2.35.0/gh_2.35.0_linux_arm64.tar.gz",
      "https://github.com/cli/cli/releases/download/v2.35.0/gh_2.35.0_linux_armv6.deb",
      "https://github.com/cli/cli/releases/download/v2.35.0/gh_2.35.0_linux_armv6.rpm",
      "https://github.com/cli/cli/releases/download/v2.35.0/gh_2.35.0_linux_armv6.tar.gz",
      "https://github.com/cli/cli/releases/download/v2.35.0/gh_2.35.0_macOS_amd64.zip",
      "https://github.com/cli/cli/releases/download/v2.35.0/gh_2.35.0_macOS_arm64.zip",
      "https://github.com/cli/cli/releases/download/v2.35.0/gh_2.35.0_windows_386.msi",
      "https://github.com/cli/cli/releases/download/v2.35.0/gh_2.35.0_windows_386.zip",
      "https://github.com/cli/cli/releases/download/v2.35.0/gh_2.35.0_windows_amd64.msi",
      "https://github.com/cli/cli/releases/download/v2.35.0/gh_2.35.0_windows_amd64.zip",
      "https://github.com/cli/cli/releases/download/v2.35.0/gh_2.35.0_windows_arm64.zip",
    ],
    "dandavison/delta": [
      "https://github.com/dandavison/delta/releases/download/0.16.5/delta-0.16.5-aarch64-apple-darwin.tar.gz",
      "https://github.com/dandavison/delta/releases/download/0.16.5/delta-0.16.5-aarch64-unknown-linux-gnu.tar.gz",
      "https://github.com/dandavison/delta/releases/download/0.16.5/delta-0.16.5-arm-unknown-linux-gnueabihf.tar.gz",
      "https://github.com/dandavison/delta/releases/download/0.16.5/delta-0.16.5-i686-unknown-linux-gnu.tar.gz",
      "https://github.com/dandavison/delta/releases/download/0.16.5/delta-0.16.5-x86_64-apple-darwin.tar.gz",
      "https://github.com/dandavison/delta/releases/download/0.16.5/delta-0.16.5-x86_64-pc-windows-msvc.zip",
      "https://github.com/dandavison/delta/releases/download/0.16.5/delta-0.16.5-x86_64-unknown-linux-gnu.tar.gz",
      "https://github.com/dandavison/delta/releases/download/0.16.5/delta-0.16.5-x86_64-unknown-linux-musl.tar.gz",
      "https://github.com/dandavison/delta/releases/download/0.16.5/git-delta-musl_0.16.5_amd64.deb",
      "https://github.com/dandavison/delta/releases/download/0.16.5/git-delta_0.16.5_amd64.deb",
      "https://github.com/dandavison/delta/releases/download/0.16.5/git-delta_0.16.5_arm64.deb",
      "https://github.com/dandavison/delta/releases/download/0.16.5/git-delta_0.16.5_armhf.deb",
      "https://github.com/dandavison/delta/releases/download/0.16.5/git-delta_0.16.5_i386.deb",
    ],
    "dbrgn/tealdeer": [
      "https://github.com/dbrgn/tealdeer/releases/download/v1.6.1/completions_bash",
      "https://github.com/dbrgn/tealdeer/releases/download/v1.6.1/completions_fish",
      "https://github.com/dbrgn/tealdeer/releases/download/v1.6.1/completions_zsh",
      "https://github.com/dbrgn/tealdeer/releases/download/v1.6.1/LICENSE-APACHE.txt",
      "https://github.com/dbrgn/tealdeer/releases/download/v1.6.1/LICENSE-MIT.txt",
      "https://github.com/dbrgn/tealdeer/releases/download/v1.6.1/tealdeer-linux-arm-musleabi",
      "https://github.com/dbrgn/tealdeer/releases/download/v1.6.1/tealdeer-linux-arm-musleabi.sha256",
      "https://github.com/dbrgn/tealdeer/releases/download/v1.6.1/tealdeer-linux-arm-musleabihf",
      "https://github.com/dbrgn/tealdeer/releases/download/v1.6.1/tealdeer-linux-arm-musleabihf.sha256",
      "https://github.com/dbrgn/tealdeer/releases/download/v1.6.1/tealdeer-linux-armv7-musleabihf",
      "https://github.com/dbrgn/tealdeer/releases/download/v1.6.1/tealdeer-linux-armv7-musleabihf.sha256",
      "https://github.com/dbrgn/tealdeer/releases/download/v1.6.1/tealdeer-linux-i686-musl",
      "https://github.com/dbrgn/tealdeer/releases/download/v1.6.1/tealdeer-linux-i686-musl.sha256",
      "https://github.com/dbrgn/tealdeer/releases/download/v1.6.1/tealdeer-linux-x86_64-musl",
      "https://github.com/dbrgn/tealdeer/releases/download/v1.6.1/tealdeer-linux-x86_64-musl.sha256",
      "https://github.com/dbrgn/tealdeer/releases/download/v1.6.1/tealdeer-macos-x86_64",
      "https://github.com/dbrgn/tealdeer/releases/download/v1.6.1/tealdeer-macos-x86_64.sha256",
      "https://github.com/dbrgn/tealdeer/releases/download/v1.6.1/tealdeer-windows-x86_64-msvc.exe",
      "https://github.com/dbrgn/tealdeer/releases/download/v1.6.1/tealdeer-windows-x86_64-msvc.exe.sha256",
    ],
    "direnv/direnv": [
      "https://github.com/direnv/direnv/releases/download/v2.32.3/direnv.darwin-amd64",
      "https://github.com/direnv/direnv/releases/download/v2.32.3/direnv.darwin-arm64",
      "https://github.com/direnv/direnv/releases/download/v2.32.3/direnv.freebsd-386",
      "https://github.com/direnv/direnv/releases/download/v2.32.3/direnv.freebsd-amd64",
      "https://github.com/direnv/direnv/releases/download/v2.32.3/direnv.freebsd-arm",
      "https://github.com/direnv/direnv/releases/download/v2.32.3/direnv.linux-386",
      "https://github.com/direnv/direnv/releases/download/v2.32.3/direnv.linux-amd64",
      "https://github.com/direnv/direnv/releases/download/v2.32.3/direnv.linux-arm",
      "https://github.com/direnv/direnv/releases/download/v2.32.3/direnv.linux-arm64",
      "https://github.com/direnv/direnv/releases/download/v2.32.3/direnv.linux-mips",
      "https://github.com/direnv/direnv/releases/download/v2.32.3/direnv.linux-mips64",
      "https://github.com/direnv/direnv/releases/download/v2.32.3/direnv.linux-mips64le",
      "https://github.com/direnv/direnv/releases/download/v2.32.3/direnv.linux-mipsle",
      "https://github.com/direnv/direnv/releases/download/v2.32.3/direnv.linux-ppc64",
      "https://github.com/direnv/direnv/releases/download/v2.32.3/direnv.linux-ppc64le",
      "https://github.com/direnv/direnv/releases/download/v2.32.3/direnv.linux-s390x",
      "https://github.com/direnv/direnv/releases/download/v2.32.3/direnv.netbsd-386",
      "https://github.com/direnv/direnv/releases/download/v2.32.3/direnv.netbsd-amd64",
      "https://github.com/direnv/direnv/releases/download/v2.32.3/direnv.netbsd-arm",
      "https://github.com/direnv/direnv/releases/download/v2.32.3/direnv.openbsd-386",
      "https://github.com/direnv/direnv/releases/download/v2.32.3/direnv.openbsd-amd64",
      "https://github.com/direnv/direnv/releases/download/v2.32.3/direnv.windows-386.exe",
      "https://github.com/direnv/direnv/releases/download/v2.32.3/direnv.windows-amd64.exe",
    ],
    "mikefarah/yq": [
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/checksums",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/checksums-bsd",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/checksums_hashes_order",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/extract-checksum.sh",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_darwin_amd64",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_darwin_amd64.tar.gz",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_darwin_arm64",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_darwin_arm64.tar.gz",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_freebsd_386",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_freebsd_386.tar.gz",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_freebsd_amd64",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_freebsd_amd64.tar.gz",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_freebsd_arm",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_freebsd_arm.tar.gz",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_linux_386",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_linux_386.tar.gz",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_linux_amd64",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_linux_amd64.tar.gz",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_linux_arm",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_linux_arm.tar.gz",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_linux_arm64",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_linux_arm64.tar.gz",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_linux_mips",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_linux_mips.tar.gz",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_linux_mips64",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_linux_mips64.tar.gz",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_linux_mips64le",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_linux_mips64le.tar.gz",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_linux_mipsle",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_linux_mipsle.tar.gz",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_linux_ppc64",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_linux_ppc64.tar.gz",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_linux_ppc64le",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_linux_ppc64le.tar.gz",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_linux_s390x",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_linux_s390x.tar.gz",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_man_page_only.tar.gz",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_netbsd_386",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_netbsd_386.tar.gz",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_netbsd_amd64",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_netbsd_amd64.tar.gz",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_netbsd_arm",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_netbsd_arm.tar.gz",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_openbsd_386",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_openbsd_386.tar.gz",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_openbsd_amd64",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_openbsd_amd64.tar.gz",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_windows_386.exe",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_windows_386.zip",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_windows_amd64.exe",
      "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_windows_amd64.zip",
    ],
    "Ryooooooga/qwy": [
      "https://github.com/Ryooooooga/qwy/releases/download/v0.1.0-preview%2B8/qwy_0.1.0-preview+8_checksums.txt",
      "https://github.com/Ryooooooga/qwy/releases/download/v0.1.0-preview%2B8/qwy_0.1.0-preview+8_darwin_amd64.tar.gz",
      "https://github.com/Ryooooooga/qwy/releases/download/v0.1.0-preview%2B8/qwy_0.1.0-preview+8_darwin_arm64.tar.gz",
      "https://github.com/Ryooooooga/qwy/releases/download/v0.1.0-preview%2B8/qwy_0.1.0-preview+8_linux_amd64.tar.gz",
      "https://github.com/Ryooooooga/qwy/releases/download/v0.1.0-preview%2B8/qwy_0.1.0-preview+8_linux_arm64.tar.gz",
      "https://github.com/Ryooooooga/qwy/releases/download/v0.1.0-preview%2B8/qwy_0.1.0-preview+8_linux_i386.tar.gz",
      "https://github.com/Ryooooooga/qwy/releases/download/v0.1.0-preview%2B8/qwy_0.1.0-preview+8_windows_amd64.zip",
      "https://github.com/Ryooooooga/qwy/releases/download/v0.1.0-preview%2B8/qwy_0.1.0-preview+8_windows_arm64.zip",
      "https://github.com/Ryooooooga/qwy/releases/download/v0.1.0-preview%2B8/qwy_0.1.0-preview+8_windows_i386.zip",
    ],
    "Ryooooooga/zabrze": [
      "https://github.com/Ryooooooga/zabrze/releases/download/v0.3.0/checksum.txt",
      "https://github.com/Ryooooooga/zabrze/releases/download/v0.3.0/zabrze-v0.3.0-aarch64-apple-darwin.tar.gz",
      "https://github.com/Ryooooooga/zabrze/releases/download/v0.3.0/zabrze-v0.3.0-aarch64-unknown-linux-gnu.tar.gz",
      "https://github.com/Ryooooooga/zabrze/releases/download/v0.3.0/zabrze-v0.3.0-x86_64-apple-darwin.tar.gz",
      "https://github.com/Ryooooooga/zabrze/releases/download/v0.3.0/zabrze-v0.3.0-x86_64-pc-windows-gnu.zip",
      "https://github.com/Ryooooooga/zabrze/releases/download/v0.3.0/zabrze-v0.3.0-x86_64-unknown-linux-gnu.tar.gz",
    ],
    "x-motemen/ghq": [
      "https://github.com/x-motemen/ghq/releases/download/v1.4.2/ghq_darwin_amd64.zip",
      "https://github.com/x-motemen/ghq/releases/download/v1.4.2/ghq_darwin_arm64.zip",
      "https://github.com/x-motemen/ghq/releases/download/v1.4.2/ghq_linux_amd64.zip",
      "https://github.com/x-motemen/ghq/releases/download/v1.4.2/ghq_linux_arm64.zip",
      "https://github.com/x-motemen/ghq/releases/download/v1.4.2/ghq_windows_amd64.zip",
      "https://github.com/x-motemen/ghq/releases/download/v1.4.2/ghq_windows_arm64.zip",
      "https://github.com/x-motemen/ghq/releases/download/v1.4.2/SHASUMS",
    ],
    "neovim/neovim": [
      "https://github.com/x-motemen/ghq/releases/download/stable/nvim-linux64.tar.gz",
      "https://github.com/x-motemen/ghq/releases/download/stable/nvim-macos.tar.gz",
      "https://github.com/x-motemen/ghq/releases/download/stable/nvim-win64.zip",
      "https://github.com/x-motemen/ghq/releases/download/stable/nvim.appimage",
      "https://github.com/x-motemen/ghq/releases/download/stable/nvim.appimage.zsync",
    ],
  };

  const tests: ReadonlyArray<Test> = [
    {
      description: "BurntSushi/ripgrep",
      input: {
        artifactURLs: downloads["BurntSushi/ripgrep"],
      },
      expected: {
        linux_x86_64:
          "https://github.com/BurntSushi/ripgrep/releases/download/13.0.0/ripgrep-13.0.0-x86_64-unknown-linux-musl.tar.gz",
        linux_aarch64:
          "https://github.com/BurntSushi/ripgrep/releases/download/13.0.0/ripgrep-13.0.0-arm-unknown-linux-gnueabihf.tar.gz",
        darwin_x86_64:
          "https://github.com/BurntSushi/ripgrep/releases/download/13.0.0/ripgrep-13.0.0-x86_64-apple-darwin.tar.gz",
        darwin_aarch64: undefined,
      },
    },
    {
      description: "cli/cli",
      input: {
        artifactURLs: downloads["cli/cli"],
      },
      expected: {
        linux_x86_64:
          "https://github.com/cli/cli/releases/download/v2.35.0/gh_2.35.0_linux_amd64.tar.gz",
        linux_aarch64:
          "https://github.com/cli/cli/releases/download/v2.35.0/gh_2.35.0_linux_arm64.tar.gz",
        darwin_x86_64:
          "https://github.com/cli/cli/releases/download/v2.35.0/gh_2.35.0_macOS_amd64.zip",
        darwin_aarch64:
          "https://github.com/cli/cli/releases/download/v2.35.0/gh_2.35.0_macOS_arm64.zip",
      },
    },
    {
      description: "dandavison/delta",
      input: {
        artifactURLs: downloads["dandavison/delta"],
      },
      expected: {
        linux_x86_64:
          "https://github.com/dandavison/delta/releases/download/0.16.5/delta-0.16.5-x86_64-unknown-linux-gnu.tar.gz",
        linux_aarch64:
          "https://github.com/dandavison/delta/releases/download/0.16.5/delta-0.16.5-aarch64-unknown-linux-gnu.tar.gz",
        darwin_x86_64:
          "https://github.com/dandavison/delta/releases/download/0.16.5/delta-0.16.5-x86_64-apple-darwin.tar.gz",
        darwin_aarch64:
          "https://github.com/dandavison/delta/releases/download/0.16.5/delta-0.16.5-aarch64-apple-darwin.tar.gz",
      },
    },
    {
      description: "dbrgn/tealdeer",
      input: {
        artifactURLs: downloads["dbrgn/tealdeer"],
      },
      expected: {
        linux_x86_64:
          "https://github.com/dbrgn/tealdeer/releases/download/v1.6.1/tealdeer-linux-x86_64-musl",
        linux_aarch64:
          "https://github.com/dbrgn/tealdeer/releases/download/v1.6.1/tealdeer-linux-arm-musleabi",
        darwin_x86_64:
          "https://github.com/dbrgn/tealdeer/releases/download/v1.6.1/tealdeer-macos-x86_64",
        darwin_aarch64: undefined,
      },
    },
    {
      description: "direnv/direnv",
      input: {
        artifactURLs: downloads["direnv/direnv"],
      },
      expected: {
        linux_x86_64:
          "https://github.com/direnv/direnv/releases/download/v2.32.3/direnv.linux-amd64",
        linux_aarch64:
          "https://github.com/direnv/direnv/releases/download/v2.32.3/direnv.linux-arm64",
        darwin_x86_64:
          "https://github.com/direnv/direnv/releases/download/v2.32.3/direnv.darwin-amd64",
        darwin_aarch64:
          "https://github.com/direnv/direnv/releases/download/v2.32.3/direnv.darwin-arm64",
      },
    },
    {
      description: "mikefarah/yq",
      input: {
        artifactURLs: downloads["mikefarah/yq"],
      },
      expected: {
        linux_x86_64:
          "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_linux_amd64.tar.gz",
        linux_aarch64:
          "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_linux_arm64.tar.gz",
        darwin_x86_64:
          "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_darwin_amd64.tar.gz",
        darwin_aarch64:
          "https://github.com/mikefarah/yq/releases/download/v4.35.1/yq_darwin_arm64.tar.gz",
      },
    },
    {
      description: "Ryooooooga/qwy",
      input: {
        artifactURLs: downloads["Ryooooooga/qwy"],
      },
      expected: {
        linux_x86_64:
          "https://github.com/Ryooooooga/qwy/releases/download/v0.1.0-preview%2B8/qwy_0.1.0-preview+8_linux_amd64.tar.gz",
        linux_aarch64:
          "https://github.com/Ryooooooga/qwy/releases/download/v0.1.0-preview%2B8/qwy_0.1.0-preview+8_linux_arm64.tar.gz",
        darwin_x86_64:
          "https://github.com/Ryooooooga/qwy/releases/download/v0.1.0-preview%2B8/qwy_0.1.0-preview+8_darwin_amd64.tar.gz",
        darwin_aarch64:
          "https://github.com/Ryooooooga/qwy/releases/download/v0.1.0-preview%2B8/qwy_0.1.0-preview+8_darwin_arm64.tar.gz",
      },
    },
    {
      description: "Ryooooooga/zabrze",
      input: {
        artifactURLs: downloads["Ryooooooga/zabrze"],
      },
      expected: {
        linux_x86_64:
          "https://github.com/Ryooooooga/zabrze/releases/download/v0.3.0/zabrze-v0.3.0-x86_64-unknown-linux-gnu.tar.gz",
        linux_aarch64:
          "https://github.com/Ryooooooga/zabrze/releases/download/v0.3.0/zabrze-v0.3.0-aarch64-unknown-linux-gnu.tar.gz",
        darwin_x86_64:
          "https://github.com/Ryooooooga/zabrze/releases/download/v0.3.0/zabrze-v0.3.0-x86_64-apple-darwin.tar.gz",
        darwin_aarch64:
          "https://github.com/Ryooooooga/zabrze/releases/download/v0.3.0/zabrze-v0.3.0-aarch64-apple-darwin.tar.gz",
      },
    },
    {
      description: "x-motemen/ghq",
      input: {
        artifactURLs: downloads["x-motemen/ghq"],
      },
      expected: {
        linux_x86_64:
          "https://github.com/x-motemen/ghq/releases/download/v1.4.2/ghq_linux_amd64.zip",
        linux_aarch64:
          "https://github.com/x-motemen/ghq/releases/download/v1.4.2/ghq_linux_arm64.zip",
        darwin_x86_64:
          "https://github.com/x-motemen/ghq/releases/download/v1.4.2/ghq_darwin_amd64.zip",
        darwin_aarch64:
          "https://github.com/x-motemen/ghq/releases/download/v1.4.2/ghq_darwin_arm64.zip",
      },
    },
    {
      description: "neovim/neovim with use",
      input: {
        artifactURLs: downloads["neovim/neovim"],
        use: "*.appimage",
      },
      expected: {
        linux_x86_64:
          "https://github.com/x-motemen/ghq/releases/download/stable/nvim.appimage",
        linux_aarch64:
          "https://github.com/x-motemen/ghq/releases/download/stable/nvim.appimage",
        darwin_x86_64:
          "https://github.com/x-motemen/ghq/releases/download/stable/nvim.appimage",
        darwin_aarch64:
          "https://github.com/x-motemen/ghq/releases/download/stable/nvim.appimage",
      },
    },
  ];

  for (const s of tests) {
    await t.step(s.description, () => {
      assertEquals(
        findAssetURL(
          s.input.artifactURLs,
          s.input.use,
          "linux",
          "x86_64",
        ),
        s.expected.linux_x86_64,
      );

      assertEquals(
        findAssetURL(
          s.input.artifactURLs,
          s.input.use,
          "linux",
          "aarch64",
        ),
        s.expected.linux_aarch64,
      );
      assertEquals(
        findAssetURL(
          s.input.artifactURLs,
          s.input.use,
          "darwin",
          "x86_64",
        ),
        s.expected.darwin_x86_64,
      );
      assertEquals(
        findAssetURL(
          s.input.artifactURLs,
          s.input.use,
          "darwin",
          "aarch64",
        ),
        s.expected.darwin_aarch64,
      );
    });
  }
});
