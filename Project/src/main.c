/**
 * ============================================================================
 * OPERATING SYSTEMS AND SYSTEMS PROGRAMMING
 * Project: Linux Process Creation, Execution and Termination System
 * ============================================================================
 * main.c - Unified Driver and Command-Line Interface
 * ============================================================================
 */

#include "process_lifecycle.h"

/**
 * emit_event()
 * Central logging routine supporting both rich ANSI terminal styling
 * and machine-readable JSON streaming for the web UI.
 */
void emit_event(int json_mode, const char *phase, const char *syscall_name,
                pid_t pid, pid_t ppid, const char *state, const char *msg) {
    time_t rawtime;
    struct tm *timeinfo;
    char time_str[32];

    time(&rawtime);
    timeinfo = localtime(&rawtime);
    strftime(time_str, sizeof(time_str), "%H:%M:%S", timeinfo);

    if (json_mode) {
        /* Escape quotes in message if any */
        char safe_msg[512];
        size_t j = 0;
        for (size_t i = 0; msg[i] != '\0' && j < sizeof(safe_msg) - 2; i++) {
            if (msg[i] == '"' || msg[i] == '\\') {
                safe_msg[j++] = '\\';
            }
            safe_msg[j++] = msg[i];
        }
        safe_msg[j] = '\0';

        printf("{\"type\":\"event\",\"time\":\"%s\",\"phase\":\"%s\",\"syscall\":\"%s\",\"pid\":%d,\"ppid\":%d,\"state\":\"%s\",\"message\":\"%s\"}\n",
               time_str, phase, syscall_name, (int)pid, (int)ppid, state, safe_msg);
        fflush(stdout);
    } else {
        const char *badge_color = COLOR_WHITE;
        if (strcmp(state, STATE_RUNNING) == 0) badge_color = COLOR_GREEN;
        else if (strcmp(state, STATE_WAITING) == 0) badge_color = COLOR_YELLOW;
        else if (strcmp(state, STATE_SLEEPING) == 0) badge_color = COLOR_CYAN;
        else if (strcmp(state, STATE_ZOMBIE) == 0) badge_color = COLOR_MAGENTA;
        else if (strcmp(state, STATE_ORPHAN) == 0) badge_color = COLOR_YELLOW;
        else if (strcmp(state, STATE_TERMINATED) == 0) badge_color = COLOR_RED;

        printf("%s[%s]%s %s%-14s%s %s[%-8s]%s (PID: %5d | PPID: %5d) %s[%s]%s %s\n",
               COLOR_WHITE, time_str, COLOR_RESET,
               COLOR_CYAN, syscall_name, COLOR_RESET,
               COLOR_BOLD, phase, COLOR_RESET,
               (int)pid, (int)ppid,
               badge_color, state, COLOR_RESET,
               msg);
        fflush(stdout);
    }
}

static void print_banner(void) {
    printf("%s========================================================================%s\n", COLOR_CYAN, COLOR_RESET);
    printf("%s   OPERATING SYSTEMS & SYSTEMS PROGRAMMING                              %s\n", COLOR_BOLD, COLOR_RESET);
    printf("%s   Linux Process Creation, Execution and Termination System             %s\n", COLOR_YELLOW, COLOR_RESET);
    printf("%s   POSIX System Calls: fork(), execvp(), waitpid(), exit()              %s\n", COLOR_WHITE, COLOR_RESET);
    printf("%s========================================================================%s\n\n", COLOR_CYAN, COLOR_RESET);
}

static void print_usage(const char *prog_name) {
    print_banner();
    printf("Usage: %s [--json] <scenario> [args...]\n\n", prog_name);
    printf("Scenarios:\n");
    printf("  normal [cmd] [args]   Demonstrate standard fork() -> exec() -> wait() -> exit()\n");
    printf("                        (Default command: 'ls -la' if none specified)\n");
    printf("  zombie                Simulate a ZOMBIE process (child exits before parent wait)\n");
    printf("  orphan                Simulate an ORPHAN process (parent exits, init adopts)\n");
    printf("  nonblocking           Demonstrate non-blocking waitpid(WNOHANG) polling loop\n");
    printf("  signal [signum]       Simulate abnormal termination via signal (Default: SIGKILL)\n");
    printf("  custom <cmd> [args]   Execute an arbitrary command via fork() and execvp()\n");
    printf("\nFlags:\n");
    printf("  --json                Emit events as newline-delimited JSON objects\n\n");
}

int main(int argc, char *argv[]) {
    int json_mode = 0;
    int arg_offset = 1;

    if (argc < 2) {
        print_usage(argv[0]);
        return 1;
    }

    /* Check for --json flag */
    if (strcmp(argv[1], "--json") == 0) {
        json_mode = 1;
        arg_offset++;
        if (argc <= arg_offset) {
            fprintf(stderr, "Error: Scenario required after --json\n");
            return 1;
        }
    }

    if (!json_mode) {
        print_banner();
    }

    const char *scenario = argv[arg_offset];

    if (strcmp(scenario, "normal") == 0) {
        /* Standard Lifecycle */
        char *default_argv[] = {"ls", "-la", NULL};
        char *cmd = "ls";
        char **exec_args = default_argv;

        if (argc > arg_offset + 1) {
            cmd = argv[arg_offset + 1];
            exec_args = &argv[arg_offset + 1];
        }

        return run_standard_lifecycle(cmd, exec_args, json_mode);

    } else if (strcmp(scenario, "zombie") == 0) {
        /* Zombie Simulation */
        return run_zombie_simulation(json_mode);

    } else if (strcmp(scenario, "orphan") == 0) {
        /* Orphan Simulation */
        return run_orphan_simulation(json_mode);

    } else if (strcmp(scenario, "nonblocking") == 0) {
        /* Non-blocking waitpid(WNOHANG) */
        emit_event(json_mode, "INIT", "setup", getpid(), getppid(), STATE_RUNNING,
                   "Starting Non-blocking waitpid() demo with child running a 3-second task.");
        pid_t child = fork();
        if (child == 0) {
            /* Child sleeps 2 seconds */
            sleep(2);
            exit(0);
        } else if (child > 0) {
            return monitor_child_nonblocking(child, 10, 300, json_mode);
        } else {
            perror("fork");
            return 1;
        }

    } else if (strcmp(scenario, "signal") == 0) {
        /* Signal Abnormal Termination */
        int sig = SIGKILL;
        if (argc > arg_offset + 1) {
            sig = atoi(argv[arg_offset + 1]);
            if (sig <= 0) sig = SIGKILL;
        }
        return run_signal_simulation(sig, json_mode);

    } else if (strcmp(scenario, "custom") == 0) {
        /* Custom Command */
        if (argc <= arg_offset + 1) {
            fprintf(stderr, "Error: No command specified for 'custom' scenario\n");
            return 1;
        }
        char *cmd = argv[arg_offset + 1];
        char **exec_args = &argv[arg_offset + 1];
        return run_standard_lifecycle(cmd, exec_args, json_mode);

    } else {
        fprintf(stderr, "Unknown scenario: '%s'\n", scenario);
        print_usage(argv[0]);
        return 1;
    }

    return 0;
}
