/**
 * ============================================================================
 * OPERATING SYSTEMS AND SYSTEMS PROGRAMMING
 * Module 2: Process Synchronization & Termination Handling
 * ============================================================================
 * Objectives Implemented:
 * 1. Synchronizing parent and child processes via wait() and waitpid().
 * 2. Non-blocking monitoring of child processes using WNOHANG flag.
 * 3. Inspecting and decoding child termination status using POSIX macros:
 *    - WIFEXITED(status): Returns true if child terminated normally.
 *    - WEXITSTATUS(status): Returns the 8-bit exit code of child.
 *    - WIFSIGNALED(status): Returns true if child was terminated by signal.
 *    - WTERMSIG(status): Returns signal number that caused termination.
 * 4. Controlled termination via exit() and kernel resource cleanup.
 * ============================================================================
 */

#include "process_lifecycle.h"

/**
 * wait_for_child()
 * Blocks parent execution until the specified child process terminates.
 */
int wait_for_child(pid_t child_pid, int *status, int json_mode) {
    pid_t parent_pid = getpid();
    pid_t parent_ppid = getppid();

    char msg[128];
    snprintf(msg, sizeof(msg), "Parent entering blocking waitpid(PID: %d) state to synchronize.", child_pid);
    emit_event(json_mode, "SYNCHRONIZATION", "waitpid()", parent_pid, parent_ppid, STATE_WAITING, msg);

    pid_t reaped_pid = waitpid(child_pid, status, 0);

    if (reaped_pid < 0) {
        snprintf(msg, sizeof(msg), "waitpid() failed: %s", strerror(errno));
        emit_event(json_mode, "ERROR", "waitpid()", parent_pid, parent_ppid, STATE_RUNNING, msg);
        return -1;
    }

    snprintf(msg, sizeof(msg), "Parent reaped terminated child PID %d. Kernel PCB resources unlinked.", reaped_pid);
    emit_event(json_mode, "SYNCHRONIZATION", "waitpid() reaped", parent_pid, parent_ppid, STATE_RUNNING, msg);

    return reaped_pid;
}

/**
 * monitor_child_nonblocking()
 * Demonstrates non-blocking child monitoring using WNOHANG.
 * Allows parent to execute concurrent work while intermittently checking child.
 */
int monitor_child_nonblocking(pid_t child_pid, int max_checks, int interval_ms, int json_mode) {
    pid_t parent_pid = getpid();
    pid_t parent_ppid = getppid();
    int status = 0;
    int check_count = 0;

    emit_event(json_mode, "MONITORING", "waitpid(WNOHANG)", parent_pid, parent_ppid, STATE_RUNNING,
               "Initiating non-blocking process polling loop using WNOHANG.");

    while (check_count < max_checks) {
        check_count++;

        pid_t result = waitpid(child_pid, &status, WNOHANG);

        if (result == 0) {
            /* Child is still running; parent is free to do other work */
            char msg[160];
            snprintf(msg, sizeof(msg),
                     "[Poll #%d] Child PID %d still executing. Parent doing background computation...",
                     check_count, child_pid);
            emit_event(json_mode, "MONITORING", "waitpid(WNOHANG) -> 0", parent_pid, parent_ppid, STATE_RUNNING, msg);
            
            /* Sleep for specified interval (in microseconds) */
            usleep(interval_ms * 1000);
        } else if (result == child_pid) {
            /* Child has terminated */
            char msg[160];
            snprintf(msg, sizeof(msg),
                     "Child PID %d finished! Caught via non-blocking poll on check #%d.",
                     child_pid, check_count);
            emit_event(json_mode, "MONITORING", "waitpid(WNOHANG) -> child_pid", parent_pid, parent_ppid, STATE_RUNNING, msg);
            decode_exit_status(child_pid, status, json_mode);
            return 0;
        } else {
            /* Error occurred */
            char msg[128];
            snprintf(msg, sizeof(msg), "waitpid(WNOHANG) error: %s", strerror(errno));
            emit_event(json_mode, "ERROR", "waitpid(WNOHANG)", parent_pid, parent_ppid, STATE_RUNNING, msg);
            return -1;
        }
    }

    /* If timeout occurred, do a final blocking wait */
    emit_event(json_mode, "MONITORING", "waitpid() blocking fallback", parent_pid, parent_ppid, STATE_WAITING,
               "Max non-blocking checks reached. Falling back to blocking wait.");
    wait_for_child(child_pid, &status, json_mode);
    decode_exit_status(child_pid, status, json_mode);
    return 0;
}

/**
 * decode_exit_status()
 * Analyzes the status integer returned by wait() or waitpid()
 * using standard POSIX inspection macros.
 */
void decode_exit_status(pid_t pid, int status, int json_mode) {
    char details[256];

    if (WIFEXITED(status)) {
        int exit_code = WEXITSTATUS(status);
        snprintf(details, sizeof(details),
                 "Child (PID %d) terminated normally via exit() with exit code %d (0x%02X).",
                 pid, exit_code, exit_code);
        emit_event(json_mode, "TERMINATION", "WIFEXITED", pid, getpid(), STATE_TERMINATED, details);
    } else if (WIFSIGNALED(status)) {
        int term_sig = WTERMSIG(status);
        snprintf(details, sizeof(details),
                 "Child (PID %d) terminated abnormally by Signal %d (%s). Core dump: %s.",
                 pid, term_sig, strsignal(term_sig),
                 WCOREDUMP(status) ? "YES" : "NO");
        emit_event(json_mode, "TERMINATION", "WIFSIGNALED", pid, getpid(), STATE_TERMINATED, details);
    } else if (WIFSTOPPED(status)) {
        int stop_sig = WSTOPSIG(status);
        snprintf(details, sizeof(details),
                 "Child (PID %d) stopped by Signal %d (%s).",
                 pid, stop_sig, strsignal(stop_sig));
        emit_event(json_mode, "TERMINATION", "WIFSTOPPED", pid, getpid(), STATE_WAITING, details);
    } else {
        snprintf(details, sizeof(details),
                 "Child (PID %d) terminated with unknown raw status 0x%04X.", pid, status);
        emit_event(json_mode, "TERMINATION", "UNKNOWN_STATUS", pid, getpid(), STATE_TERMINATED, details);
    }
}

/**
 * terminate_with_status()
 * Invokes exit() to flush I/O streams, call atexit handlers, and notify parent.
 */
void terminate_with_status(int exit_code, int json_mode) {
    pid_t pid = getpid();
    pid_t ppid = getppid();

    char msg[128];
    snprintf(msg, sizeof(msg), "Process PID %d calling exit(%d). Cleaning file descriptors and buffers.",
             pid, exit_code);
    emit_event(json_mode, "TERMINATION", "exit()", pid, ppid, STATE_TERMINATED, msg);

    exit(exit_code);
}
