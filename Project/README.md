# Linux Process Creation, Execution and Termination System

**Course**: Operating Systems and Systems Programming (25CS2104E)  
**Academic Term**: 2026–27, Term-I  
**Institution**: Koneru Lakshmaiah Education Foundation (KLH)  
**Section**: 4 | **Team No**: 17  
**Faculty Guide**: Soumya Enukonda  

---

## 📦 System Modules & Responsibilities

| Module | Core POSIX System Calls | Technical Objectives & Functionality |
| :--- | :--- | :--- |
| **Module 1: Process Creation & Execution** | `fork()`, `execvp()`, `execlp()` | Process creation, parent-child branching semantics, Copy-On-Write address space replacement. |
| **Module 2: Process Synchronization & Termination** | `wait()`, `waitpid()`, `exit()` | Parent-child synchronization, non-blocking polling (`WNOHANG`), and exit status decoding (`WIFEXITED`, `WEXITSTATUS`, `WIFSIGNALED`, `WTERMSIG`). |
| **Module 3: Identification & Anomaly Simulation** | `getpid()`, `getppid()`, `/proc` | Process identification, `/proc/<pid>/status` observation, Zombie process simulation & reaping, and Orphan process adoption. |

---

## 🚀 Key Features

1. **Dual Architecture (Zero Python)**:
   - **Real POSIX C Core**: 100% C implementation compiled with GCC on Linux/WSL.
   - **Node.js Web Backend**: Uses only built-in Node standard modules (`node:http`, `node:child_process`, `node:fs`). **Strictly zero Python and zero external npm dependencies required**.
   - **Interactive Web UI**: Modern responsive dashboard with live terminal, real-time SVG process tree, PCB memory inspector, and printable lab evaluation report.

2. **Scenarios Demonstrated**:
   - ⚡ **Scenario 1: Complete Life Cycle** (`fork()` ➔ `execvp()` ➔ `waitpid()` ➔ `exit()`).
   - 🧟 **Scenario 2: Zombie Process** (Child calls `exit(42)`, parent sleeps without calling `wait()`, state changes to `Z (defunct)` in `/proc`, parent reaps).
   - 👶 **Scenario 3: Orphan Process** (Parent exits immediately, child continues running and gets adopted by `init`/`systemd` with PPID 1).
   - ⏱️ **Scenario 4: Non-Blocking Polling** (`waitpid(..., WNOHANG)` concurrent background work loop).
   - 🛑 **Scenario 5: Abnormal Termination** (`SIGKILL` 9, `WIFSIGNALED`, `WTERMSIG`).
   - 💻 **Scenario 6: Custom Command Execution** (Run any Linux command like `ls -la`, `whoami`, `ps aux`, `uptime`).

---

## 🛠️ Project Structure

```
Project/
├── c_src/
│   ├── process_lifecycle.h      # Common header and function definitions
│   ├── module_creation.c        # T. B. S Sunil (fork & exec)
│   ├── module_sync.c            # V. Prem Kumar (wait/waitpid & termination)
│   ├── module_monitor.c         # G. B. Vedaditya (PID/PPID, /proc, Zombie & Orphan)
│   ├── main.c                   # CLI driver and JSON streamer
│   └── Makefile                 # GCC compiler rules
├── public/
│   ├── index.html               # Main single-page interactive application
│   ├── styles.css               # Modern styling and print formatting
│   ├── diagrams.js              # SVG Process Tree & step-by-step visualizer
│   └── app.js                   # Client controller and API bridge
├── server.js                    # Node.js server (Strictly Zero Python)
├── start_server.bat             # 1-click Windows launcher
├── start_server.sh              # 1-click Linux/WSL launcher
├── bin/
│   └── process_system           # Compiled POSIX C binary
└── README.md
```

---

## ⚡ How to Run

### Method 1: 1-Click Launch (Windows)
Double-click `start_server.bat`. It will automatically launch the Node.js server and open `http://localhost:8000` in your web browser.

### Method 2: Command Line (Windows or Linux/WSL)
```bash
node server.js
```
Then navigate to `http://localhost:8000` in your browser.

### Method 3: Direct CLI C Binary (Linux / WSL)
You can also run the compiled C programs directly in the terminal:
```bash
# Standard Lifecycle
./bin/process_system normal ls -la

# Zombie Process Simulation
./bin/process_system zombie

# Orphan Process Simulation
./bin/process_system orphan

# Non-Blocking Polling
./bin/process_system nonblocking

# Custom Command
./bin/process_system custom whoami
```

---

## 📋 Evaluation Lab Report
To generate a print-ready lab submission report:
1. Run any scenario on the web dashboard.
2. Click the **Lab Report** button in the top navigation bar.
3. Click **Print / Save as PDF** to produce the formatted KLH submission document with team details, experiment audit log, and signature lines.
