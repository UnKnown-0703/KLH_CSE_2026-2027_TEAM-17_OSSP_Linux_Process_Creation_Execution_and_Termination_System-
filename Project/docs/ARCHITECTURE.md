# System Architecture & Technical Specifications

**Course**: Operating Systems and Systems Programming (25CS2104E)  
**Project**: Linux Process Creation, Execution and Termination System  
**Section**: 4 | **Team**: 17  

---

## 1. High-Level Architecture Overview

The system models the complete POSIX process lifecycle through a modular architecture implemented in pure C on Linux, coupled with an interactive web visualization dashboard running via Node.js:

```
[ User Input / CLI / Web UI ]
               │
               ▼
       [ main.c Driver ]
               │
   ┌───────────┼───────────┐
   ▼           ▼           ▼
[Module 1]  [Module 2]  [Module 3]
Creation &    Sync &      State &
Execution   Termination  Monitoring
(fork/exec) (wait/exit)  (/proc/Z&O)
   │           │           │
   └───────────┼───────────┘
               ▼
     [ Linux Kernel / POSIX ]
  - task_struct Management
  - Address Space Replacement
  - Process Table (/proc)
```

---

## 2. Process Lifecycle State Transitions

The system demonstrates the classic 5+ state process model in Linux:

```
             ┌──────────────┐
             │     NEW      │
             └──────┬───────┘
                    │ fork()
                    ▼
             ┌──────────────┐   Scheduler    ┌──────────────┐
             │    READY     │ ─────────────> │   RUNNING    │
             └──────────────┘ <───────────── └──────┬───────┘
                                Preempted           │
                                                    ├─ waitpid() / sleep()
                                                    ▼
                                             ┌──────────────┐
                                             │   WAITING    │
                                             └──────┬───────┘
                                                    │ Wakes up
                                                    ▼
                                             ┌──────────────┐
                                             │    READY     │
                                             └──────────────┘
                    ┌───────────────────────────────┤
                    │ exit()                        │
                    ▼                               ▼
             ┌──────────────┐  waitpid() reaped ┌──────────────┐
             │ ZOMBIE ('Z') │ ────────────────> │  TERMINATED  │
             └──────────────┘                   └──────────────┘
```

---

## 3. Modular Breakdown

### Module 1: Process Creation & Program Execution (`src/module_creation.c`)
- **System Calls**: `fork()`, `execvp()`
- **Responsibilities**:
  - Clones parent process image using `fork()`.
  - Implements Copy-On-Write (COW) branching:
    - Child (`pid == 0`): Executes target program via `execvp()`.
    - Parent (`pid > 0`): Captures child PID and synchronizes.
  - Replaces virtual address space (Text, Data, BSS, Heap, Stack).

### Module 2: Process Synchronization & Termination (`src/module_sync.c`)
- **System Calls**: `wait()`, `waitpid()`, `exit()`, `_exit()`
- **Responsibilities**:
  - Blocking parent synchronization via `waitpid(child_pid, &status, 0)`.
  - Non-blocking asynchronous polling via `waitpid(child_pid, &status, WNOHANG)`.
  - Status decoding macros:
    - `WIFEXITED(status)` & `WEXITSTATUS(status)`
    - `WIFSIGNALED(status)` & `WTERMSIG(status)`
    - `WIFSTOPPED(status)` & `WSTOPSIG(status)`
  - Controlled clean termination via `exit()`.

### Module 3: Process Identification & Monitoring (`src/module_monitor.c`)
- **System Calls**: `getpid()`, `getppid()`, `kill()`
- **Kernel Interface**: `/proc/<pid>/status`
- **Responsibilities**:
  - Process identification (`getpid()`, `getppid()`).
  - Parsing real-time state flags (`R`, `S`, `Z`, `T`) from kernel `/proc`.
  - **Zombie Process Simulation**: Child calls `exit(42)` while parent sleeps; entry remains as `Z (defunct)` in process table until reaped.
  - **Orphan Process Simulation**: Parent terminates immediately; child continues and gets adopted by `init` / `systemd` (PPID 1).
  - **Signal Termination**: Sends `SIGKILL` (9) via `kill()` and detects abnormal termination.
