# Smart India Hackathon (SIH) Letterhead Formatter

An intuitive web application that formats official Smart India Hackathon nomination letters and exports them as Word documents (`.docx`), PDF files (`.pdf`), or direct printouts, automatically named after the **Team ID** (`<team_id>.docx`).

---

## 🚀 Live Hosting on GitHub Pages (Zero Backend Required)

This web application has full **client-side support** using `JSZip`, `DOMParser`, and `html2pdf.js`. You can host it completely for free on **GitHub Pages**!

### How to Deploy to GitHub Pages in 4 Simple Steps:

#### Step 1: Initialize Git and Commit
Open PowerShell or Terminal in this project directory:
```bash
git init
git add .
git commit -m "Initial commit - SIH Letterhead Formatter"
```

#### Step 2: Create a Repository on GitHub
1. Go to [github.com/new](https://github.com/new).
2. Name your repository (e.g. `sih-letterhead-formatter`).
3. Leave it Public and click **Create repository**.

#### Step 3: Link and Push
Run the commands shown on GitHub (replace `<YOUR_USERNAME>` with your GitHub username):
```bash
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/sih-letterhead-formatter.git
git push -u origin main
```

#### Step 4: Enable GitHub Pages
1. On your GitHub repository page, click **Settings** (top right tab).
2. In the left sidebar, click **Pages**.
3. Under **Build and deployment** -> **Branch**:
   - Select **`main`** branch
   - Select folder **`/ (root)`**
   - Click **Save**.
4. In ~1-2 minutes, GitHub will give you your live URL:
   `https://<YOUR_USERNAME>.github.io/sih-letterhead-formatter/`

---

## 💻 Running Locally on Your Computer

### Method 1: One-Click Runner (Windows)
Double-click `run.bat`.

### Method 2: Python Command Line
```bash
python start_app.py
```
This will start the local server and automatically open `http://127.0.0.1:5000` in your web browser.
