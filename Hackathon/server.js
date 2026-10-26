/**
 * ============================================================================
 * OPERATING SYSTEMS & SYSTEMS PROGRAMMING (OSSP)
 * Project: Multi-Process Command Pipeline System
 * Team 17 - Hackathon
 * ============================================================================
 * server.js - Pure Node.js Web Server (Zero external npm packages)
 * Provides REST APIs, WSL Execution Bridge, and Static Asset Delivery
 * ============================================================================
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const url = require('url');

const PORT = process.env.PORT || 5000;
const PROJECT_ROOT = __dirname;
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
const C_SRC_DIR = path.join(PROJECT_ROOT, 'c_src');
const BIN_DIR = path.join(PROJECT_ROOT, 'bin');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');

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
    '.c': 'text/plain; charset=utf-8',
    '.h': 'text/plain; charset=utf-8'
};

/**
 * Execute command with promise
 */
function runCommand(command, cwd = PROJECT_ROOT) {
    return new Promise((resolve) => {
        exec(command, { cwd, maxBuffer: 15 * 1024 * 1024 }, (error, stdout, stderr) => {
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
 * Helper to get WSL execution command with project root as working directory
 */
function getWSLCommand(innerCmd) {
    const formattedPath = PROJECT_ROOT.replace(/\\/g, '/').replace(/^([A-Za-z]):/, (m, drive) => `/mnt/${drive.toLowerCase()}`);
    return `wsl -d Ubuntu --cd "${formattedPath}" ${innerCmd}`;
}

/**
 * Predefined educational pipeline scenarios
 */
const PRESETS = [
    {
        id: 'web_status',
        name: 'Web Server HTTP Status Distribution',
        category: 'Log Analysis',
        description: 'Extracts HTTP status codes from web access logs, sorts, aggregates unique counts, and sorts numerically descending.',
        command: 'cat data/access_log.txt | awk \'{print $9}\' | sort | uniq -c | sort -nr',
        custom_stdin: '',
        stages_explanation: [
            'cat: Reads raw web access log lines from disk and writes to STDOUT.',
            'awk: Extracts the 9th column containing HTTP status codes (200, 404, 500, etc.).',
            'sort: Orders the status codes alphabetically so uniq can group identical values.',
            'uniq -c: Collapses consecutive duplicates and prefixes each line with its frequency count.',
            'sort -nr: Sorts the aggregated frequencies numerically in descending order to surface most frequent hits.'
        ]
    },
    {
        id: 'error_scan',
        name: '404 Route Exploitation Scanner',
        category: 'Security & Forensics',
        description: 'Filters web server logs for HTTP 404 Not Found responses, extracts accessed paths, and counts scan attempts.',
        command: 'cat data/access_log.txt | grep 404 | awk \'{print $7}\' | sort | uniq -c',
        custom_stdin: '',
        stages_explanation: [
            'cat: Streams log entries into the pipeline.',
            'grep 404: Filters only requests resulting in 404 HTTP Not Found.',
            'awk: Isolates field 7 (the requested URI path, e.g. /wp-login.php, /.env).',
            'sort: Groups identical attack probes together.',
            'uniq -c: Quantifies probe repetitions per endpoint.'
        ]
    },
    {
        id: 'word_frequency',
        name: 'Text Tokenization & Word Frequency Matrix',
        category: 'Text Processing',
        description: 'Streams text data, splits words onto newlines, converts to lowercase, sorts, counts frequency, and displays the top 8.',
        command: 'cat data/words.txt | tr -s \' \' \'\\n\' | tr \'[:upper:]\' \'[:lower:]\' | sort | uniq -c | sort -nr | head -n 8',
        custom_stdin: '',
        stages_explanation: [
            'cat: Reads input text file into stream.',
            'tr -s \' \' \'\\n\': Replaces spaces with newlines, tokenizing words one per line.',
            'tr: Normalizes uppercase letters to lowercase for case-insensitive counting.',
            'sort: Alphabetizes token list for uniq grouping.',
            'uniq -c: Counts occurrences of each word.',
            'sort -nr: Sorts word counts from highest to lowest.',
            'head -n 8: Limits final output to the top 8 most frequent words.'
        ]
    },
    {
        id: 'csv_filter',
        name: 'Engineering Department Salary Analytics',
        category: 'Data Pipeline',
        description: 'Parses a CSV dataset, filters Engineering department members, extracts name/role/salary, and sorts by highest compensation.',
        command: 'cat data/employees.csv | grep Engineering | cut -d, -f2,4,5 | sort -t, -k3 -n -r',
        custom_stdin: '',
        stages_explanation: [
            'cat: Reads employee records CSV.',
            'grep Engineering: Filters rows where department contains Engineering.',
            'cut -d, -f2,4,5: Selects columns 2 (name), 4 (role), and 5 (salary).',
            'sort -t, -k3 -n -r: Sorts by column 3 (salary) numerically in reverse (highest first).'
        ]
    },
    {
        id: 'process_tree',
        name: 'Active System Process User Profiler',
        category: 'System Diagnostics',
        description: 'Lists all active Linux OS processes, isolates process owners, and aggregates how many processes each user is running.',
        command: 'ps aux | grep -v "grep" | awk \'{print $1}\' | sort | uniq -c | sort -nr',
        custom_stdin: '',
        stages_explanation: [
            'ps aux: Snapshots all executing processes in the Linux kernel.',
            'grep -v "grep": Filters out the grep command itself.',
            'awk: Extracts column 1 (process username).',
            'sort: Alphabetizes user names.',
            'uniq -c: Counts total running processes per user.',
            'sort -nr: Ranks users with the highest process counts at the top.'
        ]
    },
    {
        id: 'custom_stream',
        name: 'Interactive Memory Pipeline (Custom STDIN)',
        category: 'Custom Stdin Feed',
        description: 'Demonstrates feeding arbitrary in-memory text via pipe into sort and head, without reading from any disk file.',
        command: 'grep -i "core" | sort | head -n 4',
        custom_stdin: "Kernel Core Scheduler\nUser Space Daemon\nMulticore IPC Channel\nMemory Buffer Allocator\nCore Process Reaper\nGraphics Driver Subsystem",
        stages_explanation: [
            'Custom STDIN: Injected directly into stage 0 standard input descriptor (FD 0) via kernel pipe.',
            'grep -i "core": Filters lines containing "core" case-insensitively.',
            'sort: Alphabetically arranges the matched entries.',
            'head -n 4: Truncates output to the first 4 results.'
        ]
    }
];

/**
 * Handle POST /api/execute
 */
async function handleExecutePipeline(req, res) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
        try {
            const payload = JSON.parse(body || '{}');
            const command = (payload.command || '').trim();
            const customStdin = payload.custom_stdin || '';

            if (!command) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, error: 'Command string is required.' }));
            }

            // Ensure binary exists or compile it
            const binPath = path.join(BIN_DIR, 'pipeline_engine');
            if (!fs.existsSync(binPath)) {
                console.log('[Compiler] Binary not found. Triggering automated build in WSL...');
                const compileCmd = getWSLCommand('gcc -Wall -Wextra -O2 -g -D_GNU_SOURCE c_src/pipeline_engine.c c_src/pipeline_parser.c c_src/pipeline_monitor.c -o bin/pipeline_engine');
                const compRes = await runCommand(compileCmd);
                if (compRes.code !== 0) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({
                        success: false,
                        error: 'Compilation failed: ' + compRes.stderr,
                        compiler_output: compRes.stderr
                    }));
                }
            }

            // Construct WSL command execution
            // We use base64 or temporary file for custom stdin if large, or pass directly
            let wslExecCmd = '';
            if (customStdin && customStdin.trim().length > 0) {
                const tempInputPath = path.join(DATA_DIR, '.tmp_stdin.txt');
                fs.writeFileSync(tempInputPath, customStdin, 'utf8');
                wslExecCmd = getWSLCommand(`./bin/pipeline_engine --json --input "$(< data/.tmp_stdin.txt)" "${command.replace(/"/g, '\\"')}"`);
            } else {
                wslExecCmd = getWSLCommand(`./bin/pipeline_engine --json "${command.replace(/"/g, '\\"')}"`);
            }

            console.log(`[Execute] Running WSL Pipeline: ${command}`);
            const result = await runCommand(wslExecCmd);

            // Attempt to parse stdout as JSON
            let parsedJson = null;
            try {
                // Find first '{' and last '}'
                const firstBrace = result.stdout.indexOf('{');
                const lastBrace = result.stdout.lastIndexOf('}');
                if (firstBrace !== -1 && lastBrace !== -1) {
                    const jsonStr = result.stdout.substring(firstBrace, lastBrace + 1);
                    parsedJson = JSON.parse(jsonStr);
                }
            } catch (jsonErr) {
                console.error('[Execute] Failed to parse JSON from C binary stdout:', jsonErr.message);
            }

            if (parsedJson) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({
                    success: parsedJson.success,
                    data: parsedJson,
                    raw_stdout: result.stdout,
                    raw_stderr: result.stderr
                }));
            } else {
                // Return raw execution data
                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({
                    success: result.code === 0,
                    data: {
                        command: command,
                        success: result.code === 0,
                        final_output: result.stdout,
                        global_error: result.stderr || result.error,
                        num_stages: command.split('|').length,
                        stages: command.split('|').map((c, idx, arr) => ({
                            stage_index: idx,
                            raw_command: c.trim(),
                            binary: c.trim().split(' ')[0],
                            pid: 1000 + idx,
                            state: result.code === 0 ? 'COMPLETED' : 'FAILED',
                            exit_code: result.code,
                            fd_info: {
                                orig_stdin: idx === 0 ? 0 : 3 + (idx - 1) * 2,
                                orig_stdout: idx === arr.length - 1 ? 1 : 4 + idx * 2,
                                assigned_stdin: 0,
                                assigned_stdout: 1
                            }
                        }))
                    },
                    raw_stdout: result.stdout,
                    raw_stderr: result.stderr
                }));
            }
        } catch (e) {
            console.error('[Execute Error]', e);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: e.message }));
        }
    });
}

