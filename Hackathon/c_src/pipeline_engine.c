/**
 * ============================================================================
 * OPERATING SYSTEMS & SYSTEMS PROGRAMMING (OSSP)
 * Project: Multi-Process Command Pipeline System
 * Team 17 - Hackathon
 * ============================================================================
 * pipeline_engine.c: Core multi-process execution engine using POSIX pipe/fork/dup2
 * ============================================================================
 */

#include "pipeline_types.h"
#include "pipeline_parser.h"
#include "pipeline_monitor.h"
#include <fcntl.h>
#include <errno.h>

/**
 * Executes the multi-process pipeline session
 */
int execute_pipeline(PipelineSession *session, const char *custom_stdin, bool capture_stdout) {
    if (!session || session->num_stages == 0) return -1;

    int num_stages = session->num_stages;
    int num_pipes = num_stages - 1;
    int pipe_fds[MAX_STAGES][2];
    int stderr_fds[MAX_STAGES][2];
    int capture_fd[2];
    int input_feed_fd[2];
    bool use_input_feed = (custom_stdin != NULL && strlen(custom_stdin) > 0);

    double global_start_time = get_current_time_ms();

    // 1. Create inter-process pipes between stages
    for (int i = 0; i < num_pipes; i++) {
        if (pipe(pipe_fds[i]) < 0) {
            snprintf(session->global_error, sizeof(session->global_error),
                     "Kernel pipe() call failed at index %d: %s", i, strerror(errno));
            session->success = false;
            return -1;
        }
        session->pipes[i].read_fd = pipe_fds[i][0];
        session->pipes[i].write_fd = pipe_fds[i][1];
    }

    // 2. Create stderr capture pipes for each stage
    for (int i = 0; i < num_stages; i++) {
        if (pipe(stderr_fds[i]) < 0) {
            snprintf(session->global_error, sizeof(session->global_error),
                     "stderr pipe() call failed for stage %d: %s", i, strerror(errno));
            session->success = false;
            return -1;
        }
    }

    // 3. Create stdout capture pipe for final stage if requested
    if (capture_stdout) {
        if (pipe(capture_fd) < 0) {
            snprintf(session->global_error, sizeof(session->global_error),
                     "Stdout capture pipe() failed: %s", strerror(errno));
            session->success = false;
            return -1;
        }
    }

    // 4. Create input feed pipe if custom STDIN provided
    if (use_input_feed) {
        if (pipe(input_feed_fd) < 0) {
            snprintf(session->global_error, sizeof(session->global_error),
                     "Input feed pipe() failed: %s", strerror(errno));
            session->success = false;
            return -1;
        }
    }

    // 5. Fork child processes concurrently for each stage
    for (int i = 0; i < num_stages; i++) {
        PipelineStage *stg = &session->stages[i];
        stg->start_time_ms = get_current_time_ms();
        stg->state = STAGE_STATE_FORKED;

        pid_t pid = fork();

        if (pid < 0) {
            snprintf(session->global_error, sizeof(session->global_error),
                     "fork() failed at stage %d (%s): %s", i, stg->raw_command, strerror(errno));
            stg->state = STAGE_STATE_FAILED;
            session->success = false;
            return -1;
        }

        if (pid == 0) {
            // ================================================================
            // CHILD PROCESS EXECUTION CONTEXT (Process Stage i)
            // ================================================================

            // --- STDIN REDIRECTION ---
            if (i == 0) {
                // First stage: Read from custom input feed if available
                if (use_input_feed) {
                    dup2(input_feed_fd[0], STDIN_FILENO);
                }
            } else {
                // Intermediate or final stage: Read from previous pipe's read end
                dup2(pipe_fds[i - 1][0], STDIN_FILENO);
            }

            // --- STDOUT REDIRECTION ---
            if (i < num_stages - 1) {
                // Not last stage: Write to next pipe's write end
                dup2(pipe_fds[i][1], STDOUT_FILENO);
            } else {
                // Final stage: Redirect to capture pipe if capture enabled
                if (capture_stdout) {
                    dup2(capture_fd[1], STDOUT_FILENO);
                }
            }

            // --- STDERR REDIRECTION ---
            dup2(stderr_fds[i][1], STDERR_FILENO);

            // --- CRITICAL FILE DESCRIPTOR HYGIENE ---
            // Close all inherited pipe ends in child. Failure to close will cause
            // downstream readers to block forever waiting for EOF!
            for (int j = 0; j < num_pipes; j++) {
                close(pipe_fds[j][0]);
                close(pipe_fds[j][1]);
            }

            for (int j = 0; j < num_stages; j++) {
                close(stderr_fds[j][0]);
                close(stderr_fds[j][1]);
            }

            if (capture_stdout) {
                close(capture_fd[0]);
                close(capture_fd[1]);
            }

            if (use_input_feed) {
                close(input_feed_fd[0]);
                close(input_feed_fd[1]);
            }

            // Execute the Linux command binary
            execvp(stg->args[0], stg->args);

            // If execvp returns, an error occurred (e.g. binary not found)
            fprintf(stderr, "execvp error for '%s': %s\n", stg->args[0], strerror(errno));
            fflush(stderr);
            _exit(127);
        }

        // Parent records child PID
        stg->pid = pid;
        stg->state = STAGE_STATE_RUNNING;

        // Populate FD metadata for educational visualization
        stg->fd_info.orig_stdin_fd = (i == 0) ? (use_input_feed ? input_feed_fd[0] : 0) : pipe_fds[i - 1][0];
        stg->fd_info.orig_stdout_fd = (i < num_stages - 1) ? pipe_fds[i][1] : (capture_stdout ? capture_fd[1] : 1);
        stg->fd_info.assigned_stdin_fd = 0;
        stg->fd_info.assigned_stdout_fd = 1;
    }

    // ========================================================================
    // PARENT PROCESS CONTEXT
    // ========================================================================

    // 1. Close all inter-stage pipe ends in parent so children get EOF properly!
    for (int i = 0; i < num_pipes; i++) {
        close(pipe_fds[i][0]);
        close(pipe_fds[i][1]);
    }

    // Close write ends of stderr pipes in parent
    for (int i = 0; i < num_stages; i++) {
        close(stderr_fds[i][1]);
    }

    // Feed custom STDIN to first process if provided, then close write end
    if (use_input_feed) {
        close(input_feed_fd[0]); // Close read end in parent
        size_t input_len = strlen(custom_stdin);
        size_t written_total = 0;
        while (written_total < input_len) {
            ssize_t w = write(input_feed_fd[1], custom_stdin + written_total, input_len - written_total);
            if (w <= 0) break;
            written_total += w;
        }
        close(input_feed_fd[1]); // Sending EOF to stage 0
    }

    // Close write end of capture pipe in parent so read reaches EOF
    if (capture_stdout) {
        close(capture_fd[1]);

        // Read captured output of final stage
        session->final_output_len = 0;
        char read_chunk[4096];
        ssize_t bytes_read;

        while ((bytes_read = read(capture_fd[0], read_chunk, sizeof(read_chunk))) > 0) {
            if (session->final_output_len + bytes_read < sizeof(session->final_output) - 1) {
                memcpy(session->final_output + session->final_output_len, read_chunk, bytes_read);
                session->final_output_len += bytes_read;
            }
        }
        session->final_output[session->final_output_len] = '\0';
        close(capture_fd[0]);
    }

    // 2. Read stderr from each child
    for (int i = 0; i < num_stages; i++) {
        PipelineStage *stg = &session->stages[i];
        ssize_t err_bytes = read(stderr_fds[i][0], stg->stderr_capture, sizeof(stg->stderr_capture) - 1);
        if (err_bytes > 0) {
            stg->stderr_capture[err_bytes] = '\0';
        } else {
            stg->stderr_capture[0] = '\0';
        }
        close(stderr_fds[i][0]);
    }

    // 3. Harvest children termination statuses with waitpid()
    bool all_stages_ok = true;
    for (int i = 0; i < num_stages; i++) {
        PipelineStage *stg = &session->stages[i];
        int status = 0;
        waitpid(stg->pid, &status, 0);

        stg->end_time_ms = get_current_time_ms();
        stg->duration_ms = stg->end_time_ms - stg->start_time_ms;
        stg->raw_status = status;

        if (WIFEXITED(status)) {
            stg->exit_code = WEXITSTATUS(status);
            stg->term_signal = 0;
            if (stg->exit_code == 0) {
                stg->state = STAGE_STATE_COMPLETED;
            } else {
                stg->state = STAGE_STATE_FAILED;
                all_stages_ok = false;
            }
        } else if (WIFSIGNALED(status)) {
            stg->exit_code = -1;
            stg->term_signal = WTERMSIG(status);
            stg->state = STAGE_STATE_SIGNALED;
            all_stages_ok = false;
        }
    }

    // Collect resource usage
    struct rusage usage;
    if (getrusage(RUSAGE_CHILDREN, &usage) == 0) {
        for (int i = 0; i < num_stages; i++) {
            session->stages[i].user_cpu_ms = (double)usage.ru_utime.tv_sec * 1000.0 + (double)usage.ru_utime.tv_usec / 1000.0;
            session->stages[i].sys_cpu_ms = (double)usage.ru_stime.tv_sec * 1000.0 + (double)usage.ru_stime.tv_usec / 1000.0;
            session->stages[i].max_rss_kb = usage.ru_maxrss;
        }
    }

    double global_end_time = get_current_time_ms();
    session->total_wall_time_ms = global_end_time - global_start_time;
    session->success = all_stages_ok;

    return session->success ? 0 : 1;
}

