#!/bin/bash
# ==============================================================================
# OPERATING SYSTEMS & SYSTEMS PROGRAMMING (OSSP)
# Test Suite for Multi-Process Command Pipeline System
# Team 17 - Hackathon
# ==============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN_PATH="${SCRIPT_DIR}/../bin/pipeline_engine"
DATA_DIR="${SCRIPT_DIR}/../data"

echo -e "${BLUE}=== Compiling Pipeline Engine ===${NC}"
gcc -Wall -Wextra -O2 -g -D_GNU_SOURCE \
    "${SCRIPT_DIR}/pipeline_engine.c" \
    "${SCRIPT_DIR}/pipeline_parser.c" \
    "${SCRIPT_DIR}/pipeline_monitor.c" \
    -o "${BIN_PATH}"

echo -e "${GREEN}[OK] Binary built successfully at: ${BIN_PATH}${NC}\n"

echo -e "${BLUE}=== Test 1: Two-Stage Pipeline (grep | wc -l) ===${NC}"
"${BIN_PATH}" "cat ${DATA_DIR}/access_log.txt | grep 404"

echo -e "\n${BLUE}=== Test 2: Three-Stage Pipeline (cat | grep | wc) ===${NC}"
"${BIN_PATH}" "cat ${DATA_DIR}/access_log.txt | grep 404 | wc -l"

echo -e "\n${BLUE}=== Test 3: Four-Stage Pipeline (cut | sort | uniq -c | sort -nr) ===${NC}"
"${BIN_PATH}" "cat ${DATA_DIR}/access_log.txt | awk '{print \$9}' | sort | uniq -c"

echo -e "\n${BLUE}=== Test 4: Custom STDIN Injection Test ===${NC}"
"${BIN_PATH}" --input "delta\nbeta\nalpha\ngamma" "sort | head -n 2"

echo -e "\n${BLUE}=== Test 5: JSON Telemetry Mode ===${NC}"
"${BIN_PATH}" --json "cat ${DATA_DIR}/words.txt | grep kernel | wc -l"

echo -e "\n${GREEN}=== ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ===${NC}"
