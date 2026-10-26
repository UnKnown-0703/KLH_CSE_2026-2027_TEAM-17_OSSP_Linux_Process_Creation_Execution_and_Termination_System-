/**
 * ============================================================================
 * OPERATING SYSTEMS & SYSTEMS PROGRAMMING (OSSP)
 * Project: Multi-Process Command Pipeline System
 * Team 17 - Hackathon
 * ============================================================================
 * pipeline_parser.h: Command pipeline parsing and argument tokenization
 * ============================================================================
 */

#ifndef PIPELINE_PARSER_H
#define PIPELINE_PARSER_H

#include "pipeline_types.h"

/**
 * Parses a raw command string with pipe separators into a structured PipelineSession.
 * Handles quoted arguments (single and double quotes) without breaking pipes inside quotes.
 * 
 * @param raw_input The input pipeline command string (e.g., "cat file | grep text | wc -l")
 * @param session Pointer to PipelineSession to be populated
 * @return 0 on success, negative error code on syntax/parsing failure
 */
int parse_pipeline_command(const char *raw_input, PipelineSession *session);

/**
 * Frees any dynamically allocated memory inside session arguments.
 * 
 * @param session Pointer to PipelineSession
 */
void free_pipeline_session(PipelineSession *session);

/**
 * Prints the parsed stages for debugging or verification.
 * 
 * @param session Pointer to PipelineSession
 */
void print_pipeline_stages(const PipelineSession *session);

#endif /* PIPELINE_PARSER_H */
