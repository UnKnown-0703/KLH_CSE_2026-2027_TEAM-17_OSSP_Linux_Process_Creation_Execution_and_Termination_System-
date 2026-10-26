/**
 * ============================================================================
 * OPERATING SYSTEMS & SYSTEMS PROGRAMMING (OSSP)
 * Project: Multi-Process Command Pipeline System - Team 17
 * code_viewer.js: C source code inspector with annotations and system call jumps
 * ============================================================================
 */

class CCodeViewer {
    constructor() {
        this.codeData = {};
        this.currentFile = 'pipeline_engine.c';
        this.editorEl = document.getElementById('code-editor-area');
        this.fileListEl = document.getElementById('code-file-list');
    }

    async init() {
        try {
            const res = await fetch('/api/c-code');
            this.codeData = await res.json();
            this.renderFileList();
            this.showFile('pipeline_engine.c');
            this.bindAnnotationButtons();
        } catch (e) {
            console.error('Failed to load C code files:', e);
            if (this.editorEl) {
                this.editorEl.innerText = '// Error loading C source code from backend.\n// Ensure Node server is running on http://localhost:5000';
            }
        }
    }

    renderFileList() {
        if (!this.fileListEl) return;
        this.fileListEl.innerHTML = '';

        Object.keys(this.codeData).forEach(fileName => {
            const btn = document.createElement('button');
            btn.className = `code-file-btn ${fileName === this.currentFile ? 'active' : ''}`;
            btn.innerText = `📄 ${fileName}`;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.code-file-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.showFile(fileName);
            });
            this.fileListEl.appendChild(btn);
        });
    }

    showFile(fileName) {
        this.currentFile = fileName;
        if (!this.editorEl) return;

        const rawCode = this.codeData[fileName] || '// File not found';
        const lines = rawCode.split('\n');

        let formatted = '';
        lines.forEach((line, idx) => {
            const lineNum = String(idx + 1).padStart(4, ' ');
            formatted += `${lineNum} | ${line}\n`;
        });

        this.editorEl.innerText = formatted;
        this.editorEl.scrollTop = 0;
    }

    bindAnnotationButtons() {
        const calls = [
            { id: 'jump-pipe', query: 'pipe(pipe_fds', file: 'pipeline_engine.c' },
            { id: 'jump-fork', query: 'pid_t pid = fork()', file: 'pipeline_engine.c' },
            { id: 'jump-dup2', query: 'dup2(', file: 'pipeline_engine.c' },
            { id: 'jump-close', query: 'close(pipe_fds', file: 'pipeline_engine.c' },
            { id: 'jump-execvp', query: 'execvp(', file: 'pipeline_engine.c' },
            { id: 'jump-waitpid', query: 'waitpid(', file: 'pipeline_engine.c' }
        ];

        calls.forEach(item => {
            const btn = document.getElementById(item.id);
            if (btn) {
                btn.addEventListener('click', () => {
                    this.showFile(item.file);
                    document.querySelectorAll('.code-file-btn').forEach(b => {
                        b.classList.toggle('active', b.innerText.includes(item.file));
                    });
                    this.scrollToTerm(item.query);
                });
            }
        });
    }

    scrollToTerm(term) {
        if (!this.editorEl) return;
        const text = this.editorEl.innerText;
        const index = text.indexOf(term);
        if (index !== -1) {
            const linesBefore = text.substring(0, index).split('\n').length;
            const approxLineHeight = 22;
            this.editorEl.scrollTop = Math.max(0, (linesBefore - 5) * approxLineHeight);
        }
    }
}

window.CCodeViewer = CCodeViewer;
