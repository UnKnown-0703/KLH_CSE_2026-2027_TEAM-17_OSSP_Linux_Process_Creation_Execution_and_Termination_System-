/**
 * ============================================================================
 * KLH UNIVERSITY - TEAM 17 OSSP (25CS2104E)
 * app.js - Main Client Application Controller (Zero Python)
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // Application State
    const state = {
        currentScenario: 'normal',
        currentStep: 0,
        autoPlayTimer: null,
        isAutoPlaying: false,
        sourceCodeCache: {},
        eventLogs: [],
        serverStatus: null
    };

    // Step definitions for Step-by-Step Walkthrough
    const stepsData = [
        {
            phase: 'PHASE 1: INITIALIZATION',
            title: 'Parent Process Running in User Space',
            explanation: 'The initial parent process is executing in Linux user space. It calls getpid() and getppid() to inspect its process identity in the kernel task table.',
            syscall: 'pid_t parent = getpid(); /* returns current PID */\npid_t ppid = getppid();   /* returns parent shell PID */',
            parentState: 'RUNNING',
            childState: 'IDLE',
            parentPid: 1024,
            parentPpid: 1000,
            childPid: null,
            childPpid: null
        },
        {
            phase: 'PHASE 2: PROCESS CREATION (fork)',
            title: 'fork() System Call Initiated',
            explanation: 'The parent invokes fork(). The Linux kernel creates a new task_struct duplicating the parent\'s PCB, file descriptor table, and memory mappings with Copy-On-Write (COW).',
            syscall: 'pid_t pid = fork();\n/* Fork system call duplicates calling process */',
            parentState: 'RUNNING',
            childState: 'NEW',
            parentPid: 1024,
            parentPpid: 1000,
            childPid: 1025,
            childPpid: 1024
        },
        {
            phase: 'PHASE 3: BRANCHING LOGIC',
            title: 'Evaluating fork() Return Value',
            explanation: 'In the child process, fork() returns 0. In the parent process, fork() returns the child\'s PID (1025). This allows both processes to execute distinct code paths.',
            syscall: 'if (pid == 0) {\n    /* Child branch: pid is 0 */\n} else {\n    /* Parent branch: pid is 1025 (> 0) */\n}',
            parentState: 'RUNNING',
            childState: 'READY',
            parentPid: 1024,
            parentPpid: 1000,
            childPid: 1025,
            childPpid: 1024
        },
        {
            phase: 'PHASE 4: PROGRAM EXECUTION (exec)',
            title: 'execvp() Replaces Child Image',
            explanation: 'The child process calls execvp("ls", argv). The Linux kernel completely wipes the child\'s old address space (Text, Data, Heap, Stack) and loads the new ELF executable image.',
            syscall: 'char *argv[] = {"ls", "-la", NULL};\nexecvp("ls", argv);\n/* If execvp succeeds, this never returns! */',
            parentState: 'RUNNING',
            childState: 'RUNNING',
            parentPid: 1024,
            parentPpid: 1000,
            childPid: 1025,
            childPpid: 1024
        },
        {
            phase: 'PHASE 5: SYNCHRONIZATION (waitpid)',
            title: 'Parent Enters Blocking Wait State',
            explanation: 'The parent process invokes waitpid(1025, &status, 0). The Linux scheduler suspends the parent process, placing it in the WAITING queue until child completes.',
            syscall: 'int status;\nwaitpid(child_pid, &status, 0);\n/* Parent process blocked until child exits */',
            parentState: 'WAITING',
            childState: 'RUNNING',
            parentPid: 1024,
            parentPpid: 1000,
            childPid: 1025,
            childPpid: 1024
        },
        {
            phase: 'PHASE 6: TERMINATION & ZOMBIE WINDOW',
            title: 'Child Calls exit() and Enters Zombie State',
            explanation: 'The child process completes its execution and calls exit(0). Its virtual memory pages and file descriptors are closed, but its task_struct remains as a ZOMBIE until parent harvests it.',
            syscall: 'exit(0); /* Child exits. PCB held in kernel process table */\n/* State in /proc/<pid>/status is: Z (zombie) */',
            parentState: 'WAITING',
            childState: 'ZOMBIE (defunct)',
            parentPid: 1024,
            parentPpid: 1000,
            childPid: 1025,
            childPpid: 1024
        },
        {
            phase: 'PHASE 7: HARVEST & CLEANUP',
            title: 'Parent Reaps Status and Unlinks PCB',
            explanation: 'Parent wakes up. The kernel supplies the exit status (WIFEXITED=true, exit code=0). The zombie PCB is deleted from the kernel table and resources are completely cleaned up.',
            syscall: 'if (WIFEXITED(status)) {\n    int code = WEXITSTATUS(status); /* code = 0 */\n}',
            parentState: 'RUNNING',
            childState: 'TERMINATED',
            parentPid: 1024,
            parentPpid: 1000,
            childPid: 1025,
            childPpid: 1024
        }
    ];

    // Initialize UI Elements
    initTabs();
    initScenarioCards();
    initTerminalControls();
    initStepByStepWalkthrough();
    initCodeViewer();
    initReportModal();
    initSystemStatus();

    // Initial Tree Render
    Diagrams.renderProcessTree('processTreeContainer', {
        parentPid: 524,
        parentPpid: 523,
        parentState: 'READY',
        childPid: '--',
        childPpid: '--',
        childState: 'IDLE',
        scenario: 'normal'
    });

    /**
     * Tab Navigation System
     */
    function initTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabPanels = document.querySelectorAll('.tab-panel');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');

                tabBtns.forEach(b => b.classList.remove('active'));
                tabPanels.forEach(p => p.classList.remove('active'));

                btn.classList.add('active');
                const activePanel = document.getElementById(targetTab);
                if (activePanel) activePanel.classList.add('active');

                // If switching to Step-by-Step, re-render diagram
                if (targetTab === 'stepByStepTab') {
                    updateStepView(state.currentStep);
                } else if (targetTab === 'dashboardTab') {
                    Diagrams.renderProcessTree('processTreeContainer');
                }
            });
        });

        // PCB vs Memory view toggle
        const pcbBtn = document.getElementById('viewPcbBtn');
        const memBtn = document.getElementById('viewMemBtn');
        const pcbView = document.getElementById('pcbViewContainer');
        const memView = document.getElementById('memViewContainer');

        if (pcbBtn && memBtn) {
            pcbBtn.addEventListener('click', () => {
                pcbBtn.classList.add('active');
                memBtn.classList.remove('active');
                pcbView.style.display = 'block';
                memView.style.display = 'none';
            });

            memBtn.addEventListener('click', () => {
                memBtn.classList.add('active');
                pcbBtn.classList.remove('active');
                pcbView.style.display = 'none';
                memView.style.display = 'block';
            });
        }
    }

    /**
     * Scenario Cards and Execution Trigger
     */
    function initScenarioCards() {
        const cards = document.querySelectorAll('.scenario-card');
        const runBtns = document.querySelectorAll('.run-scenario-btn');
        const customBar = document.getElementById('customCommandBar');
        const executeCustomBtn = document.getElementById('executeCustomBtn');
        const customInput = document.getElementById('customCommandInput');
        const presetChips = document.querySelectorAll('.chip-btn');

        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.tagName.toLowerCase() === 'button') return;
                const scenario = card.getAttribute('data-scenario');
                selectScenario(scenario);
            });
        });

        runBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const scenario = btn.getAttribute('data-scenario');
                selectScenario(scenario);
                executeScenario(scenario);
            });
        });

        function selectScenario(scenario) {
            state.currentScenario = scenario;
            cards.forEach(c => {
                if (c.getAttribute('data-scenario') === scenario) {
                    c.classList.add('active');
                } else {
                    c.classList.remove('active');
                }
            });

            if (scenario === 'custom') {
                customBar.style.display = 'flex';
            }
        }

        presetChips.forEach(chip => {
            chip.addEventListener('click', () => {
                customInput.value = chip.getAttribute('data-cmd');
                executeScenario('custom', customInput.value);
            });
        });

        if (executeCustomBtn) {
            executeCustomBtn.addEventListener('click', () => {
                executeScenario('custom', customInput.value);
            });
        }

        if (customInput) {
            customInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    executeScenario('custom', customInput.value);
                }
            });
        }
    }

    /**
     * Execute Scenario via Backend API (/api/run)
     */
    async function executeScenario(scenario, customCmd = '') {
        logToTerminal(`linux-process-system:~$ Running scenario [${scenario}]${customCmd ? ' with command "' + customCmd + '"' : ''}...`, 'prompt');

        // Show running indicator
        const treeIndicator = document.getElementById('treeLiveIndicator');
        if (treeIndicator) {
            treeIndicator.textContent = 'Executing...';
            treeIndicator.style.background = 'rgba(245, 158, 11, 0.2)';
            treeIndicator.style.color = '#f59e0b';
        }

        try {
            const response = await fetch('/api/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scenario,
                    customCmd: customCmd || (scenario === 'custom' ? document.getElementById('customCommandInput').value : ''),
                    jsonMode: true
                })
            });

            const data = await response.json();

            if (!data.success && data.error) {
                logToTerminal(`Error: ${data.error}`, 'error');
                return;
            }

            // Process and animate event list
            if (data.events && data.events.length > 0) {
                await playEventSequence(data.events, scenario, data.commandOutput);
            } else if (data.rawOutput) {
                // If raw output without json
                logToTerminal(data.rawOutput, 'stdout');
            }

            logToTerminal(`✔ Scenario [${scenario}] completed in ${data.durationMs}ms with Exit Code: ${data.exitCode}`, 'success');

        } catch (err) {
            logToTerminal(`Execution Error: ${err.message}`, 'error');
        } finally {
            if (treeIndicator) {
                treeIndicator.textContent = 'Completed';
                treeIndicator.style.background = 'rgba(16, 185, 129, 0.2)';
                treeIndicator.style.color = '#10b981';
            }
        }
    }

    /**
     * Animate Events Sequentially in Terminal & Process Tree
     */
    async function playEventSequence(events, scenario, commandOutput) {
        let parentPid = 0;
        let parentPpid = 0;
        let childPid = 0;
        let childPpid = 0;

        for (let i = 0; i < events.length; i++) {
            const ev = events[i];
            state.eventLogs.push(ev);

            // Print event line in terminal
            const formattedLine = `[${ev.time}] ${ev.syscall.padEnd(16)} [${ev.phase.padEnd(14)}] (PID: ${ev.pid} | PPID: ${ev.ppid}) [${ev.state}] ${ev.message}`;
            logToTerminal(formattedLine, 'event');

            // Add row to Audit Table
            addAuditTableRow(ev);

            // Extract PIDs
            if (i === 0) {
                parentPid = ev.pid;
                parentPpid = ev.ppid;
            }

            if (ev.syscall.includes('fork() -> child_pid') || ev.phase === 'CREATION') {
                const match = ev.message.match(/PID (\d+)/);
                if (match) childPid = parseInt(match[1]);
            } else if (ev.syscall.includes('fork() -> 0')) {
                childPid = ev.pid;
                childPpid = ev.ppid;
            }

            // Update PCB table in UI
            updatePcbDisplay(ev, parentPid, parentPpid, childPid, childPpid);

            // Update Dynamic SVG Tree
            let parentState = 'RUNNING';
            let childState = 'READY';

            if (ev.phase === 'SYNCHRONIZATION' && ev.syscall === 'waitpid()') {
                parentState = 'WAITING';
            }
            if (ev.phase === 'ZOMBIE_DEMO' && ev.syscall === 'parent_sleep') {
                parentState = 'SLEEPING';
            }
            if (ev.phase === 'ZOMBIE_DEMO' && ev.state.includes('ZOMBIE')) {
                childState = 'ZOMBIE (defunct)';
            }
            if (ev.phase === 'ORPHAN_DEMO' && ev.syscall === 'parent_early_exit') {
                parentState = 'TERMINATED';
            }
            if (ev.phase === 'ORPHAN_DEMO' && ev.syscall === 'reparented') {
                childState = 'ORPHAN';
                childPpid = ev.ppid; // Adopted PPID (1 or subreaper)
            }
            if (ev.phase === 'TERMINATION' || ev.state === 'TERMINATED') {
                childState = 'TERMINATED';
            }

            Diagrams.renderProcessTree('processTreeContainer', {
                parentPid: parentPid || ev.pid,
                parentPpid: parentPpid || ev.ppid,
                parentState,
                childPid: childPid || '--',
                childPpid: childPpid || parentPid || '--',
                childState,
                scenario
            });

            // Small delay for visual pacing
            await new Promise(r => setTimeout(r, 120));
        }

        // Print command stdout if any
        if (commandOutput) {
            logToTerminal('\n--- Program Output (stdout) ---\n' + commandOutput + '\n------------------------------', 'stdout');
        }
    }

    /**
     * Update PCB Display Table
     */
    function updatePcbDisplay(ev, pPid, pPpid, cPid, cPpid) {
        const parentPidEl = document.getElementById('parentPidVal');
        const parentPpidEl = document.getElementById('parentPpidVal');
        const parentStateEl = document.getElementById('parentStateVal');
        const childPidEl = document.getElementById('childPidVal');
        const childPpidEl = document.getElementById('childPpidVal');
        const childStateEl = document.getElementById('childStateVal');
        const childExitEl = document.getElementById('childExitVal');
        const childExecEl = document.getElementById('childExecVal');

        if (pPid && parentPidEl) parentPidEl.textContent = pPid;
        if (pPpid && parentPpidEl) parentPpidEl.textContent = pPpid;
        if (cPid && childPidEl) childPidEl.textContent = cPid;
        if (cPpid && childPpidEl) childPpidEl.textContent = cPpid;

        if (ev.syscall.includes('execvp')) {
            if (childExecEl) childExecEl.textContent = 'Yes (/bin/ls loaded)';
        }

        if (ev.syscall.includes('WIFEXITED')) {
            const match = ev.message.match(/exit code (\d+)/);
            if (match && childExitEl) childExitEl.textContent = `0 (Normal exit)`;
        } else if (ev.syscall.includes('WIFSIGNALED')) {
            if (childExitEl) childExitEl.textContent = `Killed (SIGKILL 9)`;
        }

        if (ev.pid === pPid && parentStateEl) {
            parentStateEl.innerHTML = `<span class="state-badge ${ev.state.toLowerCase().split(' ')[0]}">${ev.state}</span>`;
        } else if (childStateEl) {
            childStateEl.innerHTML = `<span class="state-badge ${ev.state.toLowerCase().split(' ')[0]}">${ev.state}</span>`;
        }
    }

    /**
     * Add Row to Audit Table
     */
    function addAuditTableRow(ev) {
        const tbody = document.getElementById('auditTableBody');
        const empty = tbody.querySelector('.empty-state');
        if (empty) tbody.innerHTML = '';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${ev.time}</td>
            <td class="code-cell">${ev.syscall}</td>
            <td><span class="badge badge-blue">${ev.phase}</span></td>
            <td>${ev.pid}</td>
            <td>${ev.ppid}</td>
            <td><span class="state-badge ${ev.state.toLowerCase().split(' ')[0]}">${ev.state}</span></td>
            <td>${ev.message}</td>
        `;
        tbody.prepend(tr);

        // Update badge
        const badge = document.getElementById('eventCountBadge');
        if (badge) {
            badge.textContent = `${state.eventLogs.length} events`;
        }
    }

    /**
     * Terminal Helper
     */
    function logToTerminal(text, type = 'info') {
        const term = document.getElementById('terminalOutput');
        if (!term) return;

        const div = document.createElement('div');
        div.className = `term-line ${type}`;
        div.textContent = text;
        term.appendChild(div);
        term.scrollTop = term.scrollHeight;
    }

    function initTerminalControls() {
        const clearBtn = document.getElementById('clearTerminalBtn');
        const copyBtn = document.getElementById('copyLogsBtn');
        const term = document.getElementById('terminalOutput');

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                term.innerHTML = '<div class="term-line info">Terminal cleared.</div>';
            });
        }

        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(term.innerText).then(() => {
                    copyBtn.textContent = 'Copied!';
                    setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
                });
            });
        }
    }

    /**
     * Step-by-Step Walkthrough Engine
     */
    function initStepByStepWalkthrough() {
        const prevBtn = document.getElementById('stepPrevBtn');
        const nextBtn = document.getElementById('stepNextBtn');
        const autoPlayBtn = document.getElementById('stepAutoPlayBtn');
        const resetBtn = document.getElementById('stepResetBtn');
        const indicators = document.querySelectorAll('.step-indicator');

        indicators.forEach(ind => {
            ind.addEventListener('click', () => {
                const step = parseInt(ind.getAttribute('data-step'));
                goToStep(step);
            });
        });

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (state.currentStep > 0) goToStep(state.currentStep - 1);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (state.currentStep < stepsData.length - 1) goToStep(state.currentStep + 1);
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                stopAutoPlay();
                goToStep(0);
            });
        }

        if (autoPlayBtn) {
            autoPlayBtn.addEventListener('click', () => {
                if (state.isAutoPlaying) {
                    stopAutoPlay();
                } else {
                    startAutoPlay();
                }
            });
        }

        function startAutoPlay() {
            state.isAutoPlaying = true;
            autoPlayBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                Pause
            `;
            state.autoPlayTimer = setInterval(() => {
                if (state.currentStep < stepsData.length - 1) {
                    goToStep(state.currentStep + 1);
                } else {
                    stopAutoPlay();
                }
            }, 2000);
        }

        function stopAutoPlay() {
            state.isAutoPlaying = false;
            clearInterval(state.autoPlayTimer);
            if (autoPlayBtn) {
                autoPlayBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    Auto Play
                `;
            }
        }

        function goToStep(stepIndex) {
            state.currentStep = stepIndex;
            updateStepView(stepIndex);

            // Button states
            if (prevBtn) prevBtn.disabled = stepIndex === 0;
            if (nextBtn) nextBtn.disabled = stepIndex === stepsData.length - 1;

            // Indicator active class
            indicators.forEach(ind => {
                const s = parseInt(ind.getAttribute('data-step'));
                if (s === stepIndex) ind.classList.add('active');
                else ind.classList.remove('active');
            });
        }

        // Initialize at Step 0
        updateStepView(0);
    }

    function updateStepView(stepIndex) {
        const step = stepsData[stepIndex];
        if (!step) return;

        const badge = document.getElementById('stepPhaseBadge');
        const title = document.getElementById('stepTitle');
        const explanation = document.getElementById('stepExplanation');
        const syscall = document.getElementById('stepSyscall');

        if (badge) badge.textContent = step.phase;
        if (title) title.textContent = step.title;
        if (explanation) explanation.textContent = step.explanation;
        if (syscall) syscall.textContent = step.syscall;

        Diagrams.renderStepDiagram(stepIndex);
    }

    /**
     * Source Code Viewer Tab
     */
    async function initCodeViewer() {
        const fileItems = document.querySelectorAll('.code-file-item');
        const codeBlock = document.getElementById('codeViewerContent');
        const fileNameEl = document.getElementById('currentFileName');
        const fileAuthorEl = document.getElementById('currentFileAuthor');
        const copyBtn = document.getElementById('copyCodeBtn');

        try {
            const res = await fetch('/api/code');
            const data = await res.json();
            if (data.success && data.files) {
                state.sourceCodeCache = data.files;
                // Display creation module by default
                showFileCode('creation');
            }
        } catch (err) {
            if (codeBlock) codeBlock.textContent = '// Failed to load source code from server: ' + err.message;
        }

        fileItems.forEach(item => {
            item.addEventListener('click', () => {
                fileItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                const fileKey = item.getAttribute('data-file');
                showFileCode(fileKey);
            });
        });

        function showFileCode(key) {
            const file = state.sourceCodeCache[key];
            if (!file) return;

            if (fileNameEl) fileNameEl.textContent = file.name;
            if (fileAuthorEl) fileAuthorEl.textContent = `${file.author}`;
            if (codeBlock) codeBlock.textContent = file.code;
        }

        if (copyBtn && codeBlock) {
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(codeBlock.textContent).then(() => {
                    copyBtn.textContent = 'Copied!';
                    setTimeout(() => { copyBtn.textContent = 'Copy Code'; }, 1500);
                });
            });
        }
    }

    /**
     * Report Modal & PDF Export
     */
    function initReportModal() {
        const modal = document.getElementById('reportModal');
        const exportBtn = document.getElementById('exportReportBtn');
        const closeBtn1 = document.getElementById('closeReportModalBtn');
        const closeBtn2 = document.getElementById('closeReportBtn2');
        const printBtn = document.getElementById('printReportBtn');
        const auditArea = document.getElementById('reportAuditSummary');

        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                // Populate report audit summary
                if (auditArea) {
                    if (state.eventLogs.length === 0) {
                        auditArea.innerHTML = '<p><em>No scenario executed yet in current session. Execute a scenario to capture system call traces.</em></p>';
                    } else {
                        let html = `
                        <p><strong>Recent Execution Scenario:</strong> ${state.currentScenario.toUpperCase()}</p>
                        <table class="report-table">
                            <thead>
                                <tr><th>Time</th><th>System Call</th><th>Phase</th><th>PID</th><th>PPID</th><th>State</th><th>Message</th></tr>
                            </thead>
                            <tbody>
                        `;
                        state.eventLogs.slice(-10).forEach(ev => {
                            html += `<tr>
                                <td>${ev.time}</td>
                                <td><code>${ev.syscall}</code></td>
                                <td>${ev.phase}</td>
                                <td>${ev.pid}</td>
                                <td>${ev.ppid}</td>
                                <td>${ev.state}</td>
                                <td>${ev.message}</td>
                            </tr>`;
                        });
                        html += '</tbody></table>';
                        auditArea.innerHTML = html;
                    }
                }
                modal.classList.add('open');
            });
        }

        const closeModal = () => modal.classList.remove('open');
        if (closeBtn1) closeBtn1.addEventListener('click', closeModal);
        if (closeBtn2) closeBtn2.addEventListener('click', closeModal);

        if (printBtn) {
            printBtn.addEventListener('click', () => {
                window.print();
            });
        }
    }

    /**
     * Fetch System Status from /api/status & Compilation handler
     */
    async function initSystemStatus() {
        const statusText = document.getElementById('statusText');
        const systemMeta = document.getElementById('systemMeta');
        const recompileBtn = document.getElementById('recompileBtn');

        try {
            const res = await fetch('/api/status');
            const data = await res.json();
            state.serverStatus = data;

            if (statusText) {
                statusText.textContent = data.isWSL ? 'Linux WSL Active' : 'Native Environment';
            }
            if (systemMeta) {
                systemMeta.textContent = `${data.gccVersion.split(' ')[0]} ${data.gccVersion.split(' ')[1] || ''} | ${data.server}`;
            }

            logToTerminal(`Connected to backend: ${data.server} (${data.nodeVersion}) | Compiler: ${data.gccVersion}`, 'success');
        } catch (err) {
            if (statusText) statusText.textContent = 'Simulator Mode (Offline)';
            if (systemMeta) systemMeta.textContent = 'Direct Browser Execution';
            logToTerminal('Note: Running in Client Simulator Mode (Backend offline).', 'warn');
        }

        if (recompileBtn) {
            recompileBtn.addEventListener('click', async () => {
                recompileBtn.disabled = true;
                recompileBtn.querySelector('span').textContent = 'Compiling...';
                logToTerminal('Initiating GCC compilation via WSL...', 'prompt');

                try {
                    const res = await fetch('/api/compile', { method: 'POST' });
                    const result = await res.json();

                    if (result.success) {
                        logToTerminal('✔ Compilation Successful! Binary updated at bin/process_system.', 'success');
                    } else {
                        logToTerminal('✖ Compilation Failed:\n' + result.output, 'error');
                    }
                } catch (err) {
                    logToTerminal('Compilation Error: ' + err.message, 'error');
                } finally {
                    recompileBtn.disabled = false;
                    recompileBtn.querySelector('span').textContent = 'Compile GCC';
                }
            });
        }
    }
});
