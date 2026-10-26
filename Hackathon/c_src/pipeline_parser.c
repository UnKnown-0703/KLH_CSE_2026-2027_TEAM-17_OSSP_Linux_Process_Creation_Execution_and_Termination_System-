/**
 * ============================================================================
 * OPERATING SYSTEMS & SYSTEMS PROGRAMMING (OSSP)
 * Project: Multi-Process Command Pipeline System
 * Team 17 - Hackathon
 * ============================================================================
 * pipeline_parser.c: Implementation of pipeline splitting and tokenization
 * ============================================================================
 */

#include "pipeline_parser.h"
#include <ctype.h>

/**
 * Trims leading and trailing whitespace in-place
 */
static char *trim_whitespace(char *str) {
    if (!str) return NULL;
    while (isspace((unsigned char)*str)) str++;
    if (*str == 0) return str;

    char *end = str + strlen(str) - 1;
    while (end > str && isspace((unsigned char)*end)) end--;
    end[1] = '\0';
    return str;
}

/**
 * Tokenize a single command stage into arguments, respecting quotes.
 */
static int tokenize_stage_command(const char *cmd_str, PipelineStage *stage) {
    char buffer[MAX_CMD_LEN];
    strncpy(buffer, cmd_str, sizeof(buffer) - 1);
    buffer[sizeof(buffer) - 1] = '\0';

    char *trimmed = trim_whitespace(buffer);
    if (strlen(trimmed) == 0) {
        return -1;
    }

    stage->argc = 0;
    const char *p = trimmed;

    while (*p && stage->argc < MAX_ARGS_PER_STAGE - 1) {
        while (*p && isspace((unsigned char)*p)) p++;
        if (!*p) break;

        char token[MAX_CMD_LEN];
        int tlen = 0;

        while (*p && !isspace((unsigned char)*p)) {
            if (*p == '\'' || *p == '"') {
                char quote_char = *p++;
                while (*p && *p != quote_char) {
                    if (*p == '\\' && *(p + 1)) {
                        char next = *(p + 1);
                        if (next == 'n') {
                            if (tlen < (int)sizeof(token) - 1) token[tlen++] = '\n';
                            p += 2;
                            continue;
                        } else if (next == 't') {
                            if (tlen < (int)sizeof(token) - 1) token[tlen++] = '\t';
                            p += 2;
                            continue;
                        } else if (next == 'r') {
                            if (tlen < (int)sizeof(token) - 1) token[tlen++] = '\r';
                            p += 2;
                            continue;
                        } else if (next == quote_char || next == '\\') {
                            if (tlen < (int)sizeof(token) - 1) token[tlen++] = next;
                            p += 2;
                            continue;
                        } else {
                            if (tlen < (int)sizeof(token) - 2) {
                                token[tlen++] = *p++;
                                token[tlen++] = *p++;
                            }
                            continue;
                        }
                    }
                    if (tlen < (int)sizeof(token) - 1) {
                        token[tlen++] = *p;
                    }
                    p++;
                }
                if (*p == quote_char) {
                    p++; // skip closing quote
                }
            } else {
                if (*p == '\\' && *(p + 1)) {
                    char next = *(p + 1);
                    if (next == 'n') {
                        if (tlen < (int)sizeof(token) - 1) token[tlen++] = '\n';
                        p += 2;
                        continue;
                    } else if (next == 't') {
                        if (tlen < (int)sizeof(token) - 1) token[tlen++] = '\t';
                        p += 2;
                        continue;
                    } else if (next == ' ' || next == '\\' || next == '|') {
                        if (tlen < (int)sizeof(token) - 1) token[tlen++] = next;
                        p += 2;
                        continue;
                    } else {
                        if (tlen < (int)sizeof(token) - 2) {
                            token[tlen++] = *p++;
                            token[tlen++] = *p++;
                        }
                        continue;
                    }
                }
                if (tlen < (int)sizeof(token) - 1) {
                    token[tlen++] = *p;
                }
                p++;
            }
        }

        token[tlen] = '\0';
        if (tlen > 0) {
            stage->args[stage->argc] = strdup(token);
            stage->argc++;
        }
    }

    stage->args[stage->argc] = NULL;
    return (stage->argc > 0) ? 0 : -1;
}

/**
 * Main parser entry point
 */
