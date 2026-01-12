#!/bin/bash
# Common functions for deployment scripts

# Logging functions
log_error() { echo "❌ ERROR: $*" >&2; }
log_warn() { echo "⚠️  WARNING: $*" >&2; }
log_info() { echo "ℹ️  INFO: $*"; }
log_success() { echo "✓ $*"; }

# Require root user
require_root() {
    if [ "$(id -u)" -ne 0 ]; then
        log_error "This script must be run as root"
        exit 1
    fi
}

# Validate required environment variables
require_env_vars() {
    local missing=0
    for var in "$@"; do
        if [ -z "${!var:-}" ]; then
            log_error "Required variable $var is not set"
            missing=1
        fi
    done
    if [ $missing -eq 1 ]; then
        exit 1
    fi
}

# Validate Ethereum address format
validate_eth_address() {
    local addr="$1"
    local name="$2"
    if [[ ! "$addr" =~ ^0x[0-9a-fA-F]{40}$ ]]; then
        log_error "Invalid Ethereum address for $name: $addr"
        return 1
    fi
    return 0
}

# Safe source for environment files
safe_source_env() {
    local env_file="$1"
    if [ ! -f "$env_file" ]; then
        log_error "Environment file not found: $env_file"
        return 1
    fi
    set -a
    source "$env_file"
    set +a
}
