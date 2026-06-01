# Marketing Automation Script Assistant

This project is a React-based Marketing Automation Script assistant. It has been migrated from an n8n backend workflow to a high-performance **FastAPI backend** in Python. The database is stored in **Notion**, and the AI model is powered by **Google Gemini**.

## Project Structure

- `backend/`: Python FastAPI application.
- `client/`: React + Vite frontend application.
- `My workflow.json`: The original n8n workflow for reference.

---

## Getting Started

### 1. Setup Backend

1. Navigate to the `backend/` directory.
2. Create a virtual environment and activate it:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # macOS/Linux:
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy `.env.example` to `.env` and fill in your keys:
   - `NOTION_API_KEY`: Your Notion integration token.
   - `NOTION_DATABASE_ID`: Notion database ID (default is configured).
   - `GEMINI_API_KEY`: Your Google Gemini API Key.
5. Run the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```
   The backend will run on `http://localhost:8000`.

### 2. Setup Client

1. Navigate to the `client/` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   Vite is configured with a dev-proxy that redirects all `/api/*` requests directly to `http://localhost:8000` (the FastAPI backend).
