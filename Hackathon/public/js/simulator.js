/**
 * ============================================================================
 * OPERATING SYSTEMS & SYSTEMS PROGRAMMING (OSSP)
 * Project: Multi-Process Command Pipeline System - Team 17
 * simulator.js: Interactive 7-phase step-by-step POSIX Pipeline Simulator
 * ============================================================================
 */

class PipelineSimulator {
    constructor() {
        this.currentStep = 0;
        this.isPlaying = false;
        this.timer = null;

        this.steps = [
            {
                title: "Phase 1: POSIX Pipe Allocation (pipe())",
                badge: "Kernel Buffer Setup",
                desc: "The parent process calls <code>pipe(pipes[i])</code> to create N-1 anonymous unidirectional pipe channels. The Linux kernel allocates an in-memory circular ring buffer (64 KB capacity) for each pipe and returns two file descriptors: <code>pipes[i][0]</code> for reading and <code>pipes[i][1]</code> for writing.",
                code: `// Allocate N - 1 pipes for N stages\nfor (int i = 0; i < num_stages - 1; i++) {\n    if (pipe(pipes[i]) < 0) {\n        perror("pipe allocation failed");\n        exit(EXIT_FAILURE);\n    }\n}`,
                status: "Pipes created in Kernel RAM: pipe[0] (FD 3, 4), pipe[1] (FD 5, 6)"
            },
            {
                title: "Phase 2: Concurrent Child Process Spawning (fork())",
                badge: "Process Creation",
                desc: "The parent process iterates through a loop calling <code>fork()</code> to clone N child processes concurrently. Each child receives its own independent virtual address space while inheriting the open file descriptor table from the parent.",
                code: `for (int i = 0; i < num_stages; i++) {\n    pid_t pid = fork();\n    if (pid == 0) {\n        // Running inside child process i context\n        child_stage_execution(i);\n    }\n    pids[i] = pid; // Parent records child PID\n}`,
                status: "All N processes are created and scheduled concurrently by the Linux scheduler."
            },
            {
                title: "Phase 3: File Descriptor Redirection (dup2())",
                badge: "I/O Redirection",
                desc: "Inside each child, <code>dup2(oldfd, newfd)</code> atomically overwrites file descriptors so standard I/O points to the pipes. Downstream processes redirect STDIN (FD 0) from the previous pipe's read end, and upstream processes redirect STDOUT (FD 1) to the next pipe's write end.",
                code: `// Child stage i redirection:\nif (i > 0) {\n    dup2(pipes[i - 1][0], STDIN_FILENO);  // Read from prior pipe\n}\nif (i < num_stages - 1) {\n    dup2(pipes[i][1], STDOUT_FILENO);    // Write to next pipe\n}`,
                status: "FD 0 and FD 1 rewired to pipe channels in each child process context."
            },
            {
                title: "Phase 4: File Descriptor Hygiene & Cleanup (close())",
                badge: "Deadlock Prevention",
                desc: "Crucial OS Principle: The parent AND all children close all pipe ends they do not use. If a write end remains open in any process, the consumer process will NEVER receive an EOF (End-of-File) condition on read(), hanging permanently in a deadlock!",
                code: `// Close ALL unneeded pipe descriptors in child and parent\nfor (int j = 0; j < num_stages - 1; j++) {\n    close(pipes[j][0]);\n    close(pipes[j][1]);\n}`,
                status: "All unused pipe descriptors closed across parent and children. Deadlocks prevented."
            },
            {
                title: "Phase 5: Executable Image Replacement (execvp())",
                badge: "Program Execution",
                desc: "Each child calls <code>execvp(command, argv)</code>. The Linux kernel loads the target executable into the process address space, replacing its code, stack, and heap. The redirected standard file descriptors (FD 0 and 1) survive execvp(), allowing the program to read and write through pipes transparently.",
                code: `execvp(stage->args[0], stage->args);\n// If execvp returns, an error occurred\nfprintf(stderr, "Command execution failed: %s\\n", strerror(errno));\n_exit(127);`,
                status: "Child processes transformed into target Linux binaries (cat, grep, sort, wc, etc.)."
            },
            {
                title: "Phase 6: Concurrent Kernel Stream Processing",
                badge: "Data Streaming",
                desc: "All stages execute simultaneously in parallel. Producer processes stream bytes into the pipe; consumer processes read concurrently. The Linux kernel handles flow control: if the 64 KB pipe buffer fills, the producer sleeps until the consumer reads, providing automated backpressure without locks.",
                code: `// Kernel ring buffer mechanics:\n// write(fd[1], buf, len) -> [ 64 KB Circular Kernel Buffer ] -> read(fd[0], buf, len)\n// Automatic non-busy wait via kernel wait queues`,
                status: "Data packets flowing concurrently through kernel ring buffers across CPU cores."
            },
            {
                title: "Phase 7: Process Harvesting & Reaping (waitpid())",
                badge: "Lifecycle Termination",
                desc: "The parent process waits for all child processes to terminate using <code>waitpid()</code>. This retrieves the exit status code ($?), inspects signals (e.g. SIGPIPE), collects CPU resource telemetry via <code>getrusage()</code>, and cleans up process table entries to prevent zombie processes (<defunct>).",
                code: `for (int i = 0; i < num_stages; i++) {\n    int status;\n    waitpid(pids[i], &status, 0);\n    int exit_code = WIFEXITED(status) ? WEXITSTATUS(status) : -1;\n}`,
                status: "All child processes reaped successfully. No zombies. Pipeline telemetry captured."
            }
        ];
    }

