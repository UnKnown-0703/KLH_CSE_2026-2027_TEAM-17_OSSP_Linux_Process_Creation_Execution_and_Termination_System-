# Multi-Process Command Pipeline System
### Operating Systems & Systems Programming (OSSP) — Team 17 Hackathon Project

> **A high-performance concurrent Linux command execution and Inter-Process Communication (IPC) pipeline engine built in C, powered by a zero-dependency Node.js backend and an interactive cyber-industrial web dashboard.**

---

## 🌟 Key Highlights

- **Pure C Core Engine (`c_src/`)**: Real POSIX multi-process pipeline execution using `pipe()`, `fork()`, `dup2()`, `execvp()`, `close()`, and `waitpid()`.
- **True Concurrency**: All pipeline stages are spawned simultaneously and execute in parallel across CPU cores streaming data through 64 KB kernel ring buffers.
- **File Descriptor (FD) Table Matrix**: Live visualization of descriptor table manipulation (`FD 0`, `FD 1`, `FD 2`) before and after `dup2()`, highlighting closed descriptors to teach deadlock prevention.
- **Interactive 7-Phase OS Simulator**: Step-by-step animated walkthrough of pipeline mechanics (Pipe creation, Forking, Redirection, Hygiene, Exec, Ring Buffer Streaming, Reaping).
- **Dual Execution Terminal**: Live standard output (STDOUT) capture paired with a per-process standard error (STDERR) and telemetry diagnostic log.
- **Zero-Dependency Web Server**: Built with pure native Node.js (`http`, `fs`, `path`, `child_process`) — no `npm install` needed!
- **WSL2 Ubuntu Integration**: Seamless execution inside Ubuntu 24.04 on WSL2 with native Linux 6.18 kernel system calls.

---

## 🏗️ Architectural Overview

```
                      +------------------------------------------+
                      |         Web Browser Frontend             |
                      |   (Workbench, Visualizer, FD Matrix,     |
                      |    Simulator, C Code Explorer, Docs)     |
                      +--------------------+---------------------+
                                           | HTTP REST / JSON
                                           v
                      +------------------------------------------+
                      |       Pure Node.js Web Server            |
                      |   (Zero NPM Packages, Port 5000)         |
                      |   - Static Asset Streaming               |
                      |   - API Dispatcher & WSL Bridge          |
                      +--------------------+---------------------+
                                           | WSL Exec Bridge
                                           v
                      +------------------------------------------+
                      |        Linux WSL2 Kernel Space           |
                      |   - POSIX anonymous unidirectional pipes |
                      |   - 64 KB Kernel circular ring buffers   |
                      +--------------------+---------------------+
                                           |
    +--------------------------------------+--------------------------------------+
    |                                      |                                      |
    v                                      v                                      v
+------------------------+      +------------------------+      +------------------------+
| Process 0 (Stage 1)    |      | Process 1 (Stage 2)    |      | Process 2 (Stage 3)    |
| e.g. cat access_log    |      | e.g. grep 404          |      | e.g. wc -l             |
| STDIN: Default (0)     | ===> | STDIN: Pipe 0 Read (3) | ===> | STDIN: Pipe 1 Read (5) |
| STDOUT: Pipe 0 W (4->1)|      | STDOUT: Pipe 1 W (6->1)|      | STDOUT: Capture (➔ 1)  |
+------------------------+      +------------------------+      +------------------------+
```

---

## 📁 Repository Structure

```
Hackathon/
├── bin/
│   └── pipeline_engine            # Compiled POSIX C binary
├── c_src/
│   ├── pipeline_types.h           # Data structures for stages, pipes, and telemetry
│   ├── pipeline_parser.h          # Header for command string splitting and quote handling
│   ├── pipeline_parser.c          # Tokenization implementation respecting quotes & escapes
│   ├── pipeline_monitor.h         # Telemetry metrics and JSON serialization header
│   ├── pipeline_monitor.c         # Clock timing, getrusage, and JSON serialization
│   ├── pipeline_engine.c          # Core engine: fork, pipe, dup2, execvp, close, waitpid
│   ├── Makefile                   # GCC compilation configuration
│   └── test_pipelines.sh          # Bash automated verification test suite
├── data/
│   ├── access_log.txt             # Realistic HTTP server logs for log analysis pipelines
│   ├── words.txt                  # Systems programming text for word count benchmarks
│   └── employees.csv              # Structured CSV for tabular cut/sort/head filtering
├── public/
│   ├── index.html                 # Complete responsive dashboard UI
│   ├── css/
│   │   └── styles.css             # Modern cyber-industrial styling & animations
│   └── js/
│       ├── visualizer.js          # Animated horizontal process DAG & pipe stream
│       ├── fd_matrix.js           # File descriptor table matrix inspector
│       ├── simulator.js           # 7-phase interactive OS pipeline lifecycle simulator
│       ├── code_viewer.js         # Annotated C source code viewer with syscall jumps
│       └── app.js                 # Primary application controller and API client
├── server.js                      # Pure Node.js HTTP server (zero external dependencies)
├── start_server.bat               # One-click Windows launcher (starts server & opens browser)
├── start_server.sh                # One-click Linux/WSL launcher
└── README.md                      # Comprehensive documentation and OS theory guide
```

