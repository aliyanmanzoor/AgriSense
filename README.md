# AgriSense 🌱

**AgriSense** is an AI-powered agricultural advisor designed specifically for Pakistani farmers. It provides localized, actionable insights to help farmers optimize crop yields, manage diseases, and stay ahead of weather conditions, all within an intuitive and mobile-first application.

## ✨ Features

- **Authentication:** Secure farmer registration and login (password hashing via \crypt\).
- **Weather Forecasts:** Hyper-local current weather conditions and 5-day forecasts.
- **Crop Calendar:** Personalized planting, growth stage tracking, and harvesting timelines based on crop type and region.
- **Disease Detection:** AI-powered crop disease detection from uploaded leaf images using Ultralytics YOLO models.
- **Yield Prediction:** Machine learning-based statistical estimates of expected crop yields based on rainfall, pesticide use, and temperature (powered by Scikit-Learn).
- **Notifications:** Real-time alerts for severe weather, disease detection results, and general farming updates.
- **Settings & Profile Management:** Update personal details, manage farm parameters, configure notification preferences, and change passwords.
- **Bilingual Support:** Full Urdu and English translation system with automatic Right-to-Left (RTL) layout switching.
- **Mobile-Responsive Design:** Fully optimized, touch-friendly UI designed for a 375px viewport standard for seamless usage on mobile devices.

## 🛠️ Tech Stack

### Frontend
- **React** (v19.2.8) - Core UI library
- **Vite** (v8.2.0) - Fast frontend build tool
- **Tailwind CSS** (v4.3.3) - Utility-first styling and responsiveness
- **Lucide React** - Iconography

### Backend (API)
- **FastAPI** (v0.100.0) - High-performance Python web framework
- **Uvicorn** (v0.23.0) - ASGI server
- **PostgreSQL** - Primary database (migrated from SQLite for ephemeral storage compatibility)
- **Psycopg2-binary** (v2.9.0) - PostgreSQL adapter for Python
- **Python-dotenv** (v1.0.0) - Environment variable management
- **Bcrypt** (v4.1.0) - Password hashing

### Machine Learning
- **Ultralytics** (v8.0.0) - YOLO-based image classification for disease detection
- **Scikit-Learn** (v1.0.0) & **Joblib** (v1.0.0) - Random Forest modeling for yield prediction

---

## 📁 Project Structure

- \rontend/\ - React/Vite source code and UI components.
- \pi/\ - FastAPI backend endpoints (\main.py\).
- \database.py\ - Core database connection and CRUD operations using PostgreSQL.
- \models/\ - Saved \.pt\ (PyTorch) and \.pkl\ (Scikit-Learn) models used for disease and yield predictions.
- \pp.py\ & \iews/\ - *Note: These contain an earlier Streamlit prototype kept for historical reference. The React frontend + FastAPI backend is the current production architecture.*

---

## 🚀 Setup & Installation

### 1. Database & Environment Configuration

You will need a running PostgreSQL database.

1. Create a \.env\ file in the root directory (you can copy \.env.example\).
2. Add your PostgreSQL connection string:
   \\env
   DATABASE_URL=postgresql://user:password@localhost:5432/agrisense
   \
### 2. Backend (FastAPI)

Ensure you have Python 3.9+ installed.

\\ash
# Clone the repository and navigate to the project root
cd AgriSense

# Install the Python dependencies
pip install -r requirements.txt

# Start the FastAPI server (runs on http://localhost:8000 by default)
uvicorn api.main:app --reload --port 8000
\*Note: The database tables will automatically initialize on the first successful connection.*

### 3. Frontend (React)

Ensure you have Node.js installed.

\\ash
# Navigate to the frontend directory
cd frontend

# Install the Node dependencies
npm install

# Start the Vite development server
npm run dev
\
Visit the local URL provided by Vite (usually \http://localhost:5173\) to view and interact with the application.
