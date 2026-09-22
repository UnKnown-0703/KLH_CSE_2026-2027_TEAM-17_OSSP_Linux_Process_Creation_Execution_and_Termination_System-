/**
 * ============================================================================
 * KLH UNIVERSITY - TEAM 17 OSSP (25CS2104E)
 * diagrams.js - Dynamic SVG Process Tree & State Machine Visualizer
 * ============================================================================
 */

const Diagrams = {
    // Current state cache
    treeState: {
        parentPid: 524,
        parentPpid: 523,
        parentState: 'RUNNING',
        childPid: 525,
        childPpid: 524,
        childState: 'RUNNING',
        scenario: 'normal'
    },

    /**
     * Render the Process Tree SVG in the tree container
     */
    renderProcessTree(containerId, state) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const s = Object.assign({}, this.treeState, state || {});
        this.treeState = s;

        const isZombie = s.childState.includes('ZOMBIE') || s.scenario === 'zombie';
        const isOrphan = s.childState.includes('ORPHAN') || s.scenario === 'orphan';
        const isTerminated = s.childState.includes('TERMINATED');

        const parentColor = s.parentState === 'WAITING' ? '#f59e0b' :
                            s.parentState === 'SLEEPING' ? '#06b6d4' :
                            s.parentState === 'TERMINATED' ? '#ef4444' : '#10b981';

        const childColor = isZombie ? '#ec4899' :
                           isOrphan ? '#fbbf24' :
                           isTerminated ? '#ef4444' :
                           s.childState === 'WAITING' ? '#f59e0b' : '#38bdf8';

        const childLabel = isZombie ? 'CHILD [ZOMBIE DEFUNT]' :
                           isOrphan ? 'CHILD [ORPHAN ADOPTED]' :
                           isTerminated ? 'CHILD [REAPED]' : 'CHILD PROCESS';

        // Coordinates
        const width = container.clientWidth || 480;
        const height = 240;

        const initX = width / 2;
        const initY = 35;

        const parentX = isOrphan ? width * 0.25 : width * 0.32;
        const parentY = 120;

        const childX = isOrphan ? width * 0.75 : width * 0.68;
        const childY = isOrphan ? 120 : 185;

        // Path from Init to Parent
        const initToParent = `M ${initX} ${initY + 15} C ${initX} ${parentY - 20}, ${parentX} ${parentY - 30}, ${parentX} ${parentY - 20}`;
        
        // Path from Parent to Child (or Init to Child if Orphan)
        const parentToChild = isOrphan ?
            `M ${initX} ${initY + 15} C ${initX} ${childY - 20}, ${childX} ${childY - 30}, ${childX} ${childY - 20}` :
            `M ${parentX} ${parentY + 20} C ${parentX} ${childY - 20}, ${childX} ${parentY + 20}, ${childX} ${childY - 20}`;

        const svgHtml = `
        <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background: transparent;">
            <defs>
                <!-- Arrow Marker -->
                <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569"/>
                </marker>
                <marker id="arrow-active" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="${childColor}"/>
                </marker>
                <!-- Glow Filters -->
                <filter id="glow-parent" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="${parentColor}" flood-opacity="0.4"/>
                </filter>
                <filter id="glow-child" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="${childColor}" flood-opacity="0.6"/>
                </filter>
            </defs>

            <!-- Connector Lines -->
            <path d="${initToParent}" fill="none" stroke="#334155" stroke-width="2" stroke-dasharray="4" marker-end="url(#arrow)" />
            <path d="${parentToChild}" fill="none" stroke="${childColor}" stroke-width="2.5" ${isOrphan ? 'stroke-dasharray="6,3"' : ''} marker-end="url(#arrow-active)" />

            <!-- Init / Systemd Node (PID 1) -->
            <g transform="translate(${initX - 60}, ${initY - 15})">
                <rect width="120" height="32" rx="6" fill="#1e293b" stroke="#475569" stroke-width="1.5" />
                <text x="60" y="16" text-anchor="middle" fill="#94a3b8" font-size="10" font-weight="700" font-family="sans-serif">systemd / init (PID: 1)</text>
                <text x="60" y="27" text-anchor="middle" fill="#64748b" font-size="8" font-family="monospace">Root of Process Tree</text>
            </g>

            <!-- Parent Process Node -->
            <g transform="translate(${parentX - 75}, ${parentY - 20})" filter="url(#glow-parent)">
                <rect width="150" height="52" rx="8" fill="#0f172a" stroke="${parentColor}" stroke-width="2" />
                <circle cx="16" cy="18" r="5" fill="${parentColor}" />
                <text x="28" y="21" fill="#ffffff" font-size="11" font-weight="700" font-family="sans-serif">PARENT PROCESS</text>
                <text x="16" y="38" fill="#94a3b8" font-size="9" font-family="monospace">PID: ${s.parentPid} | PPID: ${s.parentPpid}</text>
                <rect x="95" y="6" width="48" height="14" rx="3" fill="${parentColor}22" />
                <text x="119" y="17" text-anchor="middle" fill="${parentColor}" font-size="8" font-weight="700">${s.parentState}</text>
            </g>

            <!-- Child Process Node -->
            <g transform="translate(${childX - 80}, ${childY - 20})" filter="url(#glow-child)">
                <rect width="160" height="52" rx="8" fill="#0f172a" stroke="${childColor}" stroke-width="2" ${isZombie ? 'stroke-dasharray="4,2"' : ''} />
                <circle cx="16" cy="18" r="5" fill="${childColor}" />
                <text x="28" y="21" fill="#ffffff" font-size="10" font-weight="700" font-family="sans-serif">${childLabel}</text>
                <text x="16" y="38" fill="#94a3b8" font-size="9" font-family="monospace">PID: ${s.childPid || '--'} | PPID: ${s.childPpid || '--'}</text>
                <rect x="102" y="6" width="52" height="14" rx="3" fill="${childColor}22" />
                <text x="128" y="17" text-anchor="middle" fill="${childColor}" font-size="8" font-weight="700">${s.childState}</text>
            </g>
        </svg>
        `;

        container.innerHTML = svgHtml;
    },

    /**
     * Render Step-by-Step interactive diagram
     */
    renderStepDiagram(stepIndex) {
        const container = document.getElementById('stepDiagram');
        if (!container) return;

        const diagrams = [
            // Step 0: Init
            `
            <div style="display:flex; flex-direction:column; align-items:center; gap:12px; width:100%;">
                <div style="background:#0f172a; border:2px solid #3b82f6; border-radius:8px; padding:12px 20px; text-align:center; width:220px;">
                    <strong style="color:#60a5fa; font-size:13px;">Parent Process</strong><br>
                    <span style="font-family:monospace; font-size:11px; color:#cbd5e1;">PID: 1024 | PPID: 1000</span><br>
                    <span style="font-size:10px; color:#10b981; font-weight:700;">STATE: RUNNING</span>
                </div>
                <div style="color:#64748b; font-size:11px; font-family:monospace;">User Space Memory & Registers Initialized</div>
            </div>
            `,
            // Step 1: fork()
            `
            <div style="display:flex; align-items:center; justify-content:center; gap:16px; width:100%;">
                <div style="background:#0f172a; border:2px solid #3b82f6; border-radius:8px; padding:10px 14px; text-align:center;">
                    <strong style="color:#60a5fa; font-size:12px;">Parent</strong><br>
                    <span style="font-size:10px; color:#cbd5e1;">Calling fork()...</span>
                </div>
                <div style="display:flex; flex-direction:column; align-items:center; color:#f59e0b;">
                    <span style="font-size:10px; font-weight:700;">Copy-On-Write</span>
                    <span style="font-size:18px;">➔</span>
                    <span style="font-size:9px; color:#94a3b8;">task_struct duplicated</span>
                </div>
                <div style="background:#0f172a; border:2px dashed #38bdf8; border-radius:8px; padding:10px 14px; text-align:center;">
                    <strong style="color:#38bdf8; font-size:12px;">New Child PCB</strong><br>
                    <span style="font-size:10px; color:#cbd5e1;">Allocated in kernel</span>
                </div>
            </div>
            `,
            // Step 2: Child Created
            `
            <div style="display:flex; justify-content:center; gap:20px; width:100%;">
                <div style="background:#0f172a; border:2px solid #10b981; border-radius:8px; padding:10px; text-align:center; width:140px;">
                    <strong style="color:#10b981; font-size:11px;">Parent (PID 1024)</strong><br>
                    <span style="font-size:9px; color:#94a3b8;">fork() returns child PID:</span><br>
                    <strong style="color:#38bdf8; font-family:monospace; font-size:12px;">1025</strong>
                </div>
                <div style="background:#0f172a; border:2px solid #38bdf8; border-radius:8px; padding:10px; text-align:center; width:140px;">
                    <strong style="color:#38bdf8; font-size:11px;">Child (PID 1025)</strong><br>
                    <span style="font-size:9px; color:#94a3b8;">fork() returns to child:</span><br>
                    <strong style="color:#10b981; font-family:monospace; font-size:12px;">0</strong>
                </div>
            </div>
            `,
            // Step 3: execvp()
            `
            <div style="display:flex; flex-direction:column; align-items:center; gap:8px; width:100%;">
                <div style="background:#ec489922; border:1px solid #ec4899; color:#fbcfe8; padding:6px 16px; border-radius:6px; font-size:11px; font-weight:700;">
                    execvp("/bin/ls", argv)
                </div>
                <div style="display:flex; gap:12px;">
                    <div style="background:#1e293b; padding:8px; border-radius:4px; font-size:10px; text-align:center; color:#94a3b8;">
                        Old Code & Heap<br><span style="color:#ef4444; font-weight:700;">DESTROYED</span>
                    </div>
                    <div style="display:flex; align-items:center; color:#ec4899; font-weight:700;">➔</div>
                    <div style="background:#1e293b; padding:8px; border-radius:4px; font-size:10px; text-align:center; color:#a7f3d0;">
                        ELF /bin/ls binary<br><span style="color:#10b981; font-weight:700;">LOADED</span>
                    </div>
                </div>
            </div>
            `,
            // Step 4: waitpid()
            `
            <div style="display:flex; justify-content:center; gap:16px; width:100%;">
                <div style="background:#0f172a; border:2px solid #f59e0b; border-radius:8px; padding:10px; text-align:center; width:140px;">
                    <strong style="color:#f59e0b; font-size:11px;">Parent (PID 1024)</strong><br>
                    <span style="font-size:9px; color:#fde68a;">Calling waitpid(1025)</span><br>
                    <strong style="color:#f59e0b; font-size:10px;">BLOCKED / SLEEPING</strong>
                </div>
                <div style="background:#0f172a; border:2px solid #10b981; border-radius:8px; padding:10px; text-align:center; width:140px;">
                    <strong style="color:#10b981; font-size:11px;">Child (PID 1025)</strong><br>
                    <span style="font-size:9px; color:#a7f3d0;">Executing program...</span><br>
                    <strong style="color:#10b981; font-size:10px;">CPU ACTIVE</strong>
                </div>
            </div>
            `,
            // Step 5: exit()
            `
            <div style="display:flex; justify-content:center; gap:16px; width:100%;">
                <div style="background:#0f172a; border:2px solid #f59e0b; border-radius:8px; padding:10px; text-align:center; width:140px;">
                    <strong style="color:#f59e0b; font-size:11px;">Parent</strong><br>
                    <span style="font-size:9px; color:#cbd5e1;">Awaiting harvest</span>
                </div>
                <div style="background:#0f172a; border:2px dashed #ec4899; border-radius:8px; padding:10px; text-align:center; width:150px;">
                    <strong style="color:#ec4899; font-size:11px;">Child: exit(0)</strong><br>
                    <span style="font-size:9px; color:#cbd5e1;">Memory released. Entry remains:</span><br>
                    <strong style="color:#ec4899; font-size:10px;">ZOMBIE (defunct)</strong>
                </div>
            </div>
            `,
            // Step 6: Reaped
            `
            <div style="display:flex; flex-direction:column; align-items:center; gap:8px; width:100%;">
                <div style="background:#10b98122; border:1px solid #10b981; color:#a7f3d0; padding:8px 16px; border-radius:6px; font-size:11px; font-weight:700; text-align:center;">
                    Parent harvested status: WIFEXITED == true, exit code: 0<br>
                    <span style="color:#ffffff; font-size:10px; font-weight:normal;">Kernel unlinks child task_struct. Memory and process ID freed.</span>
                </div>
                <span style="color:#38bdf8; font-size:11px; font-weight:700;">✔ Life Cycle Complete</span>
            </div>
            `
        ];

        container.innerHTML = diagrams[stepIndex] || diagrams[0];
    }
};