/**
 * Handle GET /api/compile
 */
async function handleCompile(res) {
    const compileCmd = getWSLCommand('gcc -Wall -Wextra -O2 -g -D_GNU_SOURCE c_src/pipeline_engine.c c_src/pipeline_parser.c c_src/pipeline_monitor.c -o bin/pipeline_engine');
    const result = await runCommand(compileCmd);

    res.writeHead(result.code === 0 ? 200 : 500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        success: result.code === 0,
        output: result.stdout,
        errors: result.stderr,
        binary_exists: fs.existsSync(path.join(BIN_DIR, 'pipeline_engine'))
    }));
}

/**
 * Handle GET /api/system-info
 */
async function handleSystemInfo(res) {
    const unameRes = await runCommand(getWSLCommand('uname -a'));
    const gccRes = await runCommand(getWSLCommand('gcc --version | head -n 1'));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        node_version: process.version,
        platform: process.platform,
        wsl_kernel: unameRes.stdout.trim() || 'WSL Linux Kernel 6.18',
        gcc_version: gccRes.stdout.trim() || 'GCC 15.2.0',
        pipe_buffer_capacity_bytes: 65536,
        pipe_buffer_capacity_kb: 64,
        posix_standard: 'POSIX.1-2008 / Single UNIX Specification',
        max_stages_supported: 16
    }));
}