/**
 * Print detailed educational explanation of the POSIX pipeline lifecycle
 */
static void print_posix_explanation(const PipelineSession *session) {
    printf("\n========================================================================================\n");
    printf("           POSIX MULTI-PROCESS PIPELINE SYSTEM CALL LIFECYCLE BREAKDOWN                 \n");
    printf("========================================================================================\n");
    printf("1. PIPE CREATION (pipe()):\n");
    printf("   - Number of inter-process pipes allocated: %d\n", session->num_pipes);
    for (int i = 0; i < session->num_pipes; i++) {
        printf("   - Pipe [%d]: Channel between Process [%d] and Process [%d] (Read FD: %d, Write FD: %d, Cap: 64KB)\n",
               i, session->pipes[i].from_stage, session->pipes[i].to_stage,
               session->pipes[i].read_fd, session->pipes[i].write_fd);
    }
    printf("\n2. PROCESS SPAWNING (fork()):\n");
    printf("   - All %d child processes were created concurrently using fork().\n", session->num_stages);
    for (int i = 0; i < session->num_stages; i++) {
        printf("   - Stage [%d] assigned PID: %d, executing command: \"%s\"\n",
               i, session->stages[i].pid, session->stages[i].raw_command);
    }
    printf("\n3. FILE DESCRIPTOR DUPLICATION (dup2()):\n");
    for (int i = 0; i < session->num_stages; i++) {
        const PipelineStage *s = &session->stages[i];
        printf("   - Process [%d] (PID %d): dup2(FD %d -> STDIN 0), dup2(FD %d -> STDOUT 1)\n",
               i, s->pid, s->fd_info.orig_stdin_fd, s->fd_info.orig_stdout_fd);
    }
    printf("\n4. DESCRIPTOR HYGIENE (close()):\n");
    printf("   - Parent and all child processes closed unused pipe read/write ends to ensure EOF signals\n");
    printf("     propagate cleanly through kernel ring buffers without deadlocking readers.\n");
    printf("\n5. PROCESS HARVESTING (waitpid()):\n");
    for (int i = 0; i < session->num_stages; i++) {
        const PipelineStage *s = &session->stages[i];
        printf("   - Process [%d] (PID %d): Exit Status = %d, Wall Time = %.2f ms\n",
               i, s->pid, s->exit_code, s->duration_ms);
    }
    printf("========================================================================================\n\n");
}

