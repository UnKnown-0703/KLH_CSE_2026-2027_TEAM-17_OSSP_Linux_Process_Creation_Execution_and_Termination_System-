/**
 * ============================================================================
 * OPERATING SYSTEMS & SYSTEMS PROGRAMMING (OSSP)
 * Project: Multi-Process Command Pipeline System
 * Team 17 - Hackathon
 * ============================================================================
 * pipeline_monitor.h: Telemetry, process metrics, and JSON serialization
 * ============================================================================
 */

#ifndef PIPELINE_MONITOR_H
#define PIPELINE_MONITOR_H

#include "pipeline_types.h"

/**
 * Returns current timestamp in milliseconds (high precision monotonic clock)
 */
double get_current_time_ms(void);

/**
 * Serializes the entire pipeline session state and telemetry into valid JSON format.
 * 
 * @param session Pointer to executed PipelineSession
 * @param json_buf Output buffer for JSON string
 * @param max_buf_len Maximum length of JSON buffer
 * @return Length of JSON string written, or -1 on buffer overflow
 */
int serialize_pipeline_to_json(const PipelineSession *session, char *json_buf, size_t max_buf_len);

/**
 * Prints a clean, rich ASCII telemetry table to terminal.
 * 
 * @param session Pointer to executed PipelineSession
 */
void print_pipeline_ascii_report(const PipelineSession *session);

#endif /* PIPELINE_MONITOR_H */
