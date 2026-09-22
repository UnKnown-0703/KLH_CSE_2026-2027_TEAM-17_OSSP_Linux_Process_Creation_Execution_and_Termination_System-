/**
 * ============================================================================
 * OPERATING SYSTEMS AND SYSTEMS PROGRAMMING
 * Project: Linux Process Creation, Execution and Termination System
 * ============================================================================
 * server.js - Pure Node.js Web Server (Zero external npm packages, NO Python)
 * ============================================================================
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const url = require('url');

const PORT = process.env.PORT || 8000;
const PROJECT_ROOT = __dirname;
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
const C_SRC_DIR = path.join(PROJECT_ROOT, 'c_src');
const BIN_DIR = path.join(PROJECT_ROOT, 'bin');

// MIME types table
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8',
    '.pdf': 'application/pdf'
};

/**
 * Execute command with promise
 */
function runCommand(command, cwd = PROJECT_ROOT) {
    return new Promise((resolve) => {
        exec(command, { cwd, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
            resolve({
                code: error ? (error.code || 1) : 0,
                stdout: stdout || '',
                stderr: stderr || '',
                error: error ? error.message : null
            });
        });
    });
}

/**
 * Helper to get WSL execution command
 */
function getWSLCommand(innerCmd) {
    return `wsl --cd "${PROJECT_ROOT.replace(/\\/g, '\\\\')}" ${innerCmd}`;
}

/**
 * API Handlers
 */
async function handleSystemStatus(req, res) {
    const wslCheck = await runCommand('wsl uname -a');
    const isWSL = wslCheck.code === 0;

    let gccVersion = 'Not found';
    let kernelInfo = 'Unknown';

    if (isWSL) {
        kernelInfo = wslCheck.stdout.trim();
        const gccCheck = await runCommand(getWSLCommand('gcc --version'));
        if (gccCheck.code === 0) {
            gccVersion = gccCheck.stdout.split('\n')[0].trim();
        }
    } else {
        const nativeGcc = await runCommand('gcc --version');
        if (nativeGcc.code === 0) {
            gccVersion = nativeGcc.stdout.split('\n')[0].trim();
        }
    }

    const binaryExists = fs.existsSync(path.join(BIN_DIR, 'process_system')) ||
                         fs.existsSync(path.join(BIN_DIR, 'process_system.exe'));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        status: 'online',
        server: 'Node.js (No Python)',
        nodeVersion: process.version,
        platform: process.platform,
        isWSL,
        kernelInfo,
        gccVersion,
        binaryReady: binaryExists,
        team: {
            title: 'Linux Process Creation, Execution and Termination System',
            course: 'OPERATING SYSTEMS AND SYSTEMS PROGRAMMING',
            modules: [
                { module: 'Module 1', name: 'Process Creation & Execution', calls: 'fork(), execvp()' },
                { module: 'Module 2', name: 'Process Synchronization & Termination', calls: 'wait(), waitpid(), exit()' },
                { module: 'Module 3', name: 'Process Identification & Anomaly Simulation', calls: 'getpid(), getppid(), /proc' }
            ]
        }
    }));
}

async function handleCompile(req, res) {
    const compileCmd = getWSLCommand(
        'gcc -Wall -Wextra -O2 -g c_src/main.c c_src/module_creation.c c_src/module_sync.c c_src/module_monitor.c -o bin/process_system'
    );
    const result = await runCommand(compileCmd);

    res.writeHead(result.code === 0 ? 200 : 400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        success: result.code === 0,
        output: result.stdout + (result.stderr ? '\n' + result.stderr : ''),
        error: result.error
    }));
}

