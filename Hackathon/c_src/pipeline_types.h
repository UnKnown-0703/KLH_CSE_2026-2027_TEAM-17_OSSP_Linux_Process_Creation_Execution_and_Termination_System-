/**
 * ============================================================================
 * OPERATING SYSTEMS & SYSTEMS PROGRAMMING (OSSP)
 * Project: Multi-Process Command Pipeline System
 * Team 17 - Hackathon
 * ============================================================================
 * pipeline_types.h: Core data structures and types for pipeline management
 * ============================================================================
 */

#ifndef PIPELINE_TYPES_H
#define PIPELINE_TYPES_H

#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <sys/time.h>
#include <sys/resource.h>
#include <time.h>
#include <string.h>
#include <stdbool.h>

#define MAX_STAGES 16
#define MAX_ARGS_PER_STAGE 32
#define MAX_CMD_LEN 2048
#define MAX_OUTPUT_BUFFER 131072
#define MAX_STDERR_BUFFER 4096

/**
 * Lifecycle state of an individual pipeline stage process
 */
typedef enum {
    STAGE_STATE_INIT = 0,
    STAGE_STATE_FORKED,
    STAGE_STATE_RUNNING,
    STAGE_STATE_COMPLETED,
    STAGE_STATE_FAILED,
    STAGE_STATE_SIGNALED
} ProcessStageState;

/**
 * File descriptor redirection mapping for OS tracking
 */
typedef struct {
    int orig_stdin_fd;      /* Default STDIN (0) or previous pipe read end */
    int orig_stdout_fd;     /* Default STDOUT (1) or next pipe write end */
    int assigned_stdin_fd;  /* After dup2 redirection */
    int assigned_stdout_fd; /* After dup2 redirection */
    int closed_fds[MAX_STAGES * 2 + 4];
    int closed_count;
} FDRedirectionInfo;

/**
 * Represents a single stage / command in the pipeline
 */
typedef struct {
    int stage_index;
    char raw_command[MAX_CMD_LEN];
    char *args[MAX_ARGS_PER_STAGE];
    int argc;
    pid_t pid;
    ProcessStageState state;
    int exit_code;
    int raw_status;
    int term_signal;
    double start_time_ms;
    double end_time_ms;
    double duration_ms;
    double user_cpu_ms;
    double sys_cpu_ms;
    long max_rss_kb;
    size_t bytes_in;
    size_t bytes_out;
    FDRedirectionInfo fd_info;
    char stderr_capture[MAX_STDERR_BUFFER];
} PipelineStage;

/**
 * Represents a physical POSIX pipe between two stages
 */
typedef struct {
    int pipe_index;
    int from_stage;
    int to_stage;
    int read_fd;      /* pipe_fd[0] */
    int write_fd;     /* pipe_fd[1] */
    size_t buffer_capacity_bytes; /* Typically 65536 on Linux */
    size_t bytes_streamed;
} PipeChannel;

/**
 * The full pipeline definition containing all stages, pipes, and telemetry
 */
typedef struct {
    char raw_pipeline_string[MAX_CMD_LEN];
    int num_stages;
    PipelineStage stages[MAX_STAGES];
    int num_pipes;
    PipeChannel pipes[MAX_STAGES - 1];
    double total_wall_time_ms;
    bool success;
    char final_output[MAX_OUTPUT_BUFFER];
    size_t final_output_len;
    char global_error[1024];
} PipelineSession;

#endif /* PIPELINE_TYPES_H */
