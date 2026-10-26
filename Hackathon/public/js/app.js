/**
 * ============================================================================
 * OPERATING SYSTEMS & SYSTEMS PROGRAMMING (OSSP) - TEAM 17
 * app.js: Lightweight Pipeline Simulator Controller
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    const cmdInput = document.getElementById('command-input');
    const runBtn = document.getElementById('btn-run');
    const viewport = document.getElementById('pipeline-viewport');
    const outputScreen = document.getElementById('output-screen');
    const outputMeta = document.getElementById('output-meta');
    const timingBadge = document.getElementById('timing-badge');
    const presetPills = document.querySelectorAll('.preset-pill');

    // 1. Preset button click handlers
    presetPills.forEach(pill => {
        pill.addEventListener('click', () => {
            presetPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            cmdInput.value = pill.getAttribute('data-cmd');
            runPipeline();
        });
    });

    // 2. Pressing Enter inside input triggers run
    cmdInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            runPipeline();
        }
    });

    runBtn.addEventListener('click', runPipeline);

    // 3. Core execution function
    async function runPipeline() {
        const command = cmdInput.value.trim();
        if (!command) {
            alert('Please enter a Linux pipeline command.');
            return;
        }

        runBtn.disabled = true;
        runBtn.innerText = 'Running...';
        timingBadge.innerText = 'Executing in Linux WSL...';
        outputScreen.innerText = '// Executing commands concurrently in Linux kernel via pipes...';

        try {
            const res = await fetch('/api/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: command })
            });

            const json = await res.json();
            const data = json.data || {};

            // Render Visual Pipeline Blocks
            renderPipelineFlow(data);

            // Display STDOUT
            const outputText = data.final_output || json.raw_stdout || '(No output produced)';
            outputScreen.innerText = outputText;

            // Output Metadata
            const lineCount = outputText.trim() ? outputText.trim().split('\n').length : 0;
            const byteCount = data.output_bytes || outputText.length;
            outputMeta.innerText = `${lineCount} lines • ${byteCount} bytes`;

            // Timing Badge
            const wallTime = data.total_wall_time_ms ? data.total_wall_time_ms.toFixed(1) : '< 10';
            const numStages = data.num_stages || command.split('|').length;
            timingBadge.innerText = `✓ Finished in ${wallTime} ms (${numStages} Processes Reaped)`;

        } catch (err) {
            outputScreen.innerText = `Error: ${err.message}\nEnsure the Node.js server is running on http://localhost:5000`;
            timingBadge.innerText = 'Execution Failed';
        } finally {
            runBtn.disabled = false;
            runBtn.innerText = '▶ Run Pipeline';
        }
    }

    // 4. Render Horizontal Pipeline Flow Diagram
    function renderPipelineFlow(data) {
        if (!data || !data.stages || data.stages.length === 0) {
            viewport.innerHTML = `<span style="color:#64748b; font-family:monospace;">[Pipeline Idle]</span>`;
            return;
        }

        viewport.innerHTML = '';
        const chain = document.createElement('div');
        chain.className = 'pipeline-chain';

        data.stages.forEach((stage, idx) => {
            // Process Block
            const box = document.createElement('div');
            box.className = 'process-box';
            
            let badgeText = '';
            let badgeColor = '';

            if (stage.state === 'SIGNALED' || stage.signal === 13) {
                badgeText = 'SIGPIPE (Broken Pipe)';
                badgeColor = 'background:rgba(245,158,11,0.2); color:#f59e0b; border:1px solid #f59e0b;';
            } else if (stage.exit_code === 0) {
                badgeText = 'EXIT 0 (OK)';
                badgeColor = 'background:rgba(34,197,94,0.15); color:#22c55e; border:1px solid #22c55e;';
            } else {
                badgeText = `EXIT ${stage.exit_code}`;
                badgeColor = 'background:rgba(239,68,68,0.15); color:#ef4444; border:1px solid #ef4444;';
            }

            box.innerHTML = `
                <div class="process-box-header">
                    <span class="stage-num">Process ${idx + 1}</span>
                    <span class="pid-tag">PID ${stage.pid || 1000 + idx}</span>
                </div>
                <div class="process-box-body">
                    <div class="cmd-text">${stage.raw_command}</div>
                    <span class="status-badge" style="${badgeColor}">${badgeText}</span>
                </div>
            `;
            chain.appendChild(box);

            // Pipe Connector (between processes)
            if (idx < data.stages.length - 1) {
                const pipe = document.createElement('div');
                pipe.className = 'pipe-channel';
                pipe.innerHTML = `
                    <div class="pipe-title">Pipe ${idx + 1}</div>
                    <div class="pipe-bar">
                        <div class="pipe-flow"></div>
                    </div>
                    <div class="pipe-meta">Ring Buffer</div>
                `;
                chain.appendChild(pipe);
            }
        });

        viewport.appendChild(chain);
    }

    // Auto-run first example on page load
    runPipeline();
});
