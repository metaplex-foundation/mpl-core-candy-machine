#!/bin/bash

# Wraps `solana-verify verify-from-repo` for this workspace.
#
# Usage:
#   ./verify-from-repo.sh --program-id <PUBKEY> [--program <candy-guard|candy-machine-core>]
#                         [--url <RPC_URL>] [--keypair <PATH>]
#                         [--commit-hash <SHA>] [--library-name <LIB>]
#                         [--mount-path <DIR>] [--workspace-path <DIR>]
#                         [--repo-url <URL>] [--skip-prompt] [--] [extra args]
#
# Defaults:
#   --program       : candy-guard
#   --library-name  : derived from --program (mpl_core_candy_guard /
#                     mpl_core_candy_machine_core)
#   --mount-path    : programs (the unified workspace root; candy-guard has a
#                     path dependency on candy-machine-core so both must be
#                     mounted together for the docker build to resolve them)
#   --workspace-path: omitted by default, so solana-verify uses --mount-path
#   --repo-url      : derived from `git remote get-url origin`, normalized to
#                     https://
#   --commit-hash   : current HEAD if inside a clean repo, otherwise required
#
# The on-chain hash is fetched from the cluster targeted by --url and compared
# against a deterministic docker build of the resolved commit.

set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
ROOT_DIR=$(dirname "$(dirname "${SCRIPT_DIR}")")
cd "${ROOT_DIR}"

PROGRAM_ID=""
RPC_URL=""
KEYPAIR=""
COMMIT_HASH=""
PROGRAM=""
LIBRARY_NAME=""
MOUNT_PATH=""
WORKSPACE_PATH=""
REPO_URL=""
SKIP_PROMPT=()
PASSTHROUGH=()

require_value() {
    if [ $# -lt 2 ] || [[ "$2" == -* ]]; then
        echo "error: missing value for $1" >&2
        exit 2
    fi
}

while [ $# -gt 0 ]; do
    case "$1" in
        --program-id)
            require_value "$@"
            PROGRAM_ID="$2"
            shift 2
            ;;
        --program)
            require_value "$@"
            PROGRAM="$2"
            shift 2
            ;;
        --url|-u)
            require_value "$@"
            RPC_URL="$2"
            shift 2
            ;;
        --keypair|-k)
            require_value "$@"
            KEYPAIR="$2"
            shift 2
            ;;
        --commit-hash)
            require_value "$@"
            COMMIT_HASH="$2"
            shift 2
            ;;
        --library-name)
            require_value "$@"
            LIBRARY_NAME="$2"
            shift 2
            ;;
        --mount-path)
            require_value "$@"
            MOUNT_PATH="$2"
            shift 2
            ;;
        --workspace-path)
            require_value "$@"
            WORKSPACE_PATH="$2"
            shift 2
            ;;
        --repo-url)
            require_value "$@"
            REPO_URL="$2"
            shift 2
            ;;
        --skip-prompt|-y)
            SKIP_PROMPT=(--skip-prompt)
            shift
            ;;
        --)
            shift
            PASSTHROUGH=("$@")
            break
            ;;
        -h|--help)
            sed -n '3,25p' "$0"
            exit 0
            ;;
        *)
            PASSTHROUGH+=("$1")
            shift
            ;;
    esac
done

if [ -z "${PROGRAM_ID}" ]; then
    echo "error: --program-id is required" >&2
    exit 1
fi

# Default to candy-guard so the wrapper has a sensible single-program flow,
# matching the deploy-program default. Callers can flip --program when they
# need to verify the other program in this repo.
if [ -z "${PROGRAM}" ]; then
    PROGRAM="candy-guard"
fi

case "${PROGRAM}" in
    candy-guard)
        DEFAULT_LIBRARY_NAME="mpl_core_candy_guard"
        DEFAULT_PACKAGE_NAME="mpl-core-candy-guard"
        ;;
    candy-machine-core)
        DEFAULT_LIBRARY_NAME="mpl_core_candy_machine_core"
        DEFAULT_PACKAGE_NAME="mpl-core-candy-machine-core"
        ;;
    *)
        echo "error: unknown --program '${PROGRAM}' (expected candy-guard or candy-machine-core)" >&2
        exit 1
        ;;
esac

if [ -z "${LIBRARY_NAME}" ]; then
    LIBRARY_NAME="${DEFAULT_LIBRARY_NAME}"
fi

if [ -z "${MOUNT_PATH}" ]; then
    MOUNT_PATH="programs"
fi

# Resolve repo URL from git remote when the caller did not supply one. We
# normalize SSH-style remotes to https://, since solana-verify expects an
# https URL it can hand to the OtterSec API for remote verification.
if [ -z "${REPO_URL}" ]; then
    if ! origin=$(git remote get-url origin 2>/dev/null); then
        echo "error: --repo-url not provided and no git origin found" >&2
        exit 1
    fi

    if [[ "${origin}" =~ ^git@github\.com:(.+)$ ]]; then
        REPO_URL="https://github.com/${BASH_REMATCH[1]}"
    elif [[ "${origin}" =~ ^ssh://git@github\.com[:/](.+)$ ]]; then
        REPO_URL="https://github.com/${BASH_REMATCH[1]}"
    else
        REPO_URL="${origin}"
    fi

    if [[ "${REPO_URL}" =~ ^https://github\.com/.+ ]] && [[ ! "${REPO_URL}" =~ \.git$ ]]; then
        REPO_URL="${REPO_URL}.git"
    fi
fi

if [ -z "${COMMIT_HASH}" ]; then
    if ! COMMIT_HASH=$(git rev-parse HEAD 2>/dev/null); then
        echo "error: --commit-hash not provided and HEAD could not be resolved" >&2
        exit 1
    fi
fi

# Inject `--package <DEFAULT_PACKAGE_NAME>` into the passthrough args when the
# caller did not already supply one. solana-verify needs the package because
# multiple workspaces in this repo emit similar library filenames.
if [ ${#PASSTHROUGH[@]} -eq 0 ]; then
    PASSTHROUGH=(--package "${DEFAULT_PACKAGE_NAME}")
else
    has_package=false
    for arg in "${PASSTHROUGH[@]}"; do
        case "${arg}" in
            --package|--package=*)
                has_package=true
                break
                ;;
        esac
    done

    if [ "${has_package}" = false ]; then
        PASSTHROUGH=(--package "${DEFAULT_PACKAGE_NAME}" "${PASSTHROUGH[@]}")
    fi
fi

CMD=(solana-verify verify-from-repo)
if [ -n "${RPC_URL}" ]; then
    CMD+=(--url "${RPC_URL}")
fi
if [ -n "${KEYPAIR}" ]; then
    CMD+=(--keypair "${KEYPAIR}")
fi
if [ -n "${WORKSPACE_PATH}" ]; then
    CMD+=(--workspace-path "${WORKSPACE_PATH}")
fi
CMD+=(
    --program-id "${PROGRAM_ID}"
    --library-name "${LIBRARY_NAME}"
    --mount-path "${MOUNT_PATH}"
    --commit-hash "${COMMIT_HASH}"
    ${SKIP_PROMPT[@]+"${SKIP_PROMPT[@]}"}
    "${REPO_URL}"
)

CMD+=(-- "${PASSTHROUGH[@]}")

echo "+ ${CMD[*]}"
exec "${CMD[@]}"