int parse_pipeline_command(const char *raw_input, PipelineSession *session) {
    if (!raw_input || !session) return -1;

    memset(session, 0, sizeof(PipelineSession));
    strncpy(session->raw_pipeline_string, raw_input, sizeof(session->raw_pipeline_string) - 1);

    const char *p = raw_input;
    char stage_buf[MAX_CMD_LEN];
    int stage_pos = 0;
    bool in_single_quote = false;
    bool in_double_quote = false;

    while (*p) {
        char c = *p;

        if (c == '\\' && *(p + 1)) {
            if (stage_pos < (int)sizeof(stage_buf) - 2) {
                stage_buf[stage_pos++] = c;
                stage_buf[stage_pos++] = *(p + 1);
            }
            p += 2;
            continue;
        }

        if (c == '\'' && !in_double_quote) {
            in_single_quote = !in_single_quote;
        } else if (c == '"' && !in_single_quote) {
            in_double_quote = !in_double_quote;
        }

        // Pipe operator detected outside quotes
        if (c == '|' && !in_single_quote && !in_double_quote) {
            stage_buf[stage_pos] = '\0';
            char *trimmed_stage = trim_whitespace(stage_buf);

            if (strlen(trimmed_stage) == 0) {
                snprintf(session->global_error, sizeof(session->global_error),
                         "Syntax Error: Empty command between pipe operators");
                return -2;
            }

            if (session->num_stages >= MAX_STAGES) {
                snprintf(session->global_error, sizeof(session->global_error),
                         "Exceeded maximum supported pipeline stages (%d)", MAX_STAGES);
                return -3;
            }

            PipelineStage *stg = &session->stages[session->num_stages];
            stg->stage_index = session->num_stages;
            strncpy(stg->raw_command, trimmed_stage, sizeof(stg->raw_command) - 1);

            if (tokenize_stage_command(trimmed_stage, stg) != 0) {
                snprintf(session->global_error, sizeof(session->global_error),
                         "Failed to tokenize command: %s", trimmed_stage);
                return -4;
            }

            session->num_stages++;
            stage_pos = 0;
            p++;
            continue;
        }

        if (stage_pos < (int)sizeof(stage_buf) - 1) {
            stage_buf[stage_pos++] = c;
        }
        p++;
    }

    if (in_single_quote || in_double_quote) {
        snprintf(session->global_error, sizeof(session->global_error),
                 "Syntax Error: Unclosed quote detected in pipeline command");
        return -5;
    }

    // Process final stage after last pipe
    stage_buf[stage_pos] = '\0';
    char *trimmed_last = trim_whitespace(stage_buf);
    if (strlen(trimmed_last) == 0) {
        if (session->num_stages > 0) {
            snprintf(session->global_error, sizeof(session->global_error),
                     "Syntax Error: Trailing pipe without downstream command");
            return -6;
        } else {
            snprintf(session->global_error, sizeof(session->global_error),
                     "Empty pipeline string provided");
            return -7;
        }
    }

    PipelineStage *last_stg = &session->stages[session->num_stages];
    last_stg->stage_index = session->num_stages;
    strncpy(last_stg->raw_command, trimmed_last, sizeof(last_stg->raw_command) - 1);

    if (tokenize_stage_command(trimmed_last, last_stg) != 0) {
        snprintf(session->global_error, sizeof(session->global_error),
                 "Failed to tokenize final command: %s", trimmed_last);
        return -8;
    }
    session->num_stages++;

    session->num_pipes = session->num_stages - 1;
    for (int i = 0; i < session->num_pipes; i++) {
        session->pipes[i].pipe_index = i;
        session->pipes[i].from_stage = i;
        session->pipes[i].to_stage = i + 1;
        session->pipes[i].buffer_capacity_bytes = 65536; // Linux default pipe buffer
    }

    return 0;
}

/**
 * Free stage allocated arguments
 */
void free_pipeline_session(PipelineSession *session) {
    if (!session) return;
    for (int i = 0; i < session->num_stages; i++) {
        for (int j = 0; j < session->stages[i].argc; j++) {
            if (session->stages[i].args[j]) {
                free(session->stages[i].args[j]);
                session->stages[i].args[j] = NULL;
            }
        }
        session->stages[i].argc = 0;
    }
}

/**
 * Print pipeline structure for CLI debugging
 */
void print_pipeline_stages(const PipelineSession *session) {
    if (!session) return;
    printf("[Pipeline Parser] Stages: %d, Pipes: %d\n", session->num_stages, session->num_pipes);
    for (int i = 0; i < session->num_stages; i++) {
        const PipelineStage *s = &session->stages[i];
        printf("  Stage [%d]: \"%s\" (argc=%d)\n", s->stage_index, s->raw_command, s->argc);
        for (int a = 0; a < s->argc; a++) {
            printf("    arg[%d]: \"%s\"\n", a, s->args[a]);
        }
    }
}