async function handleRun(req, res, postData) {
    try {
        const body = JSON.parse(postData || '{}');
        const scenario = body.scenario || 'normal';
        const customCmd = (body.customCmd || '').trim();
        const jsonMode = body.jsonMode !== false; // default true
        const signalNum = body.signalNum || 9;

        // Ensure binary exists
        const binaryPath = path.join(BIN_DIR, 'process_system');
        if (!fs.existsSync(binaryPath)) {
            await runCommand(getWSLCommand(
                'gcc -Wall -Wextra -O2 c_src/main.c c_src/module_creation.c c_src/module_sync.c c_src/module_monitor.c -o bin/process_system'
            ));
        }

        let execCmd = `./bin/process_system ${jsonMode ? '--json ' : ''}${scenario}`;

        if (scenario === 'signal') {
            execCmd += ` ${signalNum}`;
        } else if (scenario === 'custom' && customCmd) {
            execCmd += ` ${customCmd}`;
        } else if (scenario === 'normal' && customCmd) {
            execCmd += ` ${customCmd}`;
        }

        const fullWSLCmd = getWSLCommand(execCmd);
        const startTime = Date.now();
        const result = await runCommand(fullWSLCmd);
        const durationMs = Date.now() - startTime;

        const events = [];
        const rawLines = result.stdout.split('\n');
        let unparsedOutput = '';

        for (const line of rawLines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                try {
                    const parsed = JSON.parse(trimmed);
                    if (parsed.type === 'event') {
                        events.push(parsed);
                        continue;
                    }
                } catch (e) {
                    // Not valid JSON, treat as output
                }
            }
            unparsedOutput += line + '\n';
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: result.code === 0,
            exitCode: result.code,
            durationMs,
            scenario,
            events,
            rawOutput: result.stdout,
            commandOutput: unparsedOutput.trim(),
            stderr: result.stderr
        }));
    } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
    }
}

function handleGetCode(req, res) {
    try {
        const files = {
            header: {
                name: 'process_lifecycle.h',
                title: 'Common Header & Definitions',
                author: 'System Specification',
                code: fs.readFileSync(path.join(C_SRC_DIR, 'process_lifecycle.h'), 'utf-8')
            },
            creation: {
                name: 'module_creation.c',
                title: 'Process Creation & Execution',
                author: 'Module: Process Creation & Execution',
                code: fs.readFileSync(path.join(C_SRC_DIR, 'module_creation.c'), 'utf-8')
            },
            sync: {
                name: 'module_sync.c',
                title: 'Process Synchronization & Termination',
                author: 'Module: Synchronization & Termination',
                code: fs.readFileSync(path.join(C_SRC_DIR, 'module_sync.c'), 'utf-8')
            },
            monitor: {
                name: 'module_monitor.c',
                title: 'Process Identification & Anomaly Simulation',
                author: 'Module: Identification & Monitoring',
                code: fs.readFileSync(path.join(C_SRC_DIR, 'module_monitor.c'), 'utf-8')
            },
            main: {
                name: 'main.c',
                title: 'CLI Driver & Central Event Emitter',
                author: 'Module: CLI Driver & Dispatcher',
                code: fs.readFileSync(path.join(C_SRC_DIR, 'main.c'), 'utf-8')
            }
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, files }));
    } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
    }
}

/**
 * Static file server
 */
function serveStaticFile(req, res, pathname) {
    let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

    // Prevent directory traversal
    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            // Check if file in root (like PDF)
            const rootFile = path.join(PROJECT_ROOT, pathname);
            if (fs.existsSync(rootFile) && fs.statSync(rootFile).isFile()) {
                const ext = path.extname(rootFile).toLowerCase();
                res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
                fs.createReadStream(rootFile).pipe(res);
                return;
            }

            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<h1>404 Not Found</h1><p>Requested file does not exist.</p>');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
    });
}

/**
 * Main HTTP Server
 */
const server = http.createServer((req, res) => {
    // CORS headers for local lab development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    if (req.method === 'GET' && pathname === '/api/status') {
        handleSystemStatus(req, res);
    } else if (req.method === 'POST' && pathname === '/api/compile') {
        handleCompile(req, res);
    } else if (req.method === 'GET' && pathname === '/api/code') {
        handleGetCode(req, res);
    } else if (req.method === 'POST' && pathname === '/api/run') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => { handleRun(req, res, body); });
    } else {
        serveStaticFile(req, res, pathname);
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('========================================================================');
    console.log('   OPERATING SYSTEMS AND SYSTEMS PROGRAMMING');
    console.log('   Linux Process Creation, Execution and Termination System');
    console.log('   Server running at http://localhost:' + PORT);
    console.log('   Backend: Pure Node.js (Zero Python, Zero external npm packages)');
    console.log('========================================================================');
});
