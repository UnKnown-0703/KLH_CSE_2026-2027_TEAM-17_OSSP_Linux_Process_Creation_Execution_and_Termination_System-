import os
import base64
import subprocess

def b64(path):
    with open(path, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')

logo_b64 = b64('results/klu_logo.png')
qr_b64 = b64('results/github_qr.png')
shot1_b64 = b64('results/SrccenShot--4.png') # Web dashboard visualizer
shot2_b64 = b64('results/SrccenShot--2.png') # Linux terminal zombie & waitpid

html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Poster - Linux Process Creation, Execution and Termination System</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Fira+Code:wght@500;700&display=swap');

  @page {{
    size: A3 portrait;
    margin: 0;
  }}

  * {{
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }}

  body {{
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background-color: #e5e7eb;
    color: #1f2937;
    font-size: 11px;
    line-height: 1.35;
    display: flex;
    justify-content: center;
    padding: 12px;
  }}

  .poster {{
    width: 1100px;
    min-height: 1550px;
    background: #ffffff;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }}

  /* Top Banner */
  .header-banner {{
    background: linear-gradient(135deg, #2a0845 0%, #4b127a 45%, #6b1d9e 100%);
    padding: 16px 24px;
    display: flex;
    align-items: center;
    gap: 20px;
    border-bottom: 3px solid #facc15;
  }}

  .header-logo-card {{
    background: #ffffff;
    border-radius: 8px;
    padding: 8px 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    flex-shrink: 0;
    height: 64px;
  }}

  .header-logo-card img {{
    height: 44px;
    width: auto;
    object-fit: contain;
  }}

  .header-text {{
    flex: 1;
  }}

  .header-title {{
    color: #ffffff;
    font-size: 23px;
    font-weight: 900;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    margin-bottom: 5px;
    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  }}

  .header-meta-row1 {{
    color: #fef08a;
    font-size: 11.5px;
    font-weight: 700;
    margin-bottom: 3px;
    letter-spacing: 0.2px;
  }}

  .header-meta-row2 {{
    color: #e9d5ff;
    font-size: 10.5px;
    font-weight: 500;
  }}

  /* Main Body Layout */
  .main-body {{
    padding: 14px 18px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 1;
    background: #fafafa;
  }}

  /* 2-Column Grid */
  .two-column-grid {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }}

  .column {{
    display: flex;
    flex-direction: column;
    gap: 12px;
  }}

  /* Card Base Styles */
  .card {{
    border-radius: 10px;
    padding: 12px 14px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }}

  .card-title {{
    font-size: 13.5px;
    font-weight: 800;
    display: flex;
    align-items: center;
    gap: 6px;
    border-bottom: 1.5px solid rgba(0,0,0,0.08);
    padding-bottom: 4px;
    margin-bottom: 2px;
  }}

  /* Card Color Themes */
  /* 1. Abstract (Amber / Cream) */
  .card-abstract {{
    background: #fffbeb;
    border: 1.5px solid #fcd34d;
  }}
  .card-abstract .card-title {{
    color: #92400e;
  }}

  /* 2. Problem & Objectives (Rose / Pink) */
  .card-problem {{
    background: #fff1f2;
    border: 1.5px solid #fda4af;
  }}
  .card-problem .card-title {{
    color: #be123c;
  }}

  /* 3. Existing vs Proposed (Ice Blue) */
  .card-comparison {{
    background: #f0f7ff;
    border: 1.5px solid #bfdbfe;
  }}
  .card-comparison .card-title {{
    color: #1d4ed8;
  }}

  /* 4. Feasibility (Mint Green) */
  .card-feasibility {{
    background: #f0fdf4;
    border: 1.5px solid #86efac;
  }}
  .card-feasibility .card-title {{
    color: #15803d;
  }}

  /* 5. Tools & Tech (Sky / Cyan) */
  .card-tools {{
    background: #f0f9ff;
    border: 1.5px solid #7dd3fc;
  }}
  .card-tools .card-title {{
    color: #0369a1;
  }}

  /* 6. Architecture / Workflow (Lavender / Purple) */
  .card-arch {{
    background: #f5f3ff;
    border: 1.5px solid #c4b5fd;
  }}
  .card-arch .card-title {{
    color: #6d28d9;
  }}

  /* 7. Process & Resource Design (Peach / Orange) */
  .card-design {{
    background: #fff7ed;
    border: 1.5px solid #fdba74;
  }}
  .card-design .card-title {{
    color: #c2410c;
  }}

  /* 8. Screenshots (Teal) */
  .card-screens {{
    background: #f0fdfa;
    border: 1.5px solid #5eead4;
  }}
  .card-screens .card-title {{
    color: #0f766e;
  }}

  /* Text & Highlight Helpers */
  .key-badge {{
    display: inline-block;
    padding: 1px 6px;
    border-radius: 4px;
    font-weight: 700;
    font-size: 10px;
    text-transform: uppercase;
  }}

  .badge-orange {{ background: #ffedd5; color: #9a3412; }}
  .badge-blue {{ background: #dbeafe; color: #1e40af; }}
  .badge-green {{ background: #dcfce7; color: #166534; }}
  .badge-purple {{ background: #ede9fe; color: #5b21b6; }}
  .badge-pink {{ background: #ffe4e6; color: #9f1239; }}

  p {{
    text-align: justify;
    line-height: 1.4;
  }}

  strong {{
    font-weight: 700;
    color: #111827;
  }}

  code {{
    font-family: 'Fira Code', monospace;
    font-size: 10px;
    background: rgba(0,0,0,0.06);
    padding: 1px 4px;
    border-radius: 3px;
    font-weight: 600;
    color: #831843;
  }}

  /* Comparison Table */
  .comparison-table {{
    width: 100%;
    border-collapse: collapse;
    font-size: 9.8px;
    margin-top: 2px;
  }}

  .comparison-table th {{
    background: #1e40af;
    color: #ffffff;
    padding: 4px 6px;
    text-align: left;
    font-weight: 700;
    border: 1px solid #1e3a8a;
  }}

  .comparison-table td {{
    padding: 4px 6px;
    border: 1px solid #bfdbfe;
    vertical-align: top;
    line-height: 1.3;
  }}

  .comparison-table tr:nth-child(even) {{
    background: #e0f2fe;
  }}
  .comparison-table tr:nth-child(odd) {{
    background: #ffffff;
  }}

  .comparison-table td:first-child {{
    font-weight: 700;
    color: #1e3a8a;
    width: 22%;
  }}

  /* Feasibility Grid */
  .feasibility-grid {{
    display: grid;
    grid-template-columns: 1fr;
    gap: 4px;
  }}

  .feas-item {{
    background: #ffffff;
    border: 1px solid #bbf7d0;
    border-radius: 6px;
    padding: 4px 8px;
  }}

  /* Tools List */
  .tools-list {{
    display: flex;
    flex-direction: column;
    gap: 4px;
  }}

  .tool-row {{
    background: #ffffff;
    border: 1px solid #bae6fd;
    border-radius: 6px;
    padding: 4px 8px;
    display: flex;
    gap: 6px;
  }}

  .tool-label {{
    font-weight: 700;
    color: #0369a1;
    min-width: 95px;
    flex-shrink: 0;
  }}

  /* Workflow Flowchart Diagram */
  .arch-flow {{
    display: flex;
    flex-direction: column;
    gap: 6px;
    background: #ffffff;
    border: 1px solid #ddd6fe;
    border-radius: 8px;
    padding: 8px;
  }}

  .arch-header-bar {{
    background: #6d28d9;
    color: #ffffff;
    font-weight: 800;
    text-align: center;
    font-size: 10px;
    letter-spacing: 0.5px;
    padding: 3px;
    border-radius: 4px;
    text-transform: uppercase;
  }}

  .arch-stages {{
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 6px;
    position: relative;
  }}

  .arch-box {{
    border-radius: 6px;
    padding: 6px;
    font-size: 9.5px;
    display: flex;
    flex-direction: column;
    gap: 3px;
    border: 1.5px solid;
  }}

  .arch-box-title {{
    font-weight: 800;
    font-size: 9.8px;
    border-bottom: 1px dashed;
    padding-bottom: 2px;
    margin-bottom: 2px;
  }}

  .arch-box-1 {{ background: #fff1f2; border-color: #fda4af; color: #9f1239; }}
  .arch-box-2 {{ background: #eff6ff; border-color: #93c5fd; color: #1e40af; }}
  .arch-box-3 {{ background: #fdf4ff; border-color: #f0abfc; color: #86198f; }}
  .arch-box-4 {{ background: #f0fdf4; border-color: #86efac; color: #166534; }}

  /* Process Design Sub-boxes */
  .design-boxes {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }}

  .design-box {{
    background: #ffffff;
    border: 1.5px solid #fed7aa;
    border-radius: 8px;
    padding: 7px;
    font-size: 9.5px;
  }}

  .design-box-title {{
    font-weight: 800;
    color: #9a3412;
    font-size: 10px;
    background: #ffedd5;
    padding: 2px 6px;
    border-radius: 4px;
    margin-bottom: 5px;
    text-transform: uppercase;
    text-align: center;
  }}

  .state-pill-flow {{
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;
    margin-top: 4px;
  }}

  .state-pill {{
    padding: 2px 5px;
    border-radius: 4px;
    font-weight: 700;
    font-size: 8.5px;
  }}
  .st-new {{ background: #e0e7ff; color: #3730a3; }}
  .st-ready {{ background: #fef08a; color: #854d0e; }}
  .st-run {{ background: #bbf7d0; color: #14532d; }}
  .st-zomb {{ background: #fbcfe8; color: #831843; }}
  .st-term {{ background: #fecdd3; color: #9f1239; }}

  /* Screenshot Container */
  .screens-grid {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }}

  .screen-card {{
    background: #ffffff;
    border: 1px solid #99f6e4;
    border-radius: 6px;
    padding: 5px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }}

  .screen-card img {{
    width: 100%;
    height: 120px;
    object-fit: cover;
    border-radius: 4px;
    border: 1px solid #0f766e40;
  }}

  .screen-caption {{
    font-size: 9px;
    font-weight: 600;
    color: #0f766e;
    text-align: center;
  }}

  /* Bottom 3-Card Row */
  .three-card-row {{
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 12px;
  }}

  .card-results {{
    background: #fff1f2;
    border: 1.5px solid #fecdd3;
  }}
  .card-results .card-title {{ color: #be123c; }}

  .card-conclusion {{
    background: #f7fee7;
    border: 1.5px solid #d9f99d;
  }}
  .card-conclusion .card-title {{ color: #4d7c0f; }}

  .card-future {{
    background: #faf5ff;
    border: 1.5px solid #e9d5ff;
  }}
  .card-future .card-title {{ color: #7e22ce; }}

  /* Footer Bar */
  .poster-footer {{
    background: #f8fafc;
    border-top: 2px solid #cbd5e1;
    padding: 8px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
  }}

  .references-text {{
    font-size: 8.8px;
    color: #475569;
    line-height: 1.35;
    flex: 1;
  }}

  .footer-qr {{
    display: flex;
    align-items: center;
    gap: 8px;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 4px 8px;
    flex-shrink: 0;
  }}

  .footer-qr img {{
    width: 44px;
    height: 44px;
  }}

  .footer-qr-text {{
    font-size: 9px;
    font-weight: 700;
    color: #1e293b;
    line-height: 1.2;
  }}
</style>
</head>
<body>

<div class="poster">

  <!-- TOP BANNER -->
  <header class="header-banner">
    <div class="header-logo-card">
      <img src="data:image/png;base64,{logo_b64}" alt="KL University Logo">
    </div>
    <div class="header-text">
      <h1 class="header-title">LINUX PROCESS LIFECYCLE: CREATION, EXECUTION &amp; TERMINATION</h1>
      <div class="header-meta-row1">
        Team ID: 17 &nbsp;|&nbsp; Section: 4 &nbsp;|&nbsp; Members: T.B.S.Sunil – 2520030605, V.Prem Kumar – 2520030479, G.B.VEDADITYA – 2520030481
      </div>
      <div class="header-meta-row2">
        Guide: Dr. Soumya Enukonda / Dr. K. Anusha &nbsp;|&nbsp; Operating Systems and Systems Programming (OSSP — 25CS2104E) &nbsp;|&nbsp; KLH Bachupally Campus, CSE &nbsp;|&nbsp; PBL 2026–27
      </div>
    </div>
  </header>

  <!-- MAIN BODY -->
  <main class="main-body">

    <!-- 2 COLUMN GRID -->
    <div class="two-column-grid">

      <!-- LEFT COLUMN -->
      <div class="column">

        <!-- 1. ABSTRACT -->
        <section class="card card-abstract">
          <div class="card-title">Abstract</div>
          <p>
            <strong>Linux Process Lifecycle System</strong> is a high-performance Linux kernel and POSIX systems programming utility engineered in C for Ubuntu/Linux. It delivers a comprehensive platform featuring both a native ANSI-colored terminal CLI and a zero-dependency interactive Web visualizer for operating systems students, developers, and educators. The system implements and inspects the complete process lifecycle through standard POSIX APIs (<code>fork()</code>, <code>execvp()</code>, <code>waitpid()</code>, <code>exit()</code>) while extracting real-time Process Control Block (PCB) telemetry directly from the kernel virtual filesystem (<code>/proc/&lt;pid&gt;/status</code>).
          </p>
          <p>
            <strong>Key Outcome:</strong> Achieved 100% deterministic process management across 6 verified scenarios, successfully trapping and observing pathological Zombie (<code>Z</code>) and Orphan (PID 1 <code>init</code>) states with live <code>/proc</code> telemetry and zero runtime overhead.
          </p>
        </section>

        <!-- 2. PROBLEM STATEMENT & OBJECTIVES -->
        <section class="card card-problem">
          <div class="card-title">Problem Statement &amp; Objectives</div>
          <p>
            <strong>Problem:</strong> Process management is the foundation of operating systems, yet textbook abstractions fail to illustrate dynamic kernel-level mechanisms—such as Copy-On-Write (COW) memory page cloning, virtual address space replacement via <code>exec()</code>, Zombie accumulation in the kernel process table, and Orphan reparenting—leaving students with a fragmented theoretical understanding.
          </p>
          <p>
            <strong>Objective 1:</strong> Implement a modular C systems engine on the Linux kernel demonstrating process cloning via <code>fork()</code> and binary execution via <code>execvp()</code> with Copy-On-Write memory tracking.
          </p>
          <p>
            <strong>Objective 2:</strong> Implement robust parent-child synchronization and non-blocking monitoring using <code>wait()</code> and <code>waitpid()</code> with the <code>WNOHANG</code> flag to prevent process deadlocks.
          </p>
          <p>
            <strong>Objective 3:</strong> Build a real-time kernel inspector querying <code>/proc/&lt;pid&gt;/status</code> to observe live execution states (<code>R</code>, <code>S</code>, <code>Z</code>) and decode termination status via POSIX macros.
          </p>
          <p>
            <strong>Objective 4:</strong> Provide a dual-interface telemetry pipeline: ANSI color-coded terminal logging and an interactive web visualizer with zero external npm dependencies.
          </p>
          <p>
            <strong>Scope:</strong> Targets Ubuntu 24.04 LTS (WSL2 / Linux Kernel 6.18+); strictly unprivileged user-space operation; covers full lifecycle, anomaly trapping, and automated test matrix.
          </p>
        </section>

        <!-- 3. EXISTING VS PROPOSED SYSTEM -->
        <section class="card card-comparison">
          <div class="card-title">Existing vs Proposed System</div>
          <table class="comparison-table">
            <thead>
              <tr>
                <th>Aspect</th>
                <th>Basic / Existing Approach</th>
                <th>Proposed Project (Team 17 System)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Process Creation</td>
                <td>Isolated ad-hoc scripts; static diagrams without COW verification.</td>
                <td><code>fork()</code> with return value branching (0 vs child PID) &amp; PCB duplication tracking.</td>
              </tr>
              <tr>
                <td>Program Execution</td>
                <td>Direct shell launching; address space replacement invisible.</td>
                <td><code>execvp()</code> replacing Text, Data, Heap &amp; Stack segments with error recovery.</td>
              </tr>
              <tr>
                <td>Synchronization</td>
                <td>Unchecked <code>wait()</code> or omitted wait causing zombie leaks.</td>
                <td>Deterministic <code>waitpid()</code> barrier + non-blocking <code>WNOHANG</code> polling loop.</td>
              </tr>
              <tr>
                <td>Anomaly Trapping</td>
                <td>Zombies and orphans ignored or crash student terminals.</td>
                <td>Real-time <code>/proc/&lt;pid&gt;/status</code> parsing catching <code>State: Z</code> &amp; PID 1 reparenting.</td>
              </tr>
              <tr>
                <td>Observability</td>
                <td>Silent CLI execution or unformatted raw terminal stdout.</td>
                <td>Dual telemetry: ANSI color shell logs + interactive Web dashboard with live state diagrams.</td>
              </tr>
            </tbody>
          </table>
        </section>

        <!-- 4. FEASIBILITY STUDY -->
        <section class="card card-feasibility">
          <div class="card-title">Feasibility Study</div>
          <div class="feasibility-grid">
            <div class="feas-item">
              <strong>Technical:</strong> Engineered in ISO C99 (<code>gcc -Wall -Wextra -O2</code>) leveraging native Linux POSIX APIs (<code>unistd.h</code>, <code>sys/wait.h</code>, <code>signal.h</code>) and procfs (<code>/proc/&lt;pid&gt;/status</code>) on Ubuntu 24.04 LTS (WSL2 / Linux 6.18+). Zero compiler warnings.
            </div>
            <div class="feas-item">
              <strong>Economic:</strong> 100% free, open-source stack (GCC, Make, Linux Kernel, Node.js HTTP runtime, HTML5/CSS3/SVG); zero proprietary software licenses, cloud fees, or specialized hardware required.
            </div>
            <div class="feas-item">
              <strong>Operational:</strong> Executes safely in unprivileged user space reading world-readable <code>/proc</code> interfaces (no root required, zero kernel crashes); 1-click launchers (<code>start_server.bat</code> / <code>start_server.sh</code>) start CLI or Web mode instantly.
            </div>
            <div class="feas-item">
              <strong>Schedule:</strong> Completed across 4 semester PBL milestones: W1–3 Process creation &amp; <code>execvp</code>; W4–6 <code>waitpid</code>, <code>WNOHANG</code> &amp; <code>/proc</code> parser; W7–9 Dual ANSI/JSON streaming &amp; Web visualizer; W10–12 6-Scenario test matrix &amp; validation.
            </div>
          </div>
        </section>

      </div>

      <!-- RIGHT COLUMN -->
      <div class="column">

        <!-- 5. TOOLS & TECHNOLOGIES -->
        <section class="card card-tools">
          <div class="card-title">Tools &amp; Technologies</div>
          <div class="tools-list">
            <div class="tool-row">
              <span class="tool-label">Programming:</span>
              <span>C (ISO C99 with <code>_GNU_SOURCE</code>), JavaScript (Vanilla Node.js v18+, ES6), HTML5 / CSS3 / SVG</span>
            </div>
            <div class="tool-row">
              <span class="tool-label">Platform:</span>
              <span>Linux / Ubuntu 24.04 LTS (Native &amp; Windows Subsystem for Linux — WSL2, Kernel 6.18+)</span>
            </div>
            <div class="tool-row">
              <span class="tool-label">OS Concepts:</span>
              <span>Process Lifecycle, PCB (<code>task_struct</code>), Copy-On-Write (COW), Image Swap, Zombie &amp; Orphan States, Signals</span>
            </div>
            <div class="tool-row">
              <span class="tool-label">System Calls:</span>
              <span><code>fork()</code>, <code>execvp()</code>, <code>wait()</code>, <code>waitpid()</code>, <code>exit()</code>, <code>getpid()</code>, <code>getppid()</code>, <code>kill()</code>, <code>/proc/&lt;pid&gt;/status</code></span>
            </div>
            <div class="tool-row">
              <span class="tool-label">Tools:</span>
              <span>GCC 15.2.0, GNU Make, VS Code, Node.js HTTP Server (strictly zero npm packages, NO Python), Git &amp; GitHub</span>
            </div>
          </div>
        </section>

        <!-- 6. SYSTEM WORKFLOW / ARCHITECTURE -->
        <section class="card card-arch">
          <div class="card-title">System Workflow / Architecture</div>
          <div class="arch-flow">
            <div class="arch-header-bar">End-to-End Lifecycle Execution &amp; Telemetry Pipeline</div>
            <div class="arch-stages">
              <div class="arch-box arch-box-1">
                <div class="arch-box-title">1. USER / CLIENT</div>
                <div>• Web Browser UI</div>
                <div>• Terminal Shell CLI</div>
                <div>• Scenario Selector</div>
                <div>• <code>custom &lt;cmd&gt;</code> Input</div>
              </div>
              <div class="arch-box arch-box-2">
                <div class="arch-box-title">2. C ENGINE CORE</div>
                <div>• <code>main.c</code> CLI Driver</div>
                <div>• <code>module_creation.c</code></div>
                <div>• <code>module_sync.c</code></div>
                <div>• <code>module_monitor.c</code></div>
              </div>
              <div class="arch-box arch-box-3">
                <div class="arch-box-title">3. LINUX KERNEL</div>
                <div>• <code>task_struct</code> PCB</div>
                <div>• COW Virtual Pages</div>
                <div>• <code>/proc/&lt;pid&gt;/status</code></div>
                <div>• Signal Dispatcher</div>
              </div>
              <div class="arch-box arch-box-4">
                <div class="arch-box-title">4. TELEMETRY &amp; UI</div>
                <div>• ANSI Color Badges</div>
                <div>• NDJSON Event Stream</div>
                <div>• Web State Machine</div>
                <div>• Audit Event Logs</div>
              </div>
            </div>
          </div>
        </section>

        <!-- 7. PROCESS, IPC & RESOURCE DESIGN -->
        <section class="card card-design">
          <div class="card-title">Process, IPC &amp; Resource Design</div>
          <div class="design-boxes">
            <div class="design-box">
              <div class="design-box-title">A. Lifecycle &amp; State Transitions</div>
              <div>• <strong>Creation:</strong> <code>fork()</code> clones parent PCB via Copy-On-Write; child receives 0, parent receives child PID.</div>
              <div>• <strong>Execution:</strong> <code>execvp()</code> replaces address space (Text, Data, Heap, Stack) with target binary.</div>
              <div>• <strong>Termination:</strong> <code>exit()</code> releases virtual memory, leaving <code>task_struct</code> for status reading.</div>
              <div class="state-pill-flow">
                <span class="state-pill st-new">NEW</span> ➔
                <span class="state-pill st-ready">READY</span> ➔
                <span class="state-pill st-run">RUNNING</span> ➔
                <span class="state-pill st-zomb">ZOMBIE</span> ➔
                <span class="state-pill st-term">REAPED</span>
              </div>
            </div>
            <div class="design-box">
              <div class="design-box-title">B. Synchronization &amp; /proc Inspector</div>
              <div>• <strong>Non-blocking:</strong> <code>waitpid(WNOHANG)</code> polling loop enables concurrent parent background computation.</div>
              <div>• <strong>Zombie Trapping:</strong> Child calls <code>exit(42)</code>; parent delays <code>wait()</code>; <code>/proc/&lt;pid&gt;</code> confirms <code>State: Z (zombie)</code>.</div>
              <div>• <strong>Orphan Adoption:</strong> Parent exits prematurely; kernel automatically reparents child to PID 1 (<code>init</code>).</div>
              <div>• <strong>Status Decoding:</strong> <code>WIFEXITED</code> &amp; <code>WIFSIGNALED</code> accurately decode codes and signals.</div>
            </div>
          </div>
        </section>

        <!-- 8. IMPLEMENTATION SCREENSHOTS -->
        <section class="card card-screens">
          <div class="card-title">Implementation Screenshots</div>
          <div class="screens-grid">
            <div class="screen-card">
              <img src="data:image/png;base64,{shot1_b64}" alt="Web Visualizer Dashboard">
              <div class="screen-caption">Fig 1: Live Interactive Web Dashboard &amp; Visual State Transitions</div>
            </div>
            <div class="screen-card">
              <img src="data:image/png;base64,{shot2_b64}" alt="Linux Terminal Zombie Demo">
              <div class="screen-caption">Fig 2: Linux Terminal Native CLI &amp; /proc Zombie State Inspection</div>
            </div>
          </div>
        </section>

      </div>

    </div>

    <!-- BOTTOM ROW: 3 CARDS ACROSS -->
    <div class="three-card-row">

      <!-- RESULTS & TESTING -->
      <section class="card card-results">
        <div class="card-title">Results &amp; Testing</div>
        <p>
          <strong>Observed Metrics:</strong> 6/6 test scenarios passed (100% pass rate) on Ubuntu 24.04 LTS (WSL2 / Linux Kernel 6.18+). 0 compiler warnings under <code>gcc -Wall -Wextra</code>, 0 memory leaks, 0 orphaned processes left behind.
        </p>
        <p>
          <strong>Test Matrix:</strong> TC-01 Standard Flow (Pass, code 0), TC-02 Zombie Process (Pass, State 'Z' caught &amp; reaped 42), TC-03 Orphan Process (Pass, adopted by PPID 1), TC-04 Non-blocking WNOHANG (Pass, caught in poll loop), TC-05 Signal Interruption (Pass, Signal 9 detected), TC-06 Custom Execution (Pass, <code>ls</code>/<code>whoami</code>).
        </p>
      </section>

      <!-- CONCLUSION -->
      <section class="card card-conclusion">
        <div class="card-title">Conclusion</div>
        <p>
          Engineered a complete, high-fidelity <strong>Linux Process Creation, Execution, and Termination System</strong> in C and Node.js. Successfully demystified kernel process management primitives (<code>fork</code>, <code>execvp</code>, <code>waitpid</code>, <code>exit</code>) and made dynamic anomalies directly observable in real time.
        </p>
        <p>
          Fulfills all course objectives while demonstrating Linux kernel PCB mechanics, <code>/proc</code> virtual filesystem parsing, Copy-On-Write semantics, and POSIX status decoding macros.
        </p>
      </section>

      <!-- FUTURE SCOPE -->
      <section class="card card-future">
        <div class="card-title">Future Scope</div>
        <p>
          <strong>1. eBPF Process Tracing:</strong> Attach eBPF kprobes on <code>sys_enter_fork</code> and <code>sys_enter_execve</code> for zero-overhead kernel scheduler latency profiling.
        </p>
        <p>
          <strong>2. Namespace Virtualization:</strong> Integrate Linux container namespaces (<code>clone(CLONE_NEWPID | CLONE_NEWNS)</code>) for isolated container environments.
        </p>
        <p>
          <strong>3. Multi-Node Daemon:</strong> Package telemetry agent as a systemd daemon streaming process metrics to Prometheus and Grafana.
        </p>
      </section>

    </div>

  </main>

  <!-- FOOTER BAR -->
  <footer class="poster-footer">
    <div class="references-text">
      <strong>References:</strong> [1] Linux Programmer's Manual: <code>fork(2)</code>, <code>execvp(3)</code>, <code>waitpid(2)</code>, <code>proc(5)</code> – kernel.org &nbsp;|&nbsp; [2] A. Silberschatz, P. B. Galvin &amp; G. Gagne, <em>Operating System Concepts</em>, 10th Ed., Wiley &nbsp;|&nbsp; [3] W. R. Stevens, <em>Advanced Programming in the UNIX Environment</em>, 3rd Ed. &nbsp;|&nbsp; [4] <strong>GitHub Repository:</strong> github.com/Team17-OSSP/Linux-Process-Lifecycle-System
    </div>
    <div class="footer-qr">
      <img src="data:image/png;base64,{qr_b64}" alt="QR Code">
      <div class="footer-qr-text">
        GitHub<br>Team-17
      </div>
    </div>
  </footer>

</div>

</body>
</html>
"""

with open('poster.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

print("Generated poster.html successfully!")
