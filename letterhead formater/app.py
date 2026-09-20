import os
import io
import re
import csv
import json
from flask import Flask, request, jsonify, send_file, render_template
import doc_generator

app = Flask(__name__, static_folder="static", template_folder="templates")
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/sample', methods=['GET'])
def get_sample():
    return jsonify(doc_generator.get_sample_data())

@app.route('/api/generate', methods=['POST'])
def generate_single():
    data = request.get_json(force=True)
    if not data:
        return jsonify({"error": "No data provided"}), 400

    team_id = data.get("team_id", "nomination_doc")
    safe_name = doc_generator.sanitize_filename(team_id)
    filename = f"{safe_name}.docx"

    docx_buffer = doc_generator.generate_docx(data)
    
    return send_file(
        docx_buffer,
        as_attachment=True,
        download_name=filename,
        mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

@app.route('/api/batch-generate', methods=['POST'])
def generate_batch():
    data = request.get_json(force=True)
    if not data:
        return jsonify({"error": "No teams data provided"}), 400

    teams = data if isinstance(data, list) else data.get("teams", [])
    if not teams:
        return jsonify({"error": "Teams list is empty"}), 400

    zip_buffer = doc_generator.generate_batch_zip(teams)
    
    return send_file(
        zip_buffer,
        as_attachment=True,
        download_name="sih_nomination_docs.zip",
        mimetype="application/zip"
    )

@app.route('/api/csv-template', methods=['GET'])
def get_csv_template():
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Team ID", "Team Name", "Date", "AICTE Code", "Hackathon Name",
        "Signatory Name", "Signatory Title", "College Name",
        "Role", "Member Name", "Gender", "Email", "Mobile", "Stream", "Academic Year"
    ])
    writer.writerow([
        "074_forge26", "FORGE-26", "17/September/2026", "U-0436", "Smart India Hackathon 2026",
        "Dr. Sasangan Ramanathan", "Dean Academics", "Amrita Vishwa Vidyapeetham, Coimbatore.",
        "Team Leader", "Savetha Aravindan", "F", "cb.en.u4elc26045@cb.students.amrita.edu", "9843865733", "ELC", "I"
    ])
    writer.writerow([
        "074_forge26", "FORGE-26", "17/September/2026", "U-0436", "Smart India Hackathon 2026",
        "Dr. Sasangan Ramanathan", "Dean Academics", "Amrita Vishwa Vidyapeetham, Coimbatore.",
        "Team Member", "Vidhun J H", "M", "cb.en.u4elc26055@cb.students.amrita.edu", "9384469559", "ELC", "I"
    ])
    
    mem_file = io.BytesIO(output.getvalue().encode('utf-8'))
    return send_file(
        mem_file,
        as_attachment=True,
        download_name="sih_teams_template.csv",
        mimetype="text/csv"
    )

@app.route('/api/parse-csv', methods=['POST'])
def parse_csv():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    if not file.filename:
        return jsonify({"error": "Empty filename"}), 400

    try:
        content = file.read().decode('utf-8-sig', errors='replace')
        reader = csv.DictReader(io.StringIO(content))
        
        teams_map = {}
        for row in reader:
            # Normalize keys (lowercase and remove spaces/special chars)
            norm_row = {re.sub(r'[^a-zA-Z0-9]', '', k.lower()): v.strip() for k, v in row.items() if k}
            
            team_id = norm_row.get('teamid') or norm_row.get('id') or norm_row.get('teamname') or "Team_1"
            if team_id not in teams_map:
                teams_map[team_id] = {
                    "team_id": team_id,
                    "team_name": norm_row.get('teamname') or norm_row.get('team') or team_id,
                    "date_str": norm_row.get('date') or norm_row.get('datestr') or "17/September/2026",
                    "hackathon_name": norm_row.get('hackathonname') or norm_row.get('hackathon') or "Smart India Hackathon 2026",
                    "aicte_code": norm_row.get('aictecode') or norm_row.get('aicte') or "U-0436",
                    "signatory_name": norm_row.get('signatoryname') or norm_row.get('signatory') or "Dr. Sasangan Ramanathan",
                    "signatory_title": norm_row.get('signatorytitle') or norm_row.get('title') or "Dean Academics",
                    "college_name": norm_row.get('collegename') or norm_row.get('college') or "Amrita Vishwa Vidyapeetham, Coimbatore.",
                    "members": []
                }
            
            member_name = norm_row.get('membername') or norm_row.get('name') or ""
            if member_name:
                teams_map[team_id]["members"].append({
                    "role": norm_row.get('role') or ("Team Leader" if len(teams_map[team_id]["members"]) == 0 else "Team Member"),
                    "name": member_name,
                    "gender": (norm_row.get('gender') or "M")[:1].upper(),
                    "email": norm_row.get('email') or norm_row.get('emailid') or "",
                    "mobile": norm_row.get('mobile') or norm_row.get('mobileno') or norm_row.get('phone') or "",
                    "stream": norm_row.get('stream') or norm_row.get('dept') or norm_row.get('branch') or "CSE",
                    "year": norm_row.get('academicyear') or norm_row.get('year') or "I"
                })

        teams_list = list(teams_map.values())
        return jsonify({"teams": teams_list, "count": len(teams_list)})

    except Exception as e:
        return jsonify({"error": f"Failed to parse CSV: {str(e)}"}), 400

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"SIH Letterhead Formatter running on http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