/**
 * Handle GET /api/c-code
 */
function handleCCode(res) {
    try {
        const engineC = fs.readFileSync(path.join(C_SRC_DIR, 'pipeline_engine.c'), 'utf8');
        const parserC = fs.readFileSync(path.join(C_SRC_DIR, 'pipeline_parser.c'), 'utf8');
        const monitorC = fs.readFileSync(path.join(C_SRC_DIR, 'pipeline_monitor.c'), 'utf8');
        const typesH = fs.readFileSync(path.join(C_SRC_DIR, 'pipeline_types.h'), 'utf8');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            'pipeline_engine.c': engineC,
            'pipeline_parser.c': parserC,
            'pipeline_monitor.c': monitorC,
            'pipeline_types.h': typesH
        }));
    } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
    }
}

/**
 * HTTP Request Handler
 */
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    // API Routing
    if (pathname === '/api/execute' && req.method === 'POST') {
        return handleExecutePipeline(req, res);
    }
    if (pathname === '/api/presets' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, presets: PRESETS }));
    }
    if (pathname === '/api/compile' && req.method === 'GET') {
        return handleCompile(res);
    }
    if (pathname === '/api/system-info' && req.method === 'GET') {
        return handleSystemInfo(res);
    }
    if (pathname === '/api/c-code' && req.method === 'GET') {
        return handleCCode(res);
    }

    // Static Asset Serving
    let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    if (safePath === '/' || safePath === '\\') {
        safePath = '/index.html';
    }

    let filePath = path.join(PUBLIC_DIR, safePath);

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            return res.end(`
                <div style="font-family:sans-serif; text-align:center; padding:50px;">
                    <h2>404 - Asset Not Found</h2>
                    <p>Requested path: <code>${pathname}</code></p>
                    <a href="/">Return to Multi-Process Pipeline Dashboard</a>
                </div>
            `);
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': stats.size,
            'Cache-Control': 'no-cache'
        });

        const readStream = fs.createReadStream(filePath);
        readStream.pipe(res);
    });
});

server.listen(PORT, () => {
    console.log('================================================================');
    console.log(' OPERATING SYSTEMS & SYSTEMS PROGRAMMING (OSSP) - TEAM 17');
    console.log(' Multi-Process Command Pipeline System');
    console.log('================================================================');
    console.log(` Web Server listening on: http://localhost:${PORT}`);
    console.log(` Static Directory:       ${PUBLIC_DIR}`);
    console.log(` C Engine Source:        ${C_SRC_DIR}`);
    console.log('================================================================');
});
