/**
 * ============================================================================
 * OPERATING SYSTEMS AND SYSTEMS PROGRAMMING
 * Module 1: Process Creation & Program Execution
 * ============================================================================
 * Objectives Implemented:
 * 1. Process creation using fork() system call.
 * 2. Demonstrating fork() return value semantics:
 *    - Child process receives 0.
 *    - Parent process receives child's PID (> 0).
 *    - Error returns -1 (handled gracefully).
 * 3. Program execution using the exec() family (execvp).
 * 4. Demonstrating process image replacement (code, data, stack replaced).
 * ============================================================================
 */

#include "process_lifecycle.h"

/**
 * create_child_process()
 * Wraps fork() with thorough error checking and logging.
 */
pid_t create_child_process(int json_mode) {
    pid_t parent_pid = getpid();
    pid_t ppid = getppid();

    emit_event(json_mode, "CREATION", "fork()", parent_pid, ppid, STATE_RUNNING,
               "Parent process initiating fork() system call to duplicate address space.");

    pid_t pid = fork();

    if (pid < 0) {
        /* Fork failed: e.g., EAGAIN (process limit reached) or ENOMEM */
        char err_msg[128];
        snprintf(err_msg, sizeof(err_msg), "fork() failed: %s", strerror(errno));
        emit_event(json_mode, "ERROR", "fork()", parent_pid, ppid, STATE_TERMINATED, err_msg);
        return -1;
    }

    if (pid == 0) {
        /* In Child Process */
        pid_t child_pid = getpid();
        pid_t child_ppid = getppid();
        emit_event(json_mode, "CREATION", "fork() -> 0", child_pid, child_ppid, STATE_READY,
                   "Inside child process! fork() returned 0. Child PCB initialized.");
    } else {
        /* In Parent Process */
        char msg[128];
        snprintf(msg, sizeof(msg), "Parent received child PID %d from fork(). Address space duplicated.", pid);
        emit_event(json_mode, "CREATION", "fork() -> child_pid", parent_pid, ppid, STATE_RUNNING, msg);
    }

    return pid;
}

/**
 * execute_program()
 * Uses execvp() to replace the calling process image with the target executable.
 */
int execute_program(const char *file, char *const argv[], int json_mode) {
    pid_t pid = getpid();
    pid_t ppid = getppid();

    char msg[256];
    snprintf(msg, sizeof(msg), "Replacing process image with '%s' via execvp(). Text/Data/Stack replaced.", file);
    emit_event(json_mode, "EXECUTION", "execvp()", pid, ppid, STATE_RUNNING, msg);

    /* Flush output buffers before exec replaces memory */
    fflush(stdout);
    fflush(stderr);

    /*
     * execvp() searches PATH for 'file'.
     * If successful, this function NEVER returns because the process image is replaced!
     */
    execvp(file, argv);

    /* If code reaches here, execvp failed */
    snprintf(msg, sizeof(msg), "execvp() execution failed: %s (errno=%d)", strerror(errno), errno);
    emit_event(json_mode, "ERROR", "execvp()", pid, ppid, STATE_TERMINATED, msg);

    /* Child should exit with failure status if exec fails */
    exit(127);
}

/**
 * run_standard_lifecycle()
 * Full integration of fork() -> exec() -> wait() -> exit()
 */
int run_standard_lifecycle(const char *command, char *const argv[], int json_mode) {
    pid_t parent_pid = getpid();
    pid_t parent_ppid = getppid();

    emit_event(json_mode, "INIT", "getpid()", parent_pid, parent_ppid, STATE_RUNNING,
               "Starting Standard Process Lifecycle Demonstration.");

    pid_t child_pid = create_child_process(json_mode);

    if (child_pid < 0) {
        return -1;
    }

    if (child_pid == 0) {
        /* Child branch */
        print_identification("Child Process", json_mode);
        execute_program(command, argv, json_mode);
        /* Never reaches here unless exec failed */
        return -1;
    } else {
        /* Parent branch: synchronize with child */
        int status = 0;
        wait_for_child(child_pid, &status, json_mode);
        decode_exit_status(child_pid, status, json_mode);
        emit_event(json_mode, "CLEANUP", "exit()", parent_pid, parent_ppid, STATE_TERMINATED,
                   "Child reaped and PCB cleaned from kernel table. Lifecycle complete.");
        return 0;
    }
}