---

## 🚀 How to Run

### Option 1: One-Click Windows Launch (Recommended)
Simply double-click:
```cmd
start_server.bat
```
This automatically verifies the C binary, starts the Node.js server, and opens your default browser at `http://localhost:5000`.

### Option 2: Linux / WSL Launch
```bash
chmod +x start_server.sh
./start_server.sh
```

### Option 3: Manual Startup
```bash
# Compile C Engine in WSL:
wsl gcc -Wall -Wextra -O2 -g -D_GNU_SOURCE c_src/pipeline_engine.c c_src/pipeline_parser.c c_src/pipeline_monitor.c -o bin/pipeline_engine

# Start Node.js Web Server:
node server.js
```
Then visit **`http://localhost:5000`** in your browser.

### Option 4: Direct C Command Line Execution
The C binary can be run directly from terminal or WSL:
```bash
# Human-readable formatted terminal table
./bin/pipeline_engine "cat data/access_log.txt | grep 404 | wc -l"

# With detailed OS system call explanation
./bin/pipeline_engine --explain "cat data/words.txt | grep kernel | wc -l"

# Output structured JSON telemetry
./bin/pipeline_engine --json "cat data/employees.csv | grep Engineering | cut -d, -f2,4,5 | sort -t, -k3 -n -r"

# Custom in-memory STDIN injection
./bin/pipeline_engine --input "delta\nbeta\nalpha\ngamma" "sort | head -n 2"
```

---

## 🧪 Automated Test Suite

Run the full verification suite in WSL/Linux:
```bash
wsl bash c_src/test_pipelines.sh
```
This tests:
1. Two-stage pipelines (`cat | grep`)
2. Three-stage pipelines (`cat | grep | wc -l`)
3. Four-stage complex aggregation (`cat | awk | sort | uniq -c`)
4. In-memory STDIN injection without disk files
5. Structured JSON serialization for web integration

---

## 🔬 Core Operating System Concepts & Viva Guide

### 1. The `pipe()` System Call
- **Syntax**: `int pipe(int pipefd[2]);`
- Creates an anonymous unidirectional byte stream in kernel memory.
- `pipefd[0]` is opened for **reading**; `pipefd[1]` is opened for **writing**.
- Data written to `pipefd[1]` is buffered by the kernel until read from `pipefd[0]`.
- On modern Linux, capacity is **64 KB** (`65,536 bytes`).

### 2. File Descriptor Duplication (`dup2()`)
- **Syntax**: `int dup2(int oldfd, int newfd);`
- In child process $i$:
  - Downstream input: `dup2(pipes[i-1][0], STDIN_FILENO);`
  - Upstream output: `dup2(pipes[i][1], STDOUT_FILENO);`
- Overwrites standard descriptors atomically, surviving `execvp()`.

### 3. File Descriptor Hygiene (Why closing unused ends is vital)
- **The Golden Rule of Unix Pipes**: Every process (parent and all children) **must** close all pipe ends they do not use.
- **Deadlock Scenario**: A reading process blocks on `read()` when the buffer is empty. It only receives EOF (return value 0) when **all** open write descriptors referencing the pipe are closed. If the parent or upstream child forgets to close its write descriptor, downstream readers hang forever in a deadlock.

### 4. True Concurrency vs Sequential Execution
- All $N$ child processes are forked simultaneously before the parent enters `waitpid()`.
- Data streams concurrently across CPU cores via kernel wait queues. If producer fills the 64 KB buffer, the kernel blocks the writer until the consumer drains bytes, providing automatic lock-free backpressure.

### 5. Process Harvesting (`waitpid()`)
- Suspends parent until child terminates: `waitpid(pid, &status, 0);`
- Extracts exit code using `WIFEXITED(status)` and `WEXITSTATUS(status)`.
- Eliminates zombie processes (`<defunct>`) and cleans process table entries.

---

## 👥 Team 17
- **Course**: Operating Systems and Systems Programming (OSSP)
- **Institution**: KL University
- **Academic Year**: Y2 -- S1