int main(int argc, char *argv[]) {
    if (argc < 2) {
        printf("Usage: %s [--json] [--explain] [--input \"data\"] \"<cmd1> | <cmd2> | ...\"\n", argv[0]);
        printf("Example: %s \"cat data/access_log.txt | grep 404 | wc -l\"\n", argv[0]);
        return 1;
    }

    bool json_mode = false;
    bool explain_mode = false;
    const char *custom_input = NULL;
    const char *pipeline_command = NULL;

    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "--json") == 0) {
            json_mode = true;
        } else if (strcmp(argv[i], "--explain") == 0) {
            explain_mode = true;
        } else if (strcmp(argv[i], "--input") == 0 && i + 1 < argc) {
            custom_input = argv[++i];
        } else if (strcmp(argv[i], "--help") == 0) {
            printf("Multi-Process Command Pipeline System - Team 17 Hackathon\n");
            printf("Options:\n");
            printf("  --json              Output telemetry and result as JSON\n");
            printf("  --explain           Print OS system call lifecycle explanation\n");
            printf("  --input \"<string>\"  Feed custom standard input to first process\n");
            return 0;
        } else if (pipeline_command == NULL) {
            pipeline_command = argv[i];
        }
    }

    if (!pipeline_command) {
        fprintf(stderr, "Error: No pipeline command provided\n");
        return 1;
    }

    PipelineSession session;
    int parse_rc = parse_pipeline_command(pipeline_command, &session);
    if (parse_rc != 0) {
        if (json_mode) {
            printf("{\n  \"success\": false,\n  \"error\": \"%s\",\n  \"command\": \"%s\"\n}\n",
                   session.global_error, pipeline_command);
        } else {
            fprintf(stderr, "Parse Error: %s\n", session.global_error);
        }
        return 1;
    }

    execute_pipeline(&session, custom_input, true);

    if (json_mode) {
        char *json_output = (char *)malloc(MAX_OUTPUT_BUFFER * 2 + 65536);
        if (json_output) {
            serialize_pipeline_to_json(&session, json_output, MAX_OUTPUT_BUFFER * 2 + 65536);
            printf("%s\n", json_output);
            free(json_output);
        }
    } else {
        print_pipeline_ascii_report(&session);
        if (explain_mode) {
            print_posix_explanation(&session);
        }
    }

    free_pipeline_session(&session);
    return session.success ? 0 : 1;
}