    init() {
        this.renderStep(0);
        this.bindEvents();
    }

    bindEvents() {
        const btnPrev = document.getElementById('sim-btn-prev');
        const btnNext = document.getElementById('sim-btn-next');
        const btnPlay = document.getElementById('sim-btn-play');
        const btnReset = document.getElementById('sim-btn-reset');

        if (btnPrev) btnPrev.addEventListener('click', () => this.prevStep());
        if (btnNext) btnNext.addEventListener('click', () => this.nextStep());
        if (btnPlay) btnPlay.addEventListener('click', () => this.togglePlay());
        if (btnReset) btnReset.addEventListener('click', () => this.renderStep(0));
    }

    renderStep(stepIdx) {
        if (stepIdx < 0) stepIdx = 0;
        if (stepIdx >= this.steps.length) stepIdx = this.steps.length - 1;
        this.currentStep = stepIdx;

        const data = this.steps[stepIdx];

        const titleEl = document.getElementById('sim-title');
        const badgeEl = document.getElementById('sim-badge');
        const descEl = document.getElementById('sim-desc');
        const codeEl = document.getElementById('sim-code');
        const statusEl = document.getElementById('sim-status');
        const counterEl = document.getElementById('sim-step-counter');

        if (titleEl) titleEl.innerText = data.title;
        if (badgeEl) badgeEl.innerText = data.badge;
        if (descEl) descEl.innerHTML = data.desc;
        if (codeEl) codeEl.innerText = data.code;
        if (statusEl) statusEl.innerHTML = `<strong>System State:</strong> ${data.status}`;
        if (counterEl) counterEl.innerText = `Phase ${stepIdx + 1} of ${this.steps.length}`;

        // Update progress circles
        const circles = document.querySelectorAll('.step-circle');
        circles.forEach((circle, idx) => {
            circle.classList.remove('active', 'completed');
            if (idx === stepIdx) {
                circle.classList.add('active');
            } else if (idx < stepIdx) {
                circle.classList.add('completed');
            }
        });
    }

    nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            this.renderStep(this.currentStep + 1);
        } else {
            this.stopPlay();
        }
    }

    prevStep() {
        if (this.currentStep > 0) {
            this.renderStep(this.currentStep - 1);
        }
    }

    togglePlay() {
        if (this.isPlaying) {
            this.stopPlay();
        } else {
            this.startPlay();
        }
    }

    startPlay() {
        this.isPlaying = true;
        const playBtn = document.getElementById('sim-btn-play');
        if (playBtn) playBtn.innerHTML = '⏸ Pause Auto-Play';

        if (this.currentStep >= this.steps.length - 1) {
            this.renderStep(0);
        }

        this.timer = setInterval(() => {
            if (this.currentStep < this.steps.length - 1) {
                this.nextStep();
            } else {
                this.stopPlay();
            }
        }, 3200);
    }

    stopPlay() {
        this.isPlaying = false;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        const playBtn = document.getElementById('sim-btn-play');
        if (playBtn) playBtn.innerHTML = '▶ Auto-Play Simulation';
    }
}

window.PipelineSimulator = PipelineSimulator;
