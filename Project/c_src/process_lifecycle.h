#ifndef PROCESS_LIFECYCLE_H
#define PROCESS_LIFECYCLE_H

#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <sys/stat.h>
#include <signal.h>
#include <string.h>
#include <errno.h>
#include <time.h>
#include <fcntl.h>

/* ANSI Terminal Colors */
#define COLOR_RESET   "\033[0m"
#define COLOR_BOLD    "\033[1m"
#define COLOR_RED     "\033[31m"
#define COLOR_GREEN   "\033[32m"
#define COLOR_YELLOW  "\033[33m"
#define COLOR_BLUE    "\033[34m"
#define COLOR_MAGENTA "\033[35m"
#define COLOR_CYAN    "\033[36m"
#define COLOR_WHITE   "\033[37m"

/* Process States */
#define STATE_NEW        "NEW"
#define STATE_READY      "READY"
#define STATE_RUNNING    "RUNNING"
#define STATE_SLEEPING   "SLEEPING"
#define STATE_WAITING    "WAITING"
#define STATE_ZOMBIE     "ZOMBIE (defunct)"
#define STATE_ORPHAN     "ORPHAN"
#define STATE_TERMINATED "TERMINATED"

/* Event Logger Helper */
void emit_event(int json_mode, const char *phase, const char *syscall_name,
                pid_t pid, pid_t ppid, const char *state, const char *msg);

/* =========================================================================
 * MODULE 1: Process Creation & Execution
 * Focus: fork() system call, exec() family (execvp, execlp), memory duplication
 * ========================================================================= */
pid_t create_child_process(int json_mode);
int execute_program(const char *file, char *const argv[], int json_mode);
int run_standard_lifecycle(const char *command, char *const argv[], int json_mode);

/* =========================================================================
 * MODULE 2: Process Synchronization & Termination
 * Focus: wait(), waitpid(), WNOHANG, exit(), _exit(), status macros (WIFEXITED, etc.)
 * ========================================================================= */
int wait_for_child(pid_t child_pid, int *status, int json_mode);
int monitor_child_nonblocking(pid_t child_pid, int max_checks, int interval_ms, int json_mode);
void decode_exit_status(pid_t pid, int status, int json_mode);
void terminate_with_status(int exit_code, int json_mode);

/* =========================================================================
 * MODULE 3: Process Identification, State Observation & Anomaly Simulation
 * Focus: getpid(), getppid(), /proc/<pid>/status parsing, Zombie & Orphan demo
 * ========================================================================= */
void print_identification(const char *role, int json_mode);
int get_proc_state(pid_t pid, char *state_buf, size_t max_len);
int run_zombie_simulation(int json_mode);
int run_orphan_simulation(int json_mode);
int run_signal_simulation(int sig_num, int json_mode);

#endif /* PROCESS_LIFECYCLE_H */
