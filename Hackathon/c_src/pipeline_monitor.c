/**
 * ============================================================================
 * OPERATING SYSTEMS & SYSTEMS PROGRAMMING (OSSP)
 * Project: Multi-Process Command Pipeline System
 * Team 17 - Hackathon
 * ============================================================================
 * pipeline_monitor.c: Metrics collection, JSON serialization, and ASCII reporting
 * ============================================================================
 */

#include "pipeline_monitor.h"

double get_current_time_ms(void) {
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return (double)ts.tv_sec * 1000.0 + (double)ts.tv_nsec / 1000000.0;
}

/**
 * Escapes characters for strict JSON compliance
 */
static void json_escape_string(const char *src, char *dest, size_t dest_size) {
    if (!src || !dest || dest_size == 0) return;
    size_t d = 0;
    for (size_t s = 0; src[s] != '\0' && d + 4 < dest_size; s++) {
        unsigned char c = (unsigned char)src[s];
        switch (c) {
            case '"':
                dest[d++] = '\\'; dest[d++] = '"'; break;
            case '\\':
                dest[d++] = '\\'; dest[d++] = '\\'; break;
            case '\b':
                dest[d++] = '\\'; dest[d++] = 'b'; break;
            case '\f':
                dest[d++] = '\\'; dest[d++] = 'f'; break;
            case '\n':
                dest[d++] = '\\'; dest[d++] = 'n'; break;
            case '\r':
                dest[d++] = '\\'; dest[d++] = 'r'; break;
            case '\t':
                dest[d++] = '\\'; dest[d++] = 't'; break;
            default:
                if (c < 32 || c == 127) {
                    d += snprintf(&dest[d], dest_size - d, "\\u%04x", c);
                } else {
                    dest[d++] = (char)c;
                }
                break;
        }
    }
    dest[d] = '\0';
}

int serialize_pipeline_to_json(const PipelineSession *session, char *json_buf, size_t max_buf_len) {
    if (!session || !json_buf || max_buf_len == 0) return -1;

    char escaped_cmd[MAX_CMD_LEN * 2];
    json_escape_string(session->raw_pipeline_string, escaped_cmd, sizeof(escaped_cmd));

    char escaped_err[MAX_CMD_LEN * 2];
    json_escape_string(session->global_error, escaped_err, sizeof(escaped_err));

    char *p = json_buf;
    size_t rem = max_buf_len;

    int written = snprintf(p, rem,
        "{\n"
        "  \"success\": %s,\n"
        "  \"command\": \"%s\",\n"
        "  \"num_stages\": %d,\n"
        "  \"num_pipes\": %d,\n"
        "  \"total_wall_time_ms\": %.3f,\n"
        "  \"global_error\": \"%s\",\n"
        "  \"pipe_channels\": [\n",
        session->success ? "true" : "false",
        escaped_cmd,
        session->num_stages,
        session->num_pipes,
        session->total_wall_time_ms,
        escaped_err
    );
    if (written < 0 || (size_t)written >= rem) return -1;
    p += written; rem -= written;

    // Serialize pipe channels
    for (int i = 0; i < session->num_pipes; i++) {
        const PipeChannel *pch = &session->pipes[i];
        written = snprintf(p, rem,
            "    {\n"
            "      \"pipe_index\": %d,\n"
            "      \"from_stage\": %d,\n"
            "      \"to_stage\": %d,\n"
            "      \"read_fd\": %d,\n"
            "      \"write_fd\": %d,\n"
            "      \"capacity_bytes\": %zu\n"
            "    }%s\n",
            pch->pipe_index,
            pch->from_stage,
            pch->to_stage,
            pch->read_fd,
            pch->write_fd,
            pch->buffer_capacity_bytes,
            (i < session->num_pipes - 1) ? "," : ""
        );
        if (written < 0 || (size_t)written >= rem) return -1;
        p += written; rem -= written;
    }

    written = snprintf(p, rem, "  ],\n  \"stages\": [\n");
    if (written < 0 || (size_t)written >= rem) return -1;
    p += written; rem -= written;

    // Serialize stages
    for (int i = 0; i < session->num_stages; i++) {
        const PipelineStage *stg = &session->stages[i];

        char esc_stg_cmd[MAX_CMD_LEN * 2];
        json_escape_string(stg->raw_command, esc_stg_cmd, sizeof(esc_stg_cmd));

        char esc_stderr[MAX_STDERR_BUFFER * 2];
        json_escape_string(stg->stderr_capture, esc_stderr, sizeof(esc_stderr));

        const char *state_str = "UNKNOWN";
        switch (stg->state) {
            case STAGE_STATE_INIT: state_str = "INIT"; break;
            case STAGE_STATE_FORKED: state_str = "FORKED"; break;
            case STAGE_STATE_RUNNING: state_str = "RUNNING"; break;
            case STAGE_STATE_COMPLETED: state_str = "COMPLETED"; break;
            case STAGE_STATE_FAILED: state_str = "FAILED"; break;
            case STAGE_STATE_SIGNALED: state_str = "SIGNALED"; break;
        }

        written = snprintf(p, rem,
            "    {\n"
            "      \"stage_index\": %d,\n"
            "      \"raw_command\": \"%s\",\n"
            "      \"binary\": \"%s\",\n"
            "      \"pid\": %d,\n"
            "      \"state\": \"%s\",\n"
            "      \"exit_code\": %d,\n"
            "      \"signal\": %d,\n"
            "      \"duration_ms\": %.3f,\n"
            "      \"user_cpu_ms\": %.3f,\n"
            "      \"sys_cpu_ms\": %.3f,\n"
            "      \"max_rss_kb\": %ld,\n"
            "      \"fd_info\": {\n"
            "        \"orig_stdin\": %d,\n"
            "        \"orig_stdout\": %d,\n"
            "        \"assigned_stdin\": %d,\n"
            "        \"assigned_stdout\": %d\n"
            "      },\n"
            "      \"stderr\": \"%s\",\n"
            "      \"args\": [",
            stg->stage_index,
            esc_stg_cmd,
            (stg->argc > 0 && stg->args[0]) ? stg->args[0] : "",
            stg->pid,
            state_str,
            stg->exit_code,
            stg->term_signal,
            stg->duration_ms,
            stg->user_cpu_ms,
            stg->sys_cpu_ms,
            stg->max_rss_kb,
            stg->fd_info.orig_stdin_fd,
            stg->fd_info.orig_stdout_fd,
            stg->fd_info.assigned_stdin_fd,
            stg->fd_info.assigned_stdout_fd,
            esc_stderr
        );
        if (written < 0 || (size_t)written >= rem) return -1;
        p += written; rem -= written;

        for (int a = 0; a < stg->argc; a++) {
            char esc_arg[MAX_CMD_LEN];
            json_escape_string(stg->args[a], esc_arg, sizeof(esc_arg));
            written = snprintf(p, rem, "\"%s\"%s", esc_arg, (a < stg->argc - 1) ? ", " : "");
            if (written < 0 || (size_t)written >= rem) return -1;
            p += written; rem -= written;
        }

        written = snprintf(p, rem, "]\n    }%s\n", (i < session->num_stages - 1) ? "," : "");
        if (written < 0 || (size_t)written >= rem) return -1;
        p += written; rem -= written;
    }

    // Allocate temp buffer for final output escaping
    size_t esc_out_size = session->final_output_len * 2 + 1024;
    char *escaped_output = (char *)malloc(esc_out_size);
    if (!escaped_output) {
        written = snprintf(p, rem, "  ],\n  \"final_output\": \"\"\n}\n");
    } else {
        json_escape_string(session->final_output, escaped_output, esc_out_size);
        written = snprintf(p, rem,
            "  ],\n"
            "  \"output_bytes\": %zu,\n"
            "  \"final_output\": \"%s\"\n"
            "}\n",
            session->final_output_len,
            escaped_output
        );
        free(escaped_output);
    }
    if (written < 0 || (size_t)written >= rem) return -1;
    p += written; rem -= written;

    return (int)(p - json_buf);
}

