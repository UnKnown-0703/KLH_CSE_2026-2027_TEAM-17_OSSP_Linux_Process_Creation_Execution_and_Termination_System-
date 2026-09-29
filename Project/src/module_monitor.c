/**
 * ============================================================================
 * OPERATING SYSTEMS AND SYSTEMS PROGRAMMING
 * Module 3: Process Identification, State Observation, Zombie & Orphan Demos
 * ============================================================================
 * Objectives Implemented:
 * 1. Process Identification via getpid() and getppid() system calls.
 * 2. Observing real-time process states in Linux kernel via /proc/<pid>/status.
 * 3. Demonstrating ZOMBIE process:
 *    - Child exits before parent calls wait().
 *    - Child PCB entry persists in kernel process table in 'Z' (defunct) state.
 *    - Parent later calls waitpid() to reap zombie and clean the process table.
 * 4. Demonstrating ORPHAN process:
 *    - Parent terminates while child is still executing.
 *    - Child is adopted by system init / systemd (PPID becomes 1 or subreaper).
 * 5. Demonstrating Signal Termination (SIGKILL / SIGTERM).
 * ============================================================================
 */

#include "process_lifecycle.h"

/**
 * print_identification()
 * Outputs the current Process ID (PID) and Parent Process ID (PPID).
 */
void print_identification(const char *role, int json_mode) {
    pid_t pid = getpid();
    pid_t ppid = getppid();

    char msg[160];
    snprintf(msg, sizeof(msg), "[%s] Process ID (PID): %d | Parent Process ID (PPID): %d", role, pid, ppid);
    emit_event(json_mode, "IDENTIFICATION", "getpid()/getppid()", pid, ppid, STATE_RUNNING, msg);
}

/**
 * get_proc_state()
 * Reads the 'State:' line from Linux kernel /proc/<pid>/status
 */
int get_proc_state(pid_t pid, char *state_buf, size_t max_len) {
    char proc_path[64];
    snprintf(proc_path, sizeof(proc_path), "/proc/%d/status", pid);

    FILE *fp = fopen(proc_path, "r");
    if (!fp) {
        strncpy(state_buf, "TERMINATED (cleaned from /proc)", max_len);
        return -1;
    }

    char line[256];
    state_buf[0] = '\0';
    while (fgets(line, sizeof(line), fp)) {
        if (strncmp(line, "State:", 6) == 0) {
            char *val = line + 6;
            while (*val == ' ' || *val == '\t') val++;
            /* Remove newline */
            char *nl = strchr(val, '\n');
            if (nl) *nl = '\0';
            strncpy(state_buf, val, max_len - 1);
            state_buf[max_len - 1] = '\0';
            break;
        }
    }
    fclose(fp);
    return 0;
}

/**
 * run_zombie_simulation()
 * Demonstrates creation of a zombie process and subsequent reaping.
 */
int run_zombie_simulation(int json_mode) {
    pid_t parent_pid = getpid();
    pid_t parent_ppid = getppid();

    emit_event(json_mode, "ZOMBIE_DEMO", "start", parent_pid, parent_ppid, STATE_RUNNING,
               "--- STARTING ZOMBIE PROCESS SIMULATION ---");

    pid_t child_pid = fork();

    if (child_pid < 0) {
        emit_event(json_mode, "ERROR", "fork()", parent_pid, parent_ppid, STATE_RUNNING, "fork() failed for zombie test");
        return -1;
    }

    if (child_pid == 0) {
        /* Child process: Terminates immediately */
        pid_t my_pid = getpid();
        pid_t my_ppid = getppid();
        emit_event(json_mode, "ZOMBIE_DEMO", "child_exit", my_pid, my_ppid, STATE_READY,
                   "Child process created. Now calling exit(42) immediately while parent is sleeping without wait().");
        exit(42);
    }

    /* Parent process: Deliberately DOES NOT call wait() right away */
    char msg[256];
    snprintf(msg, sizeof(msg),
             "Parent (PID %d) created child (PID %d). Child has exited, but parent will SLEEP for 3 seconds WITHOUT calling wait().",
             parent_pid, child_pid);
    emit_event(json_mode, "ZOMBIE_DEMO", "parent_sleep", parent_pid, parent_ppid, STATE_SLEEPING, msg);

    /* Sleep 1 second to allow child to exit */
    sleep(1);

    /* Inspect child state in kernel /proc */
    char state_str[128] = "Unknown";
    get_proc_state(child_pid, state_str, sizeof(state_str));

    snprintf(msg, sizeof(msg),
             "OBSERVED ZOMBIE STATE: Kernel /proc/%d/status reports State: [%s]. Child is now a ZOMBIE (defunct)!",
             child_pid, state_str);
    emit_event(json_mode, "ZOMBIE_DEMO", "/proc status", child_pid, parent_pid, STATE_ZOMBIE, msg);

    /* Sleep another 2 seconds */
    sleep(2);

    /* Now parent calls waitpid() to reap the zombie */
    emit_event(json_mode, "ZOMBIE_DEMO", "reaping", parent_pid, parent_ppid, STATE_RUNNING,
               "Parent waking up! Calling waitpid() to harvest child's exit status and reap zombie.");

    int status = 0;
    waitpid(child_pid, &status, 0);
    decode_exit_status(child_pid, status, json_mode);

    /* Check /proc again - should be gone */
    get_proc_state(child_pid, state_str, sizeof(state_str));
    snprintf(msg, sizeof(msg),
             "POST-REAP VERIFICATION: Kernel /proc/%d/status reports: [%s]. PCB entry removed from process table!",
             child_pid, state_str);
    emit_event(json_mode, "ZOMBIE_DEMO", "cleaned", child_pid, parent_pid, STATE_TERMINATED, msg);

    return 0;
}

