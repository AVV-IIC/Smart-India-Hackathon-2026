import os
import io
import re
import copy
import zipfile
import docx
from docx.shared import Pt, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT

DEFAULT_TEMPLATE_PATH = os.path.join(os.path.dirname(__file__), '074_forge26.docx')

def sanitize_filename(filename):
    """Sanitize string to be safe for filenames."""
    if not filename:
        return "nomination_doc"
    sanitized = re.sub(r'[\\/*?:"<>|]', "_", str(filename)).strip()
    return sanitized if sanitized else "nomination_doc"

def get_sample_data():
    """Return default sample data matching 074_forge26.docx."""
    return {
        "team_id": "074_forge26",
        "team_name": "FORGE-26",
        "date_str": "17/September/2026",
        "hackathon_name": "Smart India Hackathon 2026",
        "aicte_code": "U-0436",
        "signatory_name": "Dr. Sasangan Ramanathan",
        "signatory_title": "Dean Academics",
        "college_name": "Amrita Vishwa Vidyapeetham, Coimbatore.",
        "members": [
            {
                "role": "Team Leader",
                "name": "Savetha Aravindan",
                "gender": "F",
                "email": "cb.en.u4elc26045@cb.students.amrita.edu",
                "mobile": "9843865733",
                "stream": "ELC",
                "year": "I"
            },
            {
                "role": "Team Member",
                "name": "Vidhun J H",
                "gender": "M",
                "email": "cb.en.u4elc26055@cb.students.amrita.edu",
                "mobile": "9384469559",
                "stream": "ELC",
                "year": "I"
            },
            {
                "role": "Team Member",
                "name": "Venyaa J D",
                "gender": "F",
                "email": "cb.en.u4elc26054@cb.students.amrita.edu",
                "mobile": "7812893626",
                "stream": "ELC",
                "year": "I"
            },
            {
                "role": "Team Member",
                "name": "Tharaneesh M K",
                "gender": "M",
                "email": "cb.en.u4elc26149@cb.students.amrita.edu",
                "mobile": "9842616770",
                "stream": "ELC",
                "year": "I"
            },
            {
                "role": "Team Member",
                "name": "Sanjanaa Eswaran",
                "gender": "F",
                "email": "cb.en.u4elc26043@cb.students.amrita.edu",
                "mobile": "9363774785",
                "stream": "ELC",
                "year": "I"
            },
            {
                "role": "Team Member",
                "name": "Mithunesh G",
                "gender": "M",
                "email": "cb.en.u4elc26027@cb.students.amrita.edu",
                "mobile": "6382627316",
                "stream": "ELC",
                "year": "I"
            }
        ]
    }