void print_pipeline_ascii_report(const PipelineSession *session) {
    if (!session) return;

    printf("\n");
    printf("========================================================================================\n");
    printf("                  MULTI-PROCESS COMMAND PIPELINE EXECUTION REPORT                       \n");
    printf("========================================================================================\n");
    printf(" Pipeline String : %s\n", session->raw_pipeline_string);
    printf(" Overall Status  : %s\n", session->success ? "\033[32mSUCCESS (ALL PROCESSES ZERO)\033[0m" : "\033[31mCOMPLETED WITH ERRORS\033[0m");
    printf(" Total Stages    : %d processes running concurrently\n", session->num_stages);
    printf(" Total Pipes     : %d POSIX anonymous unidirectional channels\n", session->num_pipes);
    printf(" Wall Clock Time : %.2f ms\n", session->total_wall_time_ms);
    printf("----------------------------------------------------------------------------------------\n");
    printf(" %-5s | %-7s | %-12s | %-7s | %-9s | %-18s | %-12s\n",
           "Stage", "PID", "Command", "Exit", "Time (ms)", "FD Mapping (In->Out)", "State");
    printf("-------+---------+--------------+---------+-----------+--------------------+------------\n");

    for (int i = 0; i < session->num_stages; i++) {
        const PipelineStage *s = &session->stages[i];
        char fd_map[32];
        snprintf(fd_map, sizeof(fd_map), "FD %d -> FD %d",
                 s->fd_info.assigned_stdin_fd, s->fd_info.assigned_stdout_fd);

        const char *state_tag = (s->exit_code == 0) ? "\033[32mOK\033[0m" : "\033[31mFAIL\033[0m";

        printf("  [%d]  | %-7d | %-12.12s | %-7d | %-9.2f | %-18s | %s\n",
               s->stage_index,
               s->pid,
               s->raw_command,
               s->exit_code,
               s->duration_ms,
               fd_map,
               state_tag);
    }

    printf("========================================================================================\n");
    printf(" PIPELINE FINAL STDOUT CAPTURE (%zu bytes):\n", session->final_output_len);
    printf("----------------------------------------------------------------------------------------\n");
    if (session->final_output_len > 0) {
        printf("%s", session->final_output);
        if (session->final_output[session->final_output_len - 1] != '\n') {
            printf("\n");
        }
    } else {
        printf("(No output produced on STDOUT)\n");
    }
    printf("========================================================================================\n\n");
}
