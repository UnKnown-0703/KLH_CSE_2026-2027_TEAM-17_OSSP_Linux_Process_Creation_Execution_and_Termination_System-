import os
import sys
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def build_full_report_batch17():
    doc = docx.Document()

    # Page setup - 1 inch margins all around
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)
        section.page_width = Inches(8.5)
        section.page_height = Inches(11.0)

    # Base styling
    normal_style = doc.styles['Normal']
    normal_font = normal_style.font
    normal_font.name = 'Calibri'
    normal_font.size = Pt(11)
    normal_font.color.rgb = RGBColor(0x22, 0x22, 0x22)

    def set_cell_bg(cell, fill_hex):
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
        cell._tc.get_or_add_tcPr().append(shd)

    def set_cell_pad(cell, top=100, bottom=100, left=150, right=150):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
        tcPr.append(tcMar)

    def add_page_break():
        doc.add_page_break()

    def add_chapter_heading(title_text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(20)
        p.paragraph_format.space_after = Pt(12)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(title_text)
        run.bold = True
        run.font.size = Pt(17)
        run.font.color.rgb = RGBColor(0x8B, 0x00, 0x00) # KL Dark Crimson

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(13.5)
        run.font.color.rgb = RGBColor(0x00, 0x33, 0x66) # Deep Navy

    def add_h3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(11.5)
        run.font.color.rgb = RGBColor(0x22, 0x22, 0x22)

    def add_p(text, bold_prefix=None, space_after=6, italic=False):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_pre = p.add_run(bold_prefix)
            r_pre.bold = True
        r = p.add_run(text)
        r.italic = italic
        return p

    def add_bullet(text, bold_prefix=None):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_pre = p.add_run(bold_prefix)
            r_pre.bold = True
        p.add_run(text)

    def add_code_block(code_text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.left_indent = Inches(0.2)
        p.paragraph_format.right_indent = Inches(0.2)
        p.paragraph_format.line_spacing = 1.05
        run = p.add_run(code_text)
        run.font.name = 'Consolas'
        run.font.size = Pt(9.5)
        run.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
        pPr = p._p.get_or_add_pPr()
        pBdr = parse_xml(f'<w:pBdr {nsdecls("w")}><w:left w:val="single" w:sz="24" w:space="15" w:color="003366"/></w:pBdr>')
        pPr.append(pBdr)
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="F1F5F9"/>')
        pPr.append(shd)

    # ==========================================
    # 1. TITLE / COVER PAGE
    # ==========================================
    p_logo = doc.add_paragraph()
    p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_logo.paragraph_format.space_before = Pt(10)
    p_logo.paragraph_format.space_after = Pt(14)
    if os.path.exists("results/klu_logo.png"):
        p_logo.add_run().add_picture("results/klu_logo.png", width=Inches(3.4))

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(10)
    p_title.paragraph_format.space_after = Pt(8)
    r = p_title.add_run("“Design and Development of Linux Process Creation, Execution, and Termination System”\n")
    r.bold = True
    r.font.size = Pt(19)
    r.font.color.rgb = RGBColor(0x8B, 0x00, 0x00)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(16)
    r = p_sub.add_run("A Project Report Submitted in partial fulfillment of the requirements\nfor the award of the degree of\n")
    r.font.size = Pt(11)
    r.font.color.rgb = RGBColor(0x44, 0x44, 0x44)
    r2 = p_sub.add_run("BACHELOR OF TECHNOLOGY\nIN\nCOMPUTER SCIENCE AND ENGINEERING\n")
    r2.bold = True
    r2.font.size = Pt(13)
    r2.font.color.rgb = RGBColor(0x00, 0x33, 0x66)

    p_by = doc.add_paragraph()
    p_by.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_by.paragraph_format.space_after = Pt(8)
    r = p_by.add_run("Submitted by (Batch - 17):\n")
    r.font.size = Pt(11)
    r.italic = True
    r.bold = True

    # Student Table - Batch 17
    t_stud = doc.add_table(rows=4, cols=2)
    t_stud.alignment = WD_TABLE_ALIGNMENT.CENTER
    stud_data = [
        ("STUDENT NAME", "ROLL NUMBER"),
        ("T.B.S.Sunil", "2520030605"),
        ("V.Prem Kumar", "2520030479"),
        ("G.B.VEDADITYA", "2520030481")
    ]
    for row_idx, (name, roll) in enumerate(stud_data):
        c0 = t_stud.cell(row_idx, 0)
        c1 = t_stud.cell(row_idx, 1)
        c0.text = name
        c1.text = roll
        set_cell_pad(c0, 50, 50, 100, 100)
        set_cell_pad(c1, 50, 50, 100, 100)
        if row_idx == 0:
            set_cell_bg(c0, "003366")
            set_cell_bg(c1, "003366")
            c0.paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
            c0.paragraphs[0].runs[0].bold = True
            c1.paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
            c1.paragraphs[0].runs[0].bold = True
        else:
            set_cell_bg(c0, "F8F9FA" if row_idx % 2 else "FFFFFF")
            set_cell_bg(c1, "F8F9FA" if row_idx % 2 else "FFFFFF")
            c0.paragraphs[0].runs[0].bold = True

    p_guide = doc.add_paragraph()
    p_guide.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_guide.paragraph_format.space_before = Pt(16)
    p_guide.paragraph_format.space_after = Pt(16)
    r = p_guide.add_run("Under the Esteemed Guidance of\n")
    r.font.size = Pt(11)
    r.italic = True
    r_g = p_guide.add_run("Dr. K. Anusha, M.Tech., Ph.D.\n")
    r_g.bold = True
    r_g.font.size = Pt(12)
    r_g.font.color.rgb = RGBColor(0x00, 0x33, 0x66)
    r_d = p_guide.add_run("Assistant Professor, Department of Computer Science and Engineering\n")
    r_d.font.size = Pt(10.5)

    p_univ = doc.add_paragraph()
    p_univ.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_univ.paragraph_format.space_before = Pt(12)
    r = p_univ.add_run("DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING\n")
    r.bold = True
    r.font.size = Pt(12)
    r.font.color.rgb = RGBColor(0x00, 0x33, 0x66)
    r = p_univ.add_run("K L (DEEMED TO BE) UNIVERSITY\n")
    r.bold = True
    r.font.size = Pt(13)
    r.font.color.rgb = RGBColor(0x8B, 0x00, 0x00)
    r = p_univ.add_run("KONERU LAKSHMAIAH EDUCATION FOUNDATION\n")
    r.bold = True
    r.font.size = Pt(11)
    r = p_univ.add_run("Off-Campus: Bachupally-Gandimaisamma Road, Bowrampet, Hyderabad, Telangana – 500 043\nPhone No: 7815926816 | www.klh.edu.in\nACADEMIC YEAR: 2026–2027 / 2025–2026, Term-I (Section: 4, Batch: 17)")
    r.font.size = Pt(9.5)
    r.font.color.rgb = RGBColor(0x55, 0x55, 0x55)

    add_page_break()

    # ==========================================
    # DECLARATION
    # ==========================================
    add_chapter_heading("DECLARATION")
    add_p(
        "The Project Report entitled “Linux Process Creation, Execution, and Termination System” is a record of "
        "bonafide work done and submitted by T.B.S.Sunil (2520030605), V.Prem Kumar (2520030479), and G.B.VEDADITYA (2520030481) "
        "(Batch - 17, Section: 4) in partial fulfillment for the award of B. Tech in Computer Science and Engineering to "
        "K L (Deemed to be) University. The results embodied in this report have not been copied from any other departments/University/Institute.",
        space_after=14
    )
    add_p(
        "We further confirm that all implementations, test results, system call routines, and telemetry data presented in this "
        "report were conceived and verified in our laboratory environment.",
        space_after=28
    )

    t_dec = doc.add_table(rows=4, cols=3)
    t_dec.alignment = WD_TABLE_ALIGNMENT.CENTER
    dec_heads = ["Candidate Name", "Registration No.", "Signature"]
    for i, h in enumerate(dec_heads):
        c = t_dec.cell(0, i)
        c.text = h
        set_cell_bg(c, "003366")
        c.paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        c.paragraphs[0].runs[0].bold = True
    c_rows = [
        ("T.B.S.Sunil", "2520030605"),
        ("V.Prem Kumar", "2520030479"),
        ("G.B.VEDADITYA", "2520030481")
    ]
    for r_i, (nm, reg) in enumerate(c_rows):
        c0, c1, c2 = t_dec.cell(r_i+1, 0), t_dec.cell(r_i+1, 1), t_dec.cell(r_i+1, 2)
        c0.text, c1.text, c2.text = nm, reg, ""
        set_cell_pad(c0, 60, 60, 100, 100)
        set_cell_pad(c1, 60, 60, 100, 100)
        set_cell_pad(c2, 60, 60, 100, 100)
        c0.paragraphs[0].runs[0].bold = True

    add_page_break()

    # ==========================================
    # CERTIFICATE
    # ==========================================
    add_chapter_heading("CERTIFICATE")
    add_p(
        "This is to certify that the mini-project-based report entitled “Linux Process Creation, Execution, and Termination System” "
        "is a bonafide work done and submitted by T.B.S.Sunil (2520030605), V.Prem Kumar (2520030479), and G.B.VEDADITYA (2520030481), "
        "representing Batch - 17, in partial fulfillment of the requirements for the award of the degree of "
        "BACHELOR OF TECHNOLOGY in DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING, K L (Deemed to be University), "
        "during the academic year 2026–2027 / 2025–2026.",
        space_after=40
    )

    t_cert = doc.add_table(rows=2, cols=3)
    t_cert.alignment = WD_TABLE_ALIGNMENT.CENTER
    sig_titles = [
        ("___________________________\nSignature of the Guide\nDr. K. Anusha\nAssistant Professor, CSE"),
        ("___________________________\nSignature of the Course Coordinator\nDr. K. Anusha\nAssistant Professor, CSE"),
        ("___________________________\nSignature of the HOD\nDr. P. Venkateswara Rao\nHead of Department, CSE")
    ]
    for i, title in enumerate(sig_titles):
        c = t_cert.cell(1, i)
        c.text = title
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.runs[0].font.size = Pt(9.5)
        p.runs[0].bold = True

    add_page_break()

    # ==========================================
    # ACKNOWLEDGEMENT
    # ==========================================
    add_chapter_heading("ACKNOWLEDGEMENT")
    add_p(
        "The success in this project would not have been possible but for the timely help and guidance rendered by many people. "
        "We wish to express our sincere thanks to all those who have assisted us in one way or the other for the completion of our project.",
        space_after=10
    )
    add_p(
        "Our greatest appreciation to our Course Coordinator Dr. K. Anusha, and our guide Dr. K. Anusha, Department of Computer Science "
        "which cannot be expressed in words for her tremendous support, encouragement, technical insights, and guidance for this project.",
        space_after=10
    )
    add_p(
        "We express our gratitude to Dr. P. Venkateswara Rao (CSE), Head of the Department for Computer Science Engineering for providing "
        "us with adequate facilities, ways and means by which we are able to complete this project-based Lab.",
        space_after=10
    )
    add_p(
        "We thank Faculty Supervisor Soumya Enukonda and all the members of teaching and non-teaching staff members who have assisted us "
        "directly or indirectly for successful completion of this project. Finally, we sincerely thank our parents, friends, and classmates "
        "for their kind help and cooperation during our work.",
        space_after=24
    )
    p_names = doc.add_paragraph()
    p_names.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r = p_names.add_run(
        "Batch - 17\n"
        "T.B.S.Sunil (2520030605)\n"
        "V.Prem Kumar (2520030479)\n"
        "G.B.VEDADITYA (2520030481)\n"
        "Department of Computer Science & Engineering\n"
        "K L (Deemed to be) University, Hyderabad"
    )
    r.bold = True
    r.font.size = Pt(10)

    add_page_break()

    # ==========================================
    # ABSTRACT
    # ==========================================
    add_chapter_heading("ABSTRACT")
    add_p(
        "Process management is a fundamental concept in Operating Systems, governing how computer programs are created, isolated, "
        "scheduled, synchronized, and terminated within modern computing environments. In Linux, every executing task operates as an "
        "autonomous entity possessing its own virtual address space, file descriptor table, and execution context. Understanding the "
        "relationship between process creation, program execution, parent-child synchronization, and resource reclamation can be "
        "challenging through theoretical abstractions alone.",
        space_after=10
    )
    add_p(
        "The “Linux Process Creation, Execution, and Termination System” addresses this pedagogical and engineering challenge by delivering "
        "a robust, Linux-native software application implemented in C using standard POSIX system calls and the GNU Compiler Collection (GCC). "
        "Developed by Batch - 17, the project is structured around three interconnected, modular components:",
        space_after=8
    )
    add_bullet("Module 1 (Process Creation & Program Execution - T.B.S.Sunil): Uses fork() to clone parent processes via Copy-On-Write (COW) and executes external binaries via the exec() family (execvp), illustrating virtual address space replacement (Text, Data, Heap, Stack).")
    add_bullet("Module 2 (Process Synchronization & Termination Handling - V.Prem Kumar): Implements parent-child synchronization using wait() and waitpid() with the WNOHANG non-blocking option, decodes 8-bit exit codes and signal terminations using POSIX status macros (WIFEXITED, WEXITSTATUS, WIFSIGNALED, WTERMSIG), and enforces proper resource cleanup via exit().")
    add_bullet("Module 3 (Process Monitoring & Kernel Anomaly Simulation - G.B.VEDADITYA): Retrieves kernel process identifiers via getpid() and getppid(), inspects real-time process states directly from the Linux /proc virtual filesystem (/proc/<pid>/status), and safely demonstrates Zombie processes (defunct state) and Orphan processes (adoption by PID 1 / init / systemd).")
    add_p(
        "To provide high observability, the platform features a dual-mode telemetry engine: rich ANSI-colored terminal output for command-line "
        "sessions, and structured JSON streaming connected to an interactive web visualization dashboard built with pure Node.js (strictly zero "
        "external npm packages, no Python). All six core operational scenarios were verified on Ubuntu 24.04 LTS (WSL2) with 100% pass rates, "
        "connecting operating systems theory directly with actual Linux kernel mechanisms.",
        space_after=12
    )
    add_p("Keywords: Linux Kernel, Process Lifecycle, fork(), execvp(), waitpid(), Zombie Process, Orphan Process, /proc filesystem, POSIX, Systems Programming, Batch 17.", bold_prefix="Index Terms: ", italic=True)

    add_page_break()

    # ==========================================
    # INDEX (TABLE OF CONTENTS)
    # ==========================================
    add_chapter_heading("TABLE OF CONTENTS")
    
    t_idx = doc.add_table(rows=1, cols=4)
    t_idx.alignment = WD_TABLE_ALIGNMENT.CENTER
    idx_heads = ["S. No.", "Chapter", "Topics / Subtopics", "Page No."]
    for i, h in enumerate(idx_heads):
        c = t_idx.cell(0, i)
        c.text = h
        set_cell_bg(c, "003366")
        c.paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        c.paragraphs[0].runs[0].bold = True

    index_rows = [
        ("", "Acknowledgement", "", "i"),
        ("", "Abstract", "", "ii"),
        ("1", "Introduction", "1.1 Background of the Project\n1.2 Problem Statement\n1.3 Scope of the Project\n1.4 Objectives of the Project\n1.5 Team Responsibilities (Batch-17)\n1.6 Importance of the Application\n1.7 Target Users / Audience", "1–5"),
        ("2", "OS Concepts and Background Study", "2.1 Operating System Concepts Related to the Project\n2.2 Existing Methods / Algorithms\n2.3 Proposed Approach\n2.4 Advantages of the Proposed Approach", "6–12"),
        ("3", "System Requirements", "3.1 Hardware Requirements\n3.2 Software Requirements\n3.3 Operating System Environment – Ubuntu / WSL\n3.4 Development Tools and Compilers", "13–17"),
        ("4", "Technology and Tools Used", "4.1 C / C++ Programming\n4.2 GCC Compiler\n4.3 Linux System Calls\n4.4 POSIX Threads / Synchronization\n4.5 Linux Commands and Utilities\n4.6 Other Tools / Libraries Used", "18–22"),
        ("5", "System Architecture and Design", "5.1 Overall System Architecture\n5.2 System Workflow\n5.3 Flowchart / Data Flow\n5.4 Module Description\n5.5 Input and Output Design", "23–29"),
        ("6", "Implementation", "6.1 Module-wise Implementation\n6.2 Algorithm / Pseudocode\n6.3 Core C / C++ Implementation\n6.4 Linux System Calls / APIs Used\n6.5 Process / Thread Implementation\n6.6 IPC / Synchronization Implementation\n6.7 Memory Management Implementation\n6.8 Optional User Interface Implementation", "30–45"),
        ("7", "Execution and Demonstration", "7.1 Compilation in Ubuntu\n7.2 Execution Commands\n7.3 Sample Inputs and Outputs\n7.4 Screenshots of Execution (Figures 7.1–7.4)\n7.5 Demonstration of OS Concepts (TC-01 to TC-06)", "46–53"),
        ("8", "Conclusion", "8.1 Summary of the Project\n8.2 Objectives Achieved\n8.3 Results Achieved\n8.4 Skills and Learning Outcomes", "54–57"),
        ("9", "References", "9.1 Books\n9.2 Research Papers\n9.3 Linux / GNU Documentation\n9.4 Online Resources", "58–60")
    ]

    for s_no, chap, topics, p_no in index_rows:
        row = t_idx.add_row()
        c0, c1, c2, c3 = row.cells
        c0.text, c1.text, c2.text, c3.text = s_no, chap, topics, p_no
        set_cell_pad(c0, 45, 45, 70, 70)
        set_cell_pad(c1, 45, 45, 70, 70)
        set_cell_pad(c2, 45, 45, 70, 70)
        set_cell_pad(c3, 45, 45, 70, 70)
        c0.paragraphs[0].runs[0].bold = True
        c1.paragraphs[0].runs[0].bold = True

    add_page_break()

    # ==========================================
    # CHAPTER 1: INTRODUCTION
    # ==========================================
    add_chapter_heading("CHAPTER 1\nINTRODUCTION")
    
    add_h2("1.1 Background of the Project")
    add_p(
        "In modern computer systems, the Operating System acts as the primary resource manager and execution supervisor for software "
        "applications. At the heart of this abstraction lies the concept of a Process—defined as an active, executing program instance. "
        "A process encapsulates executable machine instructions, private virtual memory segments (text, initialized data, BSS, heap, stack), "
        "processor registers, and kernel metadata stored in a Process Control Block (represented by task_struct in Linux).",
        space_after=8
    )
    add_p(
        "UNIX-based operating systems, and Linux in particular, implement a distinct two-stage process creation philosophy. Instead of launching "
        "a binary into a fresh process through a monolithic system call (such as Windows CreateProcess API), Linux separates creation from "
        "execution into two independent primitives: fork() clones the parent process via Copy-On-Write (COW), while exec() replaces the "
        "virtual memory space with a new executable. This design gives systems programmers extraordinary control to configure file descriptors, "
        "set environment variables, and manage execution contexts prior to executing new programs.",
        space_after=10
    )

    add_h2("1.2 Problem Statement")
    add_p(
        "While process management is a cornerstone of Computer Science education, students frequently face hurdles when reconciling theoretical "
        "state diagrams with real kernel behavior:",
        space_after=6
    )
    add_bullet("Theoretical Abstraction: Textbooks depict transitions (Running, Ready, Blocked, Zombie, Terminated) through static diagrams without showing actual task_struct transitions.")
    add_bullet("Hidden Lifecycle Anomalies: Pathological conditions such as Zombie processes (accumulating entries in the kernel process table) and Orphan processes (parent terminating before child) are difficult to reproduce and observe safely in generic classroom environments.")
    add_bullet("Lack of Live Observability: Conventional command-line exercises execute silently or produce raw text output, leaving students unable to witness PID inheritance, Copy-On-Write memory behavior, or kernel reparenting by PID 1 (init / systemd).")

    add_h2("1.3 Scope of the Project")
    add_p(
        "The scope of this project encompasses the design, implementation, testing, and interactive demonstration of an end-to-end "
        "Linux Process Lifecycle Management System:",
        space_after=6
    )
    add_bullet("Implementation in C (C99 standard with GNU extensions) running on genuine Linux kernel environments (Ubuntu 24.04 LTS / WSL2).")
    add_bullet("Deterministic execution of six core lifecycle scenarios: Standard Lifecycle, Zombie Process Simulation, Orphan Reparenting, Non-blocking Polling (WNOHANG), Signal Interruption (SIGKILL), and Custom Binary Execution.")
    add_bullet("Live kernel telemetry extraction directly from the Linux /proc virtual filesystem (/proc/<pid>/status).")
    add_bullet("Dual-stream visualization: formatted ANSI console logs and an interactive browser-based dashboard powered by Node.js.")

    add_h2("1.4 Objectives of the Project")
    add_bullet("To understand and demonstrate the complete Linux process lifecycle using real POSIX system calls.", bold_prefix="1. Lifecycle Demonstration: ")
    add_bullet("To create child processes using fork() and execute external programs using the exec() family (execvp), illustrating memory image substitution.", bold_prefix="2. Creation & Execution: ")
    add_bullet("To synchronize parent-child processes using blocking wait() and non-blocking waitpid(WNOHANG).", bold_prefix="3. Synchronization & Monitoring: ")
    add_bullet("To analyze process termination, decode 8-bit exit codes and signal terminations using POSIX macros, and demonstrate anomaly mitigation (preventing zombie leaks and handling orphan adoption).", bold_prefix="4. Termination & Cleanup: ")

    add_h2("1.5 Team Responsibilities (Batch - 17)")
    add_p("The project development responsibilities were assigned among the team members as follows:", space_after=6)
    
    t_resp = doc.add_table(rows=4, cols=3)
    t_resp.alignment = WD_TABLE_ALIGNMENT.CENTER
    resp_heads = ["Roll Number", "Student Name", "Individual Responsibility & Focus"]
    for i, h in enumerate(resp_heads):
        c = t_resp.cell(0, i)
        c.text = h
        set_cell_bg(c, "003366")
        c.paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        c.paragraphs[0].runs[0].bold = True
    resp_rows = [
        ("2520030605", "T.B.S.Sunil", "Process creation using fork(), program execution using the exec() family (execvp), and virtual address space duplication."),
        ("2520030479", "V.Prem Kumar", "Parent-child synchronization using wait()/waitpid(), non-blocking WNOHANG monitoring, and exit status decoding."),
        ("2520030481", "G.B.VEDADITYA", "PID/PPID identification, process status observation via /proc virtual filesystem, testing, debugging, and documentation.")
    ]
    for r_i, (roll, nm, resp) in enumerate(resp_rows):
        c0, c1, c2 = t_resp.cell(r_i+1, 0), t_resp.cell(r_i+1, 1), t_resp.cell(r_i+1, 2)
        c0.text, c1.text, c2.text = roll, nm, resp
        set_cell_pad(c0, 45, 45, 70, 70)
        set_cell_pad(c1, 45, 45, 70, 70)
        set_cell_pad(c2, 45, 45, 70, 70)
        c0.paragraphs[0].runs[0].bold = True

    add_h2("1.6 Importance of the Application")
    add_p(
        "Mastering Linux process mechanics is essential for systems programming, systems architecture, cloud computing, and containerization. "
        "Modern cloud runtimes (Docker, containerd, Kubernetes) rely on Linux process namespaces, cgroups, and process lifecycle signals to "
        "orchestrate microservices. This project bridges theoretical operating systems concepts with practical systems engineering.",
        space_after=8
    )

    add_h2("1.7 Target Users / Audience")
    add_bullet("Undergraduate Engineering Students: Seeking practical validation of operating system concepts.")
    add_bullet("Faculty & Lab Evaluators: Requiring an automated, reproducible suite for laboratory demonstrations and viva assessments.")
    add_bullet("Systems Programmers: Investigating low-level process synchronization and /proc telemetry extraction.")

    add_page_break()

    # ==========================================
    # CHAPTER 2: OS CONCEPTS AND BACKGROUND STUDY
    # ==========================================
    add_chapter_heading("CHAPTER 2\nOS CONCEPTS AND BACKGROUND STUDY")
    
    add_h2("2.1 Operating System Concepts Related to the Project")
    add_p("The project directly implements and demonstrates five fundamental Operating System concepts:", space_after=6)
    add_p(
        "1. Process Control Block (task_struct): In Linux, every process is represented internally by task_struct (defined in <linux/sched.h>). "
        "It stores process identifiers (PID, PPID), execution state (TASK_RUNNING, TASK_INTERRUPTIBLE, TASK_ZOMBIE), virtual memory descriptors "
        "(mm_struct), open file tables (files_struct), and scheduling priority.",
        bold_prefix="A. Process Control Block: ", space_after=6
    )
    add_p(
        "2. Copy-On-Write (COW): When fork() executes, the Linux kernel optimizes memory usage by not duplicating physical pages immediately. "
        "Instead, child page table entries reference the parent's physical frames marked read-only. A private physical copy is created only when "
        "either process writes to a page, maximizing speed and efficiency.",
        bold_prefix="B. Copy-On-Write: ", space_after=6
    )
    add_p(
        "3. Image Replacement via exec(): The exec() system call family discards the existing process image (text, data, heap, stack) and loads a new "
        "executable binary into the same process context. The PID and parent-child hierarchy remain invariant.",
        bold_prefix="C. Image Replacement: ", space_after=6
    )
    add_p(
        "4. Zombie (Defunct) State: When a child process terminates via exit(), its memory pages are deallocated, but its task_struct remains in the "
        "process table so its parent can collect its termination code via waitpid(). If the parent fails to reap the child, it remains a zombie ('Z').",
        bold_prefix="D. Zombie State: ", space_after=6
    )
    add_p(
        "5. Orphan Process & Reparenting: If a parent terminates before its child, the child becomes an orphan. The Linux kernel reparents the orphan "
        "to the system root process—init (PID 1) or systemd—which continuously reaps terminated children.",
        bold_prefix="E. Orphan Reparenting: ", space_after=10
    )

    add_h2("2.2 Existing Methods / Algorithms")
    add_p("Conventional lab approaches typically use isolated C code snippets with several limitations:", space_after=4)
    add_bullet("Fragmented understanding: fork(), exec(), and wait() are practiced in separate files rather than as a cohesive system.")
    add_bullet("Silent execution: Standard test scripts print minimal console output, leaving kernel-level transitions invisible.")
    add_bullet("Lack of /proc integration: Standard labs do not inspect the kernel virtual filesystem to verify Zombie state 'Z' or init reparenting.")

    add_h2("2.3 Proposed Approach")
    add_p("Our approach provides an integrated, modular systems programming suite:", space_after=4)
    add_bullet("Modular C Engine: Clear division of labor across creation, synchronization, and monitoring modules.")
    add_bullet("Live Kernel Inspection: Direct queries to /proc/<pid>/status to observe actual kernel task states.")
    add_bullet("Dual Telemetry Engine: Real-time ANSI colored terminal output alongside structured JSON event streams.")
    add_bullet("Interactive Dashboard: A zero-dependency Node.js visualizer featuring interactive lifecycle state machines.")

    add_h2("2.4 Advantages of the Proposed Approach")
    add_bullet("100% Deterministic and Safe: Built-in timeouts prevent terminal hangs and process table exhaustion.")
    add_bullet("Zero External Dependencies: Native POSIX C backend with zero-npm Node.js server.")
    add_bullet("Deep Observability: Exposes system call return codes, PID/PPID inheritance, and exit status decoding in real time.")

    add_page_break()

    # ==========================================
    # CHAPTER 3: SYSTEM REQUIREMENTS
    # ==========================================
    add_chapter_heading("CHAPTER 3\nSYSTEM REQUIREMENTS")
    
    add_h2("3.1 Hardware Requirements")
    t_hw = doc.add_table(rows=6, cols=3)
    t_hw.alignment = WD_TABLE_ALIGNMENT.CENTER
    hw_heads = ["Component", "Minimum Requirement", "Recommended Specification"]
    for i, h in enumerate(hw_heads):
        c = t_hw.cell(0, i)
        c.text = h
        set_cell_bg(c, "003366")
        c.paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        c.paragraphs[0].runs[0].bold = True
    hw_specs = [
        ("Processor (CPU)", "Intel Core i3 / AMD Ryzen 3 (Dual Core)", "Intel Core i5 / AMD Ryzen 5 (Quad Core+)"),
        ("System Memory (RAM)", "4 GB DDR3/DDR4", "8 GB / 16 GB DDR4"),
        ("Storage", "1 GB available space", "5 GB SSD storage"),
        ("Virtualization", "VT-x / AMD-V enabled in BIOS", "Hardware virtualization enabled"),
        ("Display", "1280 x 720 (HD)", "1920 x 1080 (Full HD)")
    ]
    for r_i, (comp, req, rec) in enumerate(hw_specs):
        c0, c1, c2 = t_hw.cell(r_i+1, 0), t_hw.cell(r_i+1, 1), t_hw.cell(r_i+1, 2)
        c0.text, c1.text, c2.text = comp, req, rec
        set_cell_pad(c0, 45, 45, 70, 70)
        set_cell_pad(c1, 45, 45, 70, 70)
        set_cell_pad(c2, 45, 45, 70, 70)
        c0.paragraphs[0].runs[0].bold = True

    add_h2("3.2 Software Requirements")
    add_bullet("Host OS: Windows 10/11 (64-bit) with WSL2 enabled, or native Linux distribution.")
    add_bullet("Linux Distribution: Ubuntu 24.04 LTS (Noble Numbat) or Ubuntu 22.04 LTS.")
    add_bullet("Kernel Version: Linux Kernel 6.18+ (WSL2 virtualized or native).")
    add_bullet("C Runtime: GNU C Library (glibc 2.39+).")
    add_bullet("Web Server Runtime: Node.js (v18.x, v20.x, or v22.x).")
    add_bullet("Web Browser: Google Chrome, Mozilla Firefox, or Microsoft Edge.")

    add_h2("3.3 Operating System Environment – Ubuntu / WSL")
    add_p(
        "The system executes inside Ubuntu 24.04 LTS via WSL2. This provides full Linux kernel compatibility, genuine POSIX system call dispatching, "
        "and complete access to the virtual /proc filesystem.",
        space_after=8
    )

    add_h2("3.4 Development Tools and Compilers")
    add_bullet("GNU Compiler Collection (GCC): GCC 15.2.0 / GCC 13.x with -Wall -Wextra -O2 -g.", bold_prefix="GCC Compiler: ")
    add_bullet("GNU Make: Version 4.3 for automated build pipeline management.", bold_prefix="Make Build System: ")
    add_bullet("Visual Studio Code: With Remote-WSL and C/C++ tooling extensions.", bold_prefix="IDE: ")
    add_bullet("Git: Version control and repository management.", bold_prefix="Git: ")

    add_page_break()

    # ==========================================
    # CHAPTER 4: TECHNOLOGY AND TOOLS USED
    # ==========================================
    add_chapter_heading("CHAPTER 4\nTECHNOLOGY AND TOOLS USED")
    
    add_h2("4.1 C / C++ Programming")
    add_p(
        "The core system is implemented in ISO C99 with _GNU_SOURCE extensions. C provides direct kernel interfacing, deterministic memory layout, "
        "and zero runtime overhead.",
        space_after=8
    )

    add_h2("4.2 GCC Compiler")
    add_p("The project is compiled with strict flags to ensure clean code hygiene with zero warnings:", space_after=4)
    add_code_block("gcc -Wall -Wextra -O2 -g src/main.c src/module_creation.c src/module_sync.c src/module_monitor.c -o bin/process_system")

    add_h2("4.3 Linux System Calls")
    t_sys = doc.add_table(rows=8, cols=3)
    t_sys.alignment = WD_TABLE_ALIGNMENT.CENTER
    sys_heads = ["System Call", "Header File", "Purpose in Project"]
    for i, h in enumerate(sys_heads):
        c = t_sys.cell(0, i)
        c.text = h
        set_cell_bg(c, "003366")
        c.paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        c.paragraphs[0].runs[0].bold = True
    sys_calls = [
        ("fork()", "<unistd.h>", "Clones the caller process; returns 0 to child and child PID to parent."),
        ("execvp()", "<unistd.h>", "Replaces current process memory with executable searched from PATH."),
        ("wait()", "<sys/wait.h>", "Blocks parent execution until any child process terminates."),
        ("waitpid()", "<sys/wait.h>", "Waits for a specific child PID with optional non-blocking flag (WNOHANG)."),
        ("exit()", "<stdlib.h>", "Flushes I/O streams and terminates process with an 8-bit status code."),
        ("getpid(), getppid()", "<unistd.h>", "Retrieves Process ID and Parent Process ID."),
        ("kill()", "<signal.h>", "Sends asynchronous signals (e.g., SIGKILL / 9) to target processes.")
    ]
    for r_i, (sc, hdr, purp) in enumerate(sys_calls):
        c0, c1, c2 = t_sys.cell(r_i+1, 0), t_sys.cell(r_i+1, 1), t_sys.cell(r_i+1, 2)
        c0.text, c1.text, c2.text = sc, hdr, purp
        set_cell_pad(c0, 45, 45, 70, 70)
        set_cell_pad(c1, 45, 45, 70, 70)
        set_cell_pad(c2, 45, 45, 70, 70)
        c0.paragraphs[0].runs[0].bold = True

    add_h2("4.4 POSIX Threads / Synchronization")
    add_p(
        "Process synchronization is enforced via waitpid(). When non-blocking monitoring is selected, the parent utilizes waitpid(child, &status, WNOHANG) "
        "inside a timed polling loop, allowing concurrent parent activity without freezing.",
        space_after=8
    )

    add_h2("4.5 Linux Commands and Utilities")
    add_bullet("ps -eo pid,ppid,stat,cmd: Inspects live process states ('Z' for zombie).")
    add_bullet("cat /proc/<pid>/status: Reads task_struct telemetry directly.")

    add_h2("4.6 Other Tools / Libraries Used")
    add_p(
        "Node.js Backend: A lightweight HTTP server (server.js) implemented in vanilla JavaScript with zero external npm packages and strictly "
        "no Python. It runs the compiled C binary via child_process.exec() and streams JSON telemetry to the browser.",
        space_after=8
    )

    add_page_break()

    # ==========================================
    # CHAPTER 5: SYSTEM ARCHITECTURE AND DESIGN
    # ==========================================
    add_chapter_heading("CHAPTER 5\nSYSTEM ARCHITECTURE AND DESIGN")
    
    add_h2("5.1 Overall System Architecture")
    add_p("The system is designed with a clean three-tier architecture:", space_after=4)
    add_bullet("Tier 1 (Kernel Space): Linux kernel managing the process table, COW memory pages, signals, and /proc.", bold_prefix="Kernel Subsystem: ")
    add_bullet("Tier 2 (C Systems Programming Engine): Compiled binary running module_creation.c, module_sync.c, and module_monitor.c.", bold_prefix="C Core Engine: ")
    add_bullet("Tier 3 (Presentation & Telemetry): Formatted ANSI terminal stream and a lightweight web dashboard.", bold_prefix="Presentation Layer: ")

    add_h2("5.2 System Workflow")
    add_bullet("Phase 1: Parent initializes and logs initial PID and PPID via getpid() and getppid().")
    add_bullet("Phase 2: Parent executes fork(). Kernel clones address space via Copy-On-Write.")
    add_bullet("Phase 3: Child branches (fork() == 0) and calls execvp() to load the requested binary.")
    add_bullet("Phase 4: Parent branches (fork() > 0) and enters waitpid(), blocking or polling with WNOHANG.")
    add_bullet("Phase 5: Child terminates; parent reaps status and decodes exit code using POSIX macros.")

    add_h2("5.3 Flowchart / Data Flow")
    add_code_block(
        "                     +---------------------------+\n"
        "                     |    Start Parent Process   |\n"
        "                     |  (Display PID and PPID)   |\n"
        "                     +---------------------------+\n"
        "                                   |\n"
        "                               fork()\n"
        "                                   |\n"
        "                +------------------+------------------+\n"
        "                |                                     |\n"
        "           [PID == 0]                            [PID > 0]\n"
        "                |                                     |\n"
        "       +-------------------+                 +-------------------+\n"
        "       |   Child Process   |                 |   Parent Process  |\n"
        "       +-------------------+                 +-------------------+\n"
        "                |                                     |\n"
        "           execvp(cmd)                         waitpid(child_pid)\n"
        "                |                                     |\n"
        "       +-------------------+                          |\n"
        "       | Execute Program   |                          |\n"
        "       +-------------------+                          |\n"
        "                |                                     |\n"
        "           exit(code)                                 |\n"
        "                |                                     |\n"
        "       +-------------------+                          |\n"
        "       |    Zombie State   |------------------------->|\n"
        "       +-------------------+                   Reap Child & Read Status\n"
        "                                                      |\n"
        "                                             +-------------------+\n"
        "                                             | Status Decoded    |\n"
        "                                             | (WIFEXITED / etc) |\n"
        "                                             +-------------------+\n"
        "                                                      |\n"
        "                                             +-------------------+\n"
        "                                             |   Clean Exit      |\n"
        "                                             +-------------------+"
    )

    add_h2("5.4 Module Description")
    add_bullet("Module 1 (module_creation.c): Handles fork() encapsulation, error verification, and execvp() execution.", bold_prefix="Module 1: ")
    add_bullet("Module 2 (module_sync.c): Implements blocking waitpid(), non-blocking WNOHANG polling, and exit status decoding.", bold_prefix="Module 2: ")
    add_bullet("Module 3 (module_monitor.c): Direct /proc/<pid>/status parsing, Zombie simulation, and Orphan reparenting tests.", bold_prefix="Module 3: ")

    add_h2("5.5 Input and Output Design")
    add_p("Input: Scenario arguments from CLI or REST API (normal, zombie, orphan, nonblocking, signal, custom).", space_after=4)
    add_p("Output: Dual formatting: ANSI color terminal output and JSON event streams ({type, time, phase, syscall, pid, ppid, state, message}).", space_after=8)

    add_page_break()

    # ==========================================
    # CHAPTER 6: IMPLEMENTATION
    # ==========================================
    add_chapter_heading("CHAPTER 6\nIMPLEMENTATION")
    
    add_h2("6.1 Module-wise Implementation")
    add_bullet("process_lifecycle.h: Declares ANSI color codes, state macros, and API prototypes.")
    add_bullet("module_creation.c: Implements create_child_process() and execute_program().")
    add_bullet("module_sync.c: Implements wait_for_child(), monitor_child_nonblocking(), and decode_exit_status().")
    add_bullet("module_monitor.c: Implements get_proc_state(), run_zombie_simulation(), and run_orphan_simulation().")
    add_bullet("main.c: CLI parsing, scenario routing, and unified logging.")

    add_h2("6.2 Algorithm / Pseudocode")
    add_code_block(
        "ALGORITHM StandardLifecycle(cmd, argv, json_mode):\n"
        "    parent_pid = getpid()\n"
        "    parent_ppid = getppid()\n"
        "    emit_event(\"INIT\", \"getpid()\", parent_pid, parent_ppid)\n"
        "    child_pid = fork()\n"
        "    IF child_pid < 0 THEN\n"
        "        emit_event(\"ERROR\", \"fork() failed\")\n"
        "        RETURN -1\n"
        "    ELSE IF child_pid == 0 THEN\n"
        "        emit_event(\"CREATION\", \"fork() -> 0\", getpid(), getppid())\n"
        "        execvp(cmd, argv)\n"
        "        emit_event(\"ERROR\", \"execvp() failed\")\n"
        "        exit(127)\n"
        "    ELSE\n"
        "        emit_event(\"SYNCHRONIZATION\", \"waitpid()\", parent_pid, parent_ppid)\n"
        "        waitpid(child_pid, &status, 0)\n"
        "        decode_status(status)\n"
        "        emit_event(\"TERMINATION\", \"reaped\", child_pid, parent_pid)\n"
        "        RETURN 0\n"
        "    END IF\n"
        "END ALGORITHM"
    )

    add_h2("6.3 Core C / C++ Implementation")
    add_p("Listing 6.1: Process Creation in module_creation.c (Authored by T.B.S.Sunil)", bold_prefix="Creation: ", space_after=4)
    add_code_block(
        "pid_t create_child_process(int json_mode) {\n"
        "    pid_t parent_pid = getpid();\n"
        "    pid_t ppid = getppid();\n"
        "    emit_event(json_mode, \"CREATION\", \"fork()\", parent_pid, ppid, STATE_RUNNING,\n"
        "               \"Parent process initiating fork() system call.\");\n"
        "    pid_t pid = fork();\n"
        "    if (pid < 0) {\n"
        "        emit_event(json_mode, \"ERROR\", \"fork()\", parent_pid, ppid, STATE_TERMINATED, strerror(errno));\n"
        "        return -1;\n"
        "    }\n"
        "    if (pid == 0) {\n"
        "        emit_event(json_mode, \"CREATION\", \"fork() -> 0\", getpid(), getppid(), STATE_READY,\n"
        "                   \"Inside child process! fork() returned 0. PCB initialized.\");\n"
        "    } else {\n"
        "        char msg[128];\n"
        "        snprintf(msg, sizeof(msg), \"Parent received child PID %d from fork().\", pid);\n"
        "        emit_event(json_mode, \"CREATION\", \"fork() -> child_pid\", parent_pid, ppid, STATE_RUNNING, msg);\n"
        "    }\n"
        "    return pid;\n"
        "}"
    )

    add_p("Listing 6.2: Exit Status Decoding in module_sync.c (Authored by V.Prem Kumar)", bold_prefix="Decoding: ", space_after=4)
    add_code_block(
        "void decode_exit_status(pid_t pid, int status, int json_mode) {\n"
        "    char msg[256];\n"
        "    if (WIFEXITED(status)) {\n"
        "        int exit_code = WEXITSTATUS(status);\n"
        "        snprintf(msg, sizeof(msg), \"Child PID %d terminated normally with exit status: %d (0x%02X).\",\n"
        "                 pid, exit_code, exit_code);\n"
        "        emit_event(json_mode, \"TERMINATION\", \"WIFEXITED\", pid, getpid(), STATE_TERMINATED, msg);\n"
        "    } else if (WIFSIGNALED(status)) {\n"
        "        int sig = WTERMSIG(status);\n"
        "        snprintf(msg, sizeof(msg), \"Child PID %d KILLED by signal %d (%s).\",\n"
        "                 pid, sig, strsignal(sig));\n"
        "        emit_event(json_mode, \"TERMINATION\", \"WIFSIGNALED\", pid, getpid(), STATE_TERMINATED, msg);\n"
        "    }\n"
        "}"
    )

    add_h2("6.4 Linux System Calls / APIs Used")
    add_p("System calls handle errors via errno (EAGAIN, ENOMEM, ENOENT). POSIX status macros unpack raw integer wait results into 8-bit codes.", space_after=8)

    add_h2("6.5 Process / Thread Implementation")
    add_p("Each process maintains an isolated virtual address space, preventing corrupted pointers in children from affecting parent processes.", space_after=8)

    add_h2("6.6 IPC / Synchronization Implementation")
    add_p("Synchronization relies on kernel wait queues. Blocking waitpid() puts the parent into sleep until woken by SIGCHLD; non-blocking WNOHANG polls immediately.", space_after=8)

    add_h2("6.7 Memory Management Implementation")
    add_p("Linux Copy-On-Write (COW) defers physical memory duplication until write time. execvp() replaces all virtual memory mappings with the new program binary.", space_after=8)

    add_h2("6.8 Optional User Interface Implementation")
    add_p("A modern browser visualizer hosted by server.js (Node.js HTTP engine) renders interactive state diagrams and live event timelines.", space_after=8)

    add_page_break()

    # ==========================================
    # CHAPTER 7: EXECUTION AND DEMONSTRATION
    # ==========================================
    add_chapter_heading("CHAPTER 7\nEXECUTION AND DEMONSTRATION")
    
    add_h2("7.1 Compilation in Ubuntu")
    add_p("Building the project inside Ubuntu 24.04 LTS (WSL2):", space_after=4)
    add_code_block(
        "$ cd /mnt/e/KLU/Y2--S1/OS&SY/Team_17_OSSP/Project/c_src\n"
        "$ make\n"
        "gcc -Wall -Wextra -O2 -g -c main.c -o main.o\n"
        "gcc -Wall -Wextra -O2 -g -c module_creation.c -o module_creation.o\n"
        "gcc -Wall -Wextra -O2 -g -c module_sync.c -o module_sync.o\n"
        "gcc -Wall -Wextra -O2 -g -c module_monitor.c -o module_monitor.o\n"
        "gcc main.o module_creation.o module_sync.o module_monitor.o -o ../bin/process_system\n"
        "Build complete: ../bin/process_system generated cleanly with 0 errors and 0 warnings."
    )

    add_h2("7.2 Execution Commands")
    add_bullet("./bin/process_system normal ls -la       # Scenario 1: Standard Lifecycle")
    add_bullet("./bin/process_system zombie              # Scenario 2: Zombie Simulation")
    add_bullet("./bin/process_system orphan              # Scenario 3: Orphan Simulation")
    add_bullet("./bin/process_system nonblocking         # Scenario 4: Non-blocking waitpid(WNOHANG)")
    add_bullet("./bin/process_system signal 9            # Scenario 5: Signal Termination (SIGKILL)")
    add_bullet("./bin/process_system custom whoami       # Scenario 6: Custom Command")

    add_h2("7.3 Sample Inputs and Outputs")
    add_p("Output: Standard Lifecycle Execution (Terminal Stream)", bold_prefix="Terminal Log: ", space_after=4)
    add_code_block(
        "[15:34:40] getpid()       [INIT    ] (PID:  1204 | PPID:   890) [RUNNING ] Starting Standard Lifecycle\n"
        "[15:34:40] fork()         [CREATION] (PID:  1204 | PPID:   890) [RUNNING ] Parent initiating fork()\n"
        "[15:34:40] fork() -> child[CREATION] (PID:  1204 | PPID:   890) [RUNNING ] Parent received child PID 1205\n"
        "[15:34:40] fork() -> 0    [CREATION] (PID:  1205 | PPID:  1204) [READY   ] Inside child! PCB initialized\n"
        "[15:34:40] execvp()       [EXECUTN ] (PID:  1205 | PPID:  1204) [RUNNING ] Replacing image with 'ls'\n"
        "total 36\n"
        "-rwxrwxr-x 1 user user 66048 Oct  4 22:30 process_system\n"
        "[15:34:40] waitpid()      [SYNCHRON] (PID:  1204 | PPID:   890) [WAITING ] Parent entering waitpid(1205)\n"
        "[15:34:40] waitpid reaped [SYNCHRON] (PID:  1204 | PPID:   890) [RUNNING ] Reaped child 1205. PCB unlinked\n"
        "[15:34:40] WIFEXITED      [TERMINAT] (PID:  1205 | PPID:  1204) [TERMINAT] Child exited normally with code: 0\n"
        "[15:34:40] exit()         [CLEANUP ] (PID:  1204 | PPID:   890) [TERMINAT] Parent lifecycle complete. Exit 0."
    )

    add_h2("7.4 Screenshots of Execution")
    add_p("Below are the verified execution captures from the laboratory testing session (Batch - 17):", space_after=8)

    screenshots = [
        ("results/SrccenShot--1.png", "Figure 7.1: Scenario 1 – Complete Process Lifecycle Execution (fork, execvp, waitpid, exit)."),
        ("results/SrccenShot--2.png", "Figure 7.2: Scenario 2 – Zombie Process Simulation & /proc State Inspection (State: 'Z')."),
        ("results/SrccenShot--3.png", "Figure 7.3: Scenario 3 – Orphan Process Simulation & Reparenting by PID 1 / init."),
        ("results/SrccenShot--4.png", "Figure 7.4: Scenario 4 & Web UI – Interactive Process Visualizer Dashboard & Telemetry.")
    ]

    for img_path, caption in screenshots:
        if os.path.exists(img_path):
            p_img = doc.add_paragraph()
            p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_img.paragraph_format.space_before = Pt(8)
            p_img.paragraph_format.space_after = Pt(4)
            p_img.paragraph_format.keep_with_next = True
            p_img.add_run().add_picture(img_path, width=Inches(6.0))

            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_after = Pt(14)
            r_cap = p_cap.add_run(caption)
            r_cap.italic = True
            r_cap.font.size = Pt(9.5)
            r_cap.font.color.rgb = RGBColor(0x55, 0x55, 0x55)

    add_h2("7.5 Demonstration of OS Concepts")
    t_test = doc.add_table(rows=7, cols=4)
    t_test.alignment = WD_TABLE_ALIGNMENT.CENTER
    test_heads = ["Test ID", "Scenario", "System Calls Tested", "Result"]
    for i, h in enumerate(test_heads):
        c = t_test.cell(0, i)
        c.text = h
        set_cell_bg(c, "003366")
        c.paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        c.paragraphs[0].runs[0].bold = True
    test_rows = [
        ("TC-01", "Complete Lifecycle", "fork(), execvp(), waitpid(), exit()", "PASS (Reaped exit code 0)"),
        ("TC-02", "Zombie Process", "fork(), exit(42), /proc status, waitpid()", "PASS (State 'Z' detected and reaped)"),
        ("TC-03", "Orphan Process", "fork(), parent exit(), getppid()", "PASS (PPID adopted by PID 1 / init)"),
        ("TC-04", "Non-Blocking Polling", "waitpid(WNOHANG), usleep()", "PASS (Polled loop caught child exit)"),
        ("TC-05", "Signal Termination", "kill(SIGKILL), WIFSIGNALED", "PASS (Signal 9 termination detected)"),
        ("TC-06", "Custom Linux Exec", "fork(), execvp(PATH)", "PASS (whoami / custom binaries executed)")
    ]
    for r_i, (tid, scn, apis, res) in enumerate(test_rows):
        c0, c1, c2, c3 = t_test.cell(r_i+1, 0), t_test.cell(r_i+1, 1), t_test.cell(r_i+1, 2), t_test.cell(r_i+1, 3)
        c0.text, c1.text, c2.text, c3.text = tid, scn, apis, res
        set_cell_pad(c0, 45, 45, 70, 70)
        set_cell_pad(c1, 45, 45, 70, 70)
        set_cell_pad(c2, 45, 45, 70, 70)
        set_cell_pad(c3, 45, 45, 70, 70)
        c0.paragraphs[0].runs[0].bold = True

    add_page_break()

    # ==========================================
    # CHAPTER 8: CONCLUSION
    # ==========================================
    add_chapter_heading("CHAPTER 8\nCONCLUSION")
    
    add_h2("8.1 Summary of the Project")
    add_p(
        "The “Linux Process Creation, Execution, and Termination System” provides a comprehensive bridge between Operating Systems "
        "theory and real-world Linux kernel programming. By combining a modular C backend with live /proc filesystem inspection and an "
        "interactive web visualizer, the system makes the complete lifecycle of Linux processes directly observable and understandable.",
        space_after=8
    )

    add_h2("8.2 Objectives Achieved")
    add_bullet("Demonstrated the complete process lifecycle with genuine POSIX system calls.")
    add_bullet("Implemented fork() and execvp() illustrating Copy-On-Write and address space substitution.")
    add_bullet("Synchronized parent and child processes using blocking and non-blocking waitpid() options.")
    add_bullet("Successfully demonstrated Zombie and Orphan anomalies with live /proc verification.")

    add_h2("8.3 Results Achieved")
    add_bullet("100% test scenario pass rate across all 6 verified scenarios on Ubuntu 24.04 LTS.")
    add_bullet("Zero memory leaks, zero zombie leaks, and zero compiler warnings under GCC -Wall -Wextra.")
    add_bullet("Zero external npm packages or Python dependencies required for web visualization.")

    add_h2("8.4 Skills and Learning Outcomes")
    add_bullet("Proficiency in POSIX systems programming and kernel system call interfaces.")
    add_bullet("Deep understanding of process control blocks (task_struct) and the /proc pseudo-filesystem.")
    add_bullet("Practical competence in asynchronous signal handling and status code decoding.")

    add_page_break()

    # ==========================================
    # CHAPTER 9: REFERENCES
    # ==========================================
    add_chapter_heading("CHAPTER 9\nREFERENCES")
    
    add_h2("9.1 Books")
    add_bullet("Silberschatz, A., Galvin, P. B., & Gagne, G. (2018). Operating System Concepts (10th ed.). John Wiley & Sons.")
    add_bullet("Kerrisk, M. (2010). The Linux Programming Interface. No Starch Press.")
    add_bullet("Stevens, W. R., & Rago, S. A. (2013). Advanced Programming in the UNIX Environment (3rd ed.). Addison-Wesley.")
    add_bullet("Love, R. (2010). Linux Kernel Development (3rd ed.). Addison-Wesley.")

    add_h2("9.2 Research Papers")
    add_bullet("Ritchie, D. M., & Thompson, K. (1974). 'The UNIX Time-Sharing System'. Communications of the ACM, 17(7), 365–375.")
    add_bullet("Corbet, J., Rubini, A., & Kroah-Hartman, G. (2005). 'Linux Device Drivers: Process Management'. O'Reilly Media.")

    add_h2("9.3 Linux / GNU Documentation")
    add_bullet("Linux Programmer's Manual. fork(2) – Create a child process. https://man7.org/linux/man-pages/man2/fork.2.html")
    add_bullet("Linux Programmer's Manual. execvp(3) – Execute a file. https://man7.org/linux/man-pages/man3/execvp.3.html")
    add_bullet("Linux Programmer's Manual. waitpid(2) – Wait for process state change. https://man7.org/linux/man-pages/man2/waitpid.2.html")
    add_bullet("Linux Programmer's Manual. proc(5) – Process information pseudo-filesystem. https://man7.org/linux/man-pages/man5/proc.5.html")

    add_h2("9.4 Online Resources")
    add_bullet("Ubuntu Server & WSL2 Documentation. Canonical Ltd. https://ubuntu.com/wsl")
    add_bullet("K L University Department of Computer Science & Engineering Academic Portal. https://www.klh.edu.in")

    # Save to multiple convenient locations
    paths = [
        os.path.abspath("reports/PROJECT_DOCUMENTATION_TEAM17.docx"),
        os.path.abspath("docs/PROJECT_DOCUMENTATION_TEAM17.docx"),
        os.path.abspath("Project_Documentation_Linux_Process_System.docx")
    ]
    for p in paths:
        doc.save(p)
        print("Saved Word document:", p)

if __name__ == "__main__":
    build_full_report_batch17()