def generate_docx(data, template_path=None, output_path=None):
    """
    Generate a Word document (.docx) by performing in-place updates on 074_forge26.docx,
    preserving exact cell widths, table borders, font sizes, alignments, and paragraph rules.
    """
    if template_path is None:
        template_path = DEFAULT_TEMPLATE_PATH

    team_id = data.get("team_id", "nomination_doc")
    team_name = data.get("team_name", "FORGE-26")
    date_str = data.get("date_str", "17/September/2026")
    hackathon_name = data.get("hackathon_name", "Smart India Hackathon 2026")
    aicte_code = data.get("aicte_code", "U-0436")
    signatory_name = data.get("signatory_name", "Dr. Sasangan Ramanathan")
    signatory_title = data.get("signatory_title", "Dean Academics")
    college_name = data.get("college_name", "Amrita Vishwa Vidyapeetham, Coimbatore.")
    members = data.get("members", [])
    if not members:
        members = get_sample_data()["members"]

    if os.path.exists(template_path):
        doc = docx.Document(template_path)

        # 1. Update Date
        for p in doc.paragraphs:
            if p.text.strip().startswith("Date:"):
                p.text = f"Date: {date_str}"
                if p.runs:
                    p.runs[0].font.size = Pt(12)
                break

        # 2. Update Subject (Centered, Bold, 12pt)
        for p in doc.paragraphs:
            if "Smart India Hackathon" in p.text and "Nomination" in p.text:
                p.text = f"Sub: {hackathon_name} – Nomination"
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                if p.runs:
                    p.runs[0].bold = True
                    p.runs[0].font.size = Pt(12)
                break

        # 3. Update Nomination Paragraph (P7 with Underline & Bold on AICTE code)
        for p in doc.paragraphs:
            if "AICTE Application No" in p.text or "UGC Registration No" in p.text:
                p.text = "Hackathon 2026. AICTE Application No/ UGC Registration No for our college is "
                if p.runs:
                    p.runs[0].font.size = Pt(12)
                r_code = p.add_run(f"{aicte_code}.")
                r_code.bold = True
                r_code.underline = True
                r_code.font.size = Pt(12)
                break

        # 4. Update Team Name (Bold, 12pt)
        for p in doc.paragraphs:
            if p.text.strip().startswith("Team:"):
                p.text = "Team:  "
                if p.runs:
                    p.runs[0].bold = True
                    p.runs[0].font.size = Pt(12)
                r_team = p.add_run(team_name)
                r_team.bold = True
                r_team.font.size = Pt(12)
                break

        # 5. Update Table in-place preserving exact row/cell XML formatting
        if doc.tables:
            table = doc.tables[0]
            num_members = len(members)
            template_row_tr = copy.deepcopy(table.rows[1]._tr)

            # Adjust rows if needed
            while len(table.rows) - 1 < num_members:
                new_tr = copy.deepcopy(template_row_tr)
                table._tbl.append(new_tr)

            while len(table.rows) - 1 > num_members:
                tr = table.rows[-1]._tr
                table._tbl.remove(tr)

            # Populate cells
            for idx, m in enumerate(members):
                row = table.rows[idx + 1]
                role_val = m.get("role") or ("Team Leader" if idx == 0 else "Team Member")

                def set_cell_text(cell, val):
                    # Keep first paragraph, set text & font
                    p = cell.paragraphs[0]
                    p.text = str(val) if val is not None else ""
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    for r in p.runs:
                        r.font.size = Pt(10)
                    # Clean any extra paragraphs in cell
                    for extra_p in cell.paragraphs[1:]:
                        p_elem = extra_p._p
                        p_elem.getparent().remove(p_elem)

                set_cell_text(row.cells[0], role_val)
                set_cell_text(row.cells[1], m.get("name", ""))
                set_cell_text(row.cells[2], m.get("gender", ""))
                set_cell_text(row.cells[3], m.get("email", ""))
                set_cell_text(row.cells[4], m.get("mobile", ""))
                set_cell_text(row.cells[5], m.get("stream", ""))
                set_cell_text(row.cells[6], m.get("year", ""))

        # 6. Update Signatory
        found_sinc = False
        for p in doc.paragraphs:
            if "Sincerely" in p.text:
                found_sinc = True
            elif found_sinc and ("Dr." in p.text or "Sasangan" in p.text or "Signatory" in p.text):
                p.text = f"{signatory_name} "
                if p.runs:
                    p.runs[0].bold = True
            elif found_sinc and ("Dean" in p.text or "Academics" in p.text or "Principal" in p.text):
                p.text = f"{signatory_title} "
                if p.runs:
                    p.runs[0].italic = True
            elif found_sinc and ("Amrita" in p.text or "Vidyapeetham" in p.text or "College" in p.text or "University" in p.text):
                p.text = f"{college_name}"
                if p.runs:
                    p.runs[0].italic = True

    else:
        # Fallback from scratch
        doc = docx.Document()
        section = doc.sections[0]
        section.page_width = Inches(8.5)
        section.page_height = Inches(11.0)
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(0.625)

        for _ in range(2): doc.add_paragraph()

        p_date = doc.add_paragraph()
        r_d = p_date.add_run(f"Date: {date_str}")
        r_d.font.size = Pt(12)

        doc.add_paragraph()

        p_sub = doc.add_paragraph()
        p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_s = p_sub.add_run(f"Sub: {hackathon_name} – Nomination")
        r_s.bold = True
        r_s.font.size = Pt(12)

        doc.add_paragraph()

        p_b1 = doc.add_paragraph()
        p_b1.add_run("I am pleased to nominate the below team from our college to participate in Smart India").font.size = Pt(12)

        p_b2 = doc.add_paragraph()
        p_b2.add_run("Hackathon 2026. AICTE Application No/ UGC Registration No for our college is ").font.size = Pt(12)
        r_code = p_b2.add_run(f"{aicte_code}.")
        r_code.bold = True
        r_code.underline = True
        r_code.font.size = Pt(12)

        doc.add_paragraph()

        p_team = doc.add_paragraph()
        r_tl = p_team.add_run("Team:  ")
        r_tl.bold = True
        r_tl.font.size = Pt(12)
        r_tn = p_team.add_run(team_name)
        r_tn.bold = True
        r_tn.font.size = Pt(12)

        doc.add_paragraph()

        headers = ["", "Name", "Gender (M/F)", "Email id", "Mobile No.", "Stream", "Academic Year"]
        table = doc.add_table(rows=1, cols=7)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER

        hdr_cells = table.rows[0].cells
        for i, header_text in enumerate(headers):
            hdr_cells[i].text = header_text
            for p in hdr_cells[i].paragraphs:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                for r in p.runs:
                    r.bold = True
                    r.font.size = Pt(10)

        for idx, m in enumerate(members):
            row = table.add_row()
            cells = row.cells
            cells[0].text = m.get("role") or ("Team Leader" if idx == 0 else "Team Member")
            cells[1].text = m.get("name", "")
            cells[2].text = m.get("gender", "")
            cells[3].text = m.get("email", "")
            cells[4].text = m.get("mobile", "")
            cells[5].text = m.get("stream", "")
            cells[6].text = m.get("year", "")

            for c in cells:
                for p in c.paragraphs:
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    for r in p.runs:
                        r.font.size = Pt(10)

        for _ in range(3): doc.add_paragraph()

        p_sinc = doc.add_paragraph()
        p_sinc.add_run("Sincerely,")

        for _ in range(4): doc.add_paragraph()

        p_sig_name = doc.add_paragraph()
        p_sig_name.add_run(f"{signatory_name} ").bold = True

        p_sig_title = doc.add_paragraph()
        p_sig_title.add_run(f"{signatory_title} ").italic = True

        p_sig_col = doc.add_paragraph()
        p_sig_col.add_run(college_name).italic = True

    if output_path:
        doc.save(output_path)
        return output_path
    else:
        buffer = io.BytesIO()
        doc.save(buffer)
        buffer.seek(0)
        return buffer

def generate_batch_zip(teams_list, template_path=None):
    """Generate a ZIP archive containing individual .docx files for each team."""
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        used_filenames = set()
        for idx, team_data in enumerate(teams_list):
            team_id = team_data.get("team_id") or f"team_{idx+1}"
            safe_name = sanitize_filename(team_id)
            
            final_name = f"{safe_name}.docx"
            counter = 1
            while final_name in used_filenames:
                final_name = f"{safe_name}_{counter}.docx"
                counter += 1
            used_filenames.add(final_name)

            doc_buffer = generate_docx(team_data, template_path=template_path)
            zip_file.writestr(final_name, doc_buffer.getvalue())

    zip_buffer.seek(0)
    return zip_buffer
