#!/bin/bash
# ==============================================================================
# OPERATING SYSTEMS & SYSTEMS PROGRAMMING (OSSP) - TEAM 17
# Multi-Process Command Pipeline System
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

echo "=============================================================================="
echo " OPERATING SYSTEMS & SYSTEMS PROGRAMMING (OSSP) - TEAM 17"
echo " Multi-Process Command Pipeline System"
echo "=============================================================================="

mkdir -p bin

if [ ! -f "bin/pipeline_engine" ]; then
    echo "[1/2] Compiling C Pipeline Engine with GCC..."
    gcc -Wall -Wextra -O2 -g -D_GNU_SOURCE \
        c_src/pipeline_engine.c \
        c_src/pipeline_parser.c \
        c_src/pipeline_monitor.c \
        -o bin/pipeline_engine
    echo "[OK] Compilation completed."
else
    echo "[1/2] C Engine binary verified."
fi

echo "[2/2] Starting Node.js Web Server on http://localhost:5000 ..."
node server.js
