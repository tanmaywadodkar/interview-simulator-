# AI Interview Simulator 🤖

An advanced, full-stack AI-powered job interview simulator built with **Python (FastAPI)** and **React (TypeScript + Tailwind CSS)**.

The system dynamically conducts realistic job interviews based on candidate role, experience level, candidate profile, and previous answers. Candidates respond through their microphone, speech is transcribed in real-time, answers are evaluated across multiple assessment dimensions, and non-intrusive computer vision metrics provide communication insights.

---

## 🌟 Key Features

- **Dynamic AI Interview Engine**: Generates real-time, adaptive follow-up questions tailored to role, candidate profile, and prior responses rather than static pre-defined lists.
- **Voice Speech Input & Live Transcript**: Real-time microphone audio speech-to-text transcription with Web Speech API integration.
- **Multi-Dimensional Answer Evaluator**: Scores responses on relevance, clarity, technical accuracy, and STAR structure, offering strengths, weaknesses, and sample ideal answers.
- **Vision Analytics Foundation**: Real-time OpenCV vision analyzer assessing face presence, approximate eye-contact ratio, and posture alignment.
- **Comprehensive Performance Report**: Detailed overall score (0-100), category scorecards, executive AI summary, question-by-question breakdown, and communication metrics.
- **Out-of-the-Box Demo Mode**: Operates seamlessly without requiring immediate API keys. When an LLM API key (`AI_API_KEY`) is configured, it automatically upgrades to live LLM generation.
- **Privacy & Ethics Compliance**: One-click local data deletion from SQLite database, zero persistent raw video recording, and strict non-diagnostic ethics controls.

---

## 🛠️ Technology Stack

### Backend
- **Python 3.11+**
- **FastAPI**: Asynchronous web framework & REST endpoints
- **Uvicorn**: ASGI server
- **SQLAlchemy & SQLite**: Database persistence
- **Pydantic v2**: Data validation and settings management
- **OpenCV**: Computer vision frame processing
- **HTTPX**: Async HTTP client for external AI APIs
- **Pytest**: Backend automated test suite

### Frontend
- **React 18** + **TypeScript**
- **Vite**: Lightning-fast build tool
- **Tailwind CSS**: Modern glassmorphism dark mode styling
- **Lucide Icons**: Clean UI iconography
- **Web Speech API**: Real-time client-side speech recognition and voice readout

---

## 📁 Project File Structure

```text
interview simulator/
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   │
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── interview.py
│   │   │   ├── analysis.py
│   │   │   └── health.py
│   │   │
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── security.py
│   │   │
│   │   ├── db/
│   │   │   ├── database.py
│   │   │   └── crud.py
│   │   │
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── interview.py
│   │   │   └── user.py
│   │   │
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── interview.py
│   │   │   └── analysis.py
│   │   │
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── ai_interviewer.py
│   │   │   ├── answer_evaluator.py
│   │   │   ├── speech_service.py
│   │   │   ├── analysis_service.py
│   │   │   └── vision/
│   │   │       ├── __init__.py
│   │   │       ├── face_analyzer.py
│   │   │       ├── hand_analyzer.py
│   │   │       └── posture_analyzer.py
│   │   │
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── logger.py
│   │
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_health.py
│   │   └── test_interview.py
│   │
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── CameraFeed.tsx
│   │   │   ├── InterviewerAvatar.tsx
│   │   │   ├── ScoreCard.tsx
│   │   │    font-sans
│   │   │   └── PrivacyModal.tsx
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx
│   │   │   ├── SetupPage.tsx
│   │   │   ├── InterviewRoomPage.tsx
│   │   │   ├── ReportPage.tsx
│   │   │   └── HistoryPage.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── hooks/
│   │   │   ├── useSpeechRecognition.ts
│   │   │   └── useCameraStream.ts
│   │   ├── types/
│   │   │   └── interview.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── .env.example
│
├── data/
├── .gitignore
├── .env.example
├── README.md
└── LICENSE
```

---

## 🚀 Quick Start & Installation

### 1. Backend Setup (Python FastAPI)

1. Navigate to the project root directory:
   ```bash
   cd "interview simulator"
   ```

2. Create a Python virtual environment:
   ```bash
   python -m venv .venv
   ```

3. Activate the virtual environment:
   - **Windows PowerShell**:
     ```powershell
     .venv\Scripts\activate
     ```
   - **Linux / macOS**:
     ```bash
     source .venv/bin/activate
     ```

4. Install Python dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

5. Configure environment variables:
   ```bash
   cp backend/.env.example backend/.env
   ```
   *(Optional: Fill in `AI_API_KEY` with your Gemini/OpenAI API key. If left blank, Demo Mode runs automatically).*

6. Launch the FastAPI server:
   ```bash
   python -m uvicorn app.main:app --reload --app-dir backend
   ```
   The backend API will run on `http://127.0.0.1:8000`. OpenAPI docs are available at `http://127.0.0.1:8000/api/docs`.

---

### 2. Frontend Setup (React Vite)

1. Open a new terminal tab and navigate to `frontend`:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser at `http://localhost:5173`.

---

## 🧪 Running Tests

To execute the backend automated test suite:

```bash
pytest backend/tests
```

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check & environment status |
| `POST` | `/api/interview/start` | Initialize interview & generate introductory prompt |
| `POST` | `/api/interview/{id}/answer` | Submit candidate speech transcript & receive evaluation |
| `POST` | `/api/interview/{id}/next-question` | Dynamically generate follow-up question based on answer |
| `POST` | `/api/interview/{id}/finish` | Finalize interview and generate performance report |
| `GET` | `/api/interview/{id}` | Retrieve current interview session state |
| `GET` | `/api/interview/{id}/report` | Fetch performance report details |
| `GET` | `/api/interview/history` | List all past interviews |
| `DELETE` | `/api/interview/{id}` | Delete interview record for privacy compliance |
| `POST` | `/api/analysis/frame` | Process webcam image frame for vision metrics |

---

## 🔒 Privacy & Security

- **No Raw Video Storage**: Video frames are processed in memory for non-verbal feedback and immediately discarded.
- **Local Control**: All transcripts and scores are saved in your local SQLite database (`data/interview.db`).
- **Data Removal**: Candidates can delete any interview session at any time directly from the History dashboard.
- **Ethical Disclaimer**: The system does NOT diagnose psychological or medical conditions, nor does it infer sensitive personal traits.

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
