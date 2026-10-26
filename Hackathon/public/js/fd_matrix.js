/**
 * ============================================================================
 * OPERATING SYSTEMS & SYSTEMS PROGRAMMING (OSSP)
 * Project: Multi-Process Command Pipeline System - Team 17
 * fd_matrix.js: File Descriptor Table Matrix & dup2 Redirection Inspector
 * ============================================================================
 */

class FDMatrixInspector {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    render(data) {
        if (!this.container) return;
        this.container.innerHTML = '';

        if (!data || !data.stages || data.stages.length === 0) {
            this.container.innerHTML = `
                <div style="color: var(--text-muted); text-align: center; padding: 2rem; font-family: var(--font-mono);">
                    [File Descriptor Table awaiting pipeline execution]
                </div>
            `;
            return;
        }

        const table = document.createElement('table');
        table.className = 'fd-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Process (PID)</th>
                    <th>Stage Command</th>
                    <th>STDIN (FD 0 Redirection)</th>
                    <th>STDOUT (FD 1 Redirection)</th>
                    <th>STDERR (FD 2 Redirection)</th>
                    <th>Unused Pipe Descriptors</th>
                    <th>dup2() Mechanism Summary</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

        const tbody = table.querySelector('tbody');

        data.stages.forEach((stage, idx) => {
            const tr = document.createElement('tr');
            const numStages = data.stages.length;

            let stdinDesc = '';
            let stdoutDesc = '';
            let dupSummary = '';

            if (idx === 0) {
                stdinDesc = '<span class="fd-badge fd-badge-in">FD 0 (Default STDIN)</span>';
            } else {
                const prevPipeRead = (data.pipe_channels && data.pipe_channels[idx - 1]) ? data.pipe_channels[idx - 1].read_fd : (3 + (idx - 1) * 2);
                stdinDesc = `<span class="fd-badge fd-badge-in">Pipe [${idx - 1}] Read End (FD ${prevPipeRead} ➔ 0)</span>`;
            }

            if (idx === numStages - 1) {
                stdoutDesc = '<span class="fd-badge fd-badge-out">STDOUT / Capture Pipe (➔ 1)</span>';
            } else {
                const nextPipeWrite = (data.pipe_channels && data.pipe_channels[idx]) ? data.pipe_channels[idx].write_fd : (4 + idx * 2);
                stdoutDesc = `<span class="fd-badge fd-badge-out">Pipe [${idx}] Write End (FD ${nextPipeWrite} ➔ 1)</span>`;
            }

            const stderrDesc = '<span class="fd-badge fd-badge-err">Capture FD ➔ 2</span>';
            const unusedDesc = '<span class="fd-badge fd-badge-closed">All other pipe ends CLOSED</span>';

            if (idx === 0 && numStages > 1) {
                dupSummary = `<code>dup2(pipes[0][1], 1)</code>; close all unneeded ends`;
            } else if (idx === numStages - 1 && numStages > 1) {
                dupSummary = `<code>dup2(pipes[${idx - 1}][0], 0)</code>; close all unneeded ends`;
            } else if (numStages > 1) {
                dupSummary = `<code>dup2(pipes[${idx - 1}][0], 0)</code>; <code>dup2(pipes[${idx}][1], 1)</code>`;
            } else {
                dupSummary = `Single stage (no pipe redirects)`;
            }

            tr.innerHTML = `
                <td><strong>Stage [${stage.stage_index}]</strong><br><span style="color:var(--accent-cyan);">PID ${stage.pid || '100' + idx}</span></td>
                <td><code>${stage.raw_command}</code></td>
                <td>${stdinDesc}</td>
                <td>${stdoutDesc}</td>
                <td>${stderrDesc}</td>
                <td>${unusedDesc}</td>
                <td><small style="color:var(--text-secondary);">${dupSummary}</small></td>
            `;
            tbody.appendChild(tr);
        });

        this.container.appendChild(table);
    }
}

window.FDMatrixInspector = FDMatrixInspector;