/**
 * run_orphan_simulation()
 * Demonstrates child process becoming orphan and adopted by init/systemd.
 */
int run_orphan_simulation(int json_mode) {
    pid_t parent_pid = getpid();
    pid_t parent_ppid = getppid();

    emit_event(json_mode, "ORPHAN_DEMO", "start", parent_pid, parent_ppid, STATE_RUNNING,
               "--- STARTING ORPHAN PROCESS SIMULATION ---");

    pid_t child_pid = fork();

    if (child_pid < 0) {
        emit_event(json_mode, "ERROR", "fork()", parent_pid, parent_ppid, STATE_RUNNING, "fork() failed for orphan test");
        return -1;
    }

    if (child_pid > 0) {
        /* Parent process: Terminates IMMEDIATELY without waiting */
        char msg[256];
        snprintf(msg, sizeof(msg),
                 "Parent (PID %d) created child (PID %d). Parent now EXITS immediately, leaving child running!",
                 parent_pid, child_pid);
        emit_event(json_mode, "ORPHAN_DEMO", "parent_early_exit", parent_pid, parent_ppid, STATE_TERMINATED, msg);
        exit(0);
    }

    /* Child process */
    pid_t my_pid = getpid();
    pid_t initial_ppid = getppid();

    char msg[256];
    snprintf(msg, sizeof(msg),
             "Child PID %d started. Initial Parent PID: %d. Child will sleep 2 seconds while parent exits.",
             my_pid, initial_ppid);
    emit_event(json_mode, "ORPHAN_DEMO", "child_running", my_pid, initial_ppid, STATE_RUNNING, msg);

    /* Sleep to allow parent to terminate */
    sleep(2);

    /* Child wakes up and checks new parent */
    pid_t new_ppid = getppid();
    snprintf(msg, sizeof(msg),
             "ORPHAN DETECTED! Original PPID %d is dead. Child PID %d has been adopted by Init/Systemd/Subreaper! New PPID = %d.",
             initial_ppid, my_pid, new_ppid);
    emit_event(json_mode, "ORPHAN_DEMO", "reparented", my_pid, new_ppid, STATE_ORPHAN, msg);

    emit_event(json_mode, "ORPHAN_DEMO", "child_clean_exit", my_pid, new_ppid, STATE_TERMINATED,
               "Orphan child completing execution and exiting cleanly.");
    exit(0);
}

/**
 * run_signal_simulation()
 * Demonstrates abnormal process termination via signals (SIGKILL or SIGSEGV)
 */
int run_signal_simulation(int sig_num, int json_mode) {
    pid_t parent_pid = getpid();
    pid_t parent_ppid = getppid();

    emit_event(json_mode, "SIGNAL_DEMO", "start", parent_pid, parent_ppid, STATE_RUNNING,
               "--- STARTING ABNORMAL TERMINATION (SIGNAL) DEMONSTRATION ---");

    pid_t child_pid = fork();

    if (child_pid < 0) {
        emit_event(json_mode, "ERROR", "fork()", parent_pid, parent_ppid, STATE_RUNNING, "fork() failed");
        return -1;
    }

    if (child_pid == 0) {
        /* Child process: loops waiting for signal */
        pid_t my_pid = getpid();
        emit_event(json_mode, "SIGNAL_DEMO", "child_wait_signal", my_pid, getppid(), STATE_RUNNING,
                   "Child process running continuous loop, awaiting external signal...");
        while (1) {
            sleep(1);
        }
        exit(0);
    }

    /* Parent sleeps briefly, then sends signal to kill child */
    sleep(1);

    char msg[256];
    snprintf(msg, sizeof(msg), "Parent sending Signal %d (%s) to Child PID %d via kill() system call.",
             sig_num, strsignal(sig_num), child_pid);
    emit_event(json_mode, "SIGNAL_DEMO", "kill()", parent_pid, parent_ppid, STATE_RUNNING, msg);

    kill(child_pid, sig_num);

    int status = 0;
    waitpid(child_pid, &status, 0);
    decode_exit_status(child_pid, status, json_mode);

    return 0;
}
