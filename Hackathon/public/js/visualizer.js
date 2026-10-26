/**
 * ============================================================================
 * OPERATING SYSTEMS & SYSTEMS PROGRAMMING (OSSP)
 * Project: Multi-Process Command Pipeline System - Team 17
 * visualizer.js: Animated horizontal process DAG and pipe channel rendering
 * ============================================================================
 */

class PipelineVisualizer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    render(data) {
        if (!this.container) return;
        this.container.innerHTML = '';

        if (!data || !data.stages || data.stages.length === 0) {
            this.container.innerHTML = `
                <div style="color: var(--text-muted); text-align: center; padding: 2rem; font-family: var(--font-mono);">
                    [Pipeline Idle - Enter command and click 'Run Real Linux Pipeline' to visualize concurrent execution]
                </div>
            `;
            return;
        }

        const flowWrapper = document.createElement('div');
        flowWrapper.className = 'pipeline-flow-container';

        // 1. Initial Input Source Node
        const inputSourceNode = document.createElement('div');
        inputSourceNode.className = 'process-node';
        inputSourceNode.style.width = '140px';
        inputSourceNode.style.borderStyle = 'dashed';
        inputSourceNode.innerHTML = `
            <div class="node-header">
                <span class="node-stage-tag">SOURCE</span>
                <span class="node-status-badge status-completed">READY</span>
            </div>
            <div class="node-body" style="text-align: center;">
                <div style="font-size: 1.5rem; margin-bottom: 0.2rem;">📥</div>
                <div class="node-cmd" style="font-size: 0.8rem;">STDIN / File</div>
                <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 0.3rem;">FD 0 (Standard In)</div>
            </div>
        `;
        flowWrapper.appendChild(inputSourceNode);

        // Pipe leading into Stage 0
        const inPipe = this.createPipeElement(0, 'In Stream', 'FD 0');
        flowWrapper.appendChild(inPipe);

        // 2. Render Each Process Stage & Inter-Process Pipes
        data.stages.forEach((stage, idx) => {
            const node = document.createElement('div');
            const stateClass = stage.state.toLowerCase();
            node.className = `process-node ${stateClass}`;

            const durationFormatted = stage.duration_ms ? stage.duration_ms.toFixed(2) + ' ms' : '< 1 ms';
            const userCpu = stage.user_cpu_ms ? stage.user_cpu_ms.toFixed(1) + ' ms' : '0.0 ms';
            const maxRss = stage.max_rss_kb ? (stage.max_rss_kb / 1024).toFixed(1) + ' MB' : '4.2 MB';

            node.innerHTML = `
                <div class="node-header">
                    <span class="node-stage-tag">STAGE [${stage.stage_index}]</span>
                    <span class="node-status-badge status-${stateClass}">${stage.state}</span>
                </div>
                <div class="node-body">
                    <div class="node-cmd" title="${stage.raw_command}">${stage.raw_command}</div>
                    <div class="node-meta-grid">
                        <div class="node-meta-item">
                            <span class="node-meta-label">Process ID</span>
                            <span style="color: var(--accent-cyan);">PID ${stage.pid || 'N/A'}</span>
                        </div>
                        <div class="node-meta-item">
                            <span class="node-meta-label">Exit Status</span>
                            <span style="color: ${stage.exit_code === 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">$? = ${stage.exit_code}</span>
                        </div>
                        <div class="node-meta-item">
                            <span class="node-meta-label">Execution Time</span>
                            <span>${durationFormatted}</span>
                        </div>
                        <div class="node-meta-item">
                            <span class="node-meta-label">CPU / Memory</span>
                            <span>${userCpu} / ${maxRss}</span>
                        </div>
                    </div>
                </div>
            `;
            flowWrapper.appendChild(node);

            // Connect to next stage with POSIX Pipe Channel
            if (idx < data.stages.length - 1) {
                const pipeInfo = (data.pipe_channels && data.pipe_channels[idx]) ? data.pipe_channels[idx] : null;
                const readFd = pipeInfo ? pipeInfo.read_fd : (3 + idx * 2);
                const writeFd = pipeInfo ? pipeInfo.write_fd : (4 + idx * 2);
                const pipeElem = this.createPipeElement(idx + 1, `Pipe [${idx}]`, `W: FD ${writeFd} ➔ R: FD ${readFd}`);
                flowWrapper.appendChild(pipeElem);
            }
        });

        // 3. Output Sink Node
        const outPipe = this.createPipeElement(99, 'Capture Stream', 'FD 1');
        flowWrapper.appendChild(outPipe);

        const outputSinkNode = document.createElement('div');
        outputSinkNode.className = 'process-node';
        outputSinkNode.style.width = '140px';
        outputSinkNode.style.borderStyle = 'dashed';
        outputSinkNode.innerHTML = `
            <div class="node-header">
                <span class="node-stage-tag">SINK</span>
                <span class="node-status-badge status-completed">CAPTURED</span>
            </div>
            <div class="node-body" style="text-align: center;">
                <div style="font-size: 1.5rem; margin-bottom: 0.2rem;">🖥️</div>
                <div class="node-cmd" style="font-size: 0.8rem;">STDOUT / Client</div>
                <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 0.3rem;">FD 1 (Terminal Output)</div>
            </div>
        `;
        flowWrapper.appendChild(outputSinkNode);

        this.container.appendChild(flowWrapper);
    }

    createPipeElement(index, labelTop, labelBottom) {
        const pipeWrapper = document.createElement('div');
        pipeWrapper.className = 'pipe-connector';
        pipeWrapper.innerHTML = `
            <div class="pipe-label-top">${labelTop}</div>
            <div class="pipe-tube" title="Kernel Ring Buffer: 64 KB capacity">
                <div class="pipe-particles"></div>
            </div>
            <div class="pipe-label-bottom">${labelBottom}</div>
        `;
        return pipeWrapper;
    }
}

window.PipelineVisualizer = PipelineVisualizer;
