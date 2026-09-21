# 📸 MLP Kids Studio — Luxury Photography & AI Booking Platform

> **"Capturing Little Moments, Creating Lifetime Memories"**  
> A full-stack, enterprise-grade photography studio web application powered by **React 19**, **Node.js/Express**, **MongoDB**, **FastAPI**, and **RAG-based AI with Two-Way Voice Recognition**.

---

## ✨ Features

### 🌟 Customer Experience
- **Ultra-Premium Luxury UI**: Obsidian & 24K Champagne Gold aesthetic, glassmorphism (`backdrop-filter: blur()`), keyframe micro-animations, and responsive layouts.
- **Service & Package Explorer**: Browse dedicated categories (Kids Photography, Baby Shoots, Birthday Shoots, Family Portraits, Events) with transparent pricing and instant booking actions.
- **Online Shoot Reservation Flow**: Real-time slot selection, customer details collection, and instant reservation confirmation.
- **Smart UPI Advance Scanner**: Integrated interactive ₹500 QR payment scanner modal with dynamic countdown timer, simulated UPI apps (Google Pay, PhonePe, Paytm), and instant receipt generation.
- **My Bookings Dashboard**: Customer portal to view upcoming shoots, booking status (`Pending`, `Confirmed`, `Completed`, `Cancelled`), and advance payment statuses.

### 🧠 AI & RAG Voice Assistant
- **RAG-Powered AI Engine**: Retrieval-Augmented Generation using ChromaDB vector database and semantic embeddings to answer inquiries using studio policies, packages, and pricing.
- **Two-Way Voice Search & Speech**:
  - **Speech-to-Text**: Customers can tap the mic to speak their query naturally.
  - **Text-to-Speech**: The assistant speaks responses aloud using modern browser voice synthesis.

### 🛡️ Private Studio Owner Management Center
- **Strict Authorization**: Admin portal exclusively locked down to studio owner (`gokulsurya021@gmail.com`).
- **One-Click Shoot Confirmation**: Confirm pending bookings and acknowledge ₹500 advance payments in real time.
- **Photographer Assignment**: Assign shoots to lead photographer Lokesh.
- **Executive Analytics**: Real-time KPI tiles for pending orders, confirmed sessions, total revenue, and photographer workload.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 8, React Router DOM v7, Vanilla CSS3 (Custom Glassmorphism), Lucide React, React Hot Toast, Axios, Web Speech API |
| **Backend API** | Node.js, Express.js 5, JWT Authentication, bcryptjs, Multer, pdf-parse, CORS, Dotenv |
| **Databases** | MongoDB (Mongoose 9 ODM), ChromaDB (AI Vector Database) |
| **AI Microservice** | Python 3, FastAPI, Uvicorn, Sentence-Transformers (`all-MiniLM-L6-v2`), PyPDF2 |

---

## 📁 Folder Structure

```
mlp/
├── ai/                     # Python FastAPI RAG AI Microservice
│   ├── main.py             # FastAPI endpoints, ChromaDB ingestion & retrieval
│   └── requirements.txt    # Python dependencies
├── backend/                # Node.js & Express REST API Server
│   ├── controllers/        # Business logic (auth, bookings, services, etc.)
│   ├── models/             # Mongoose schemas (User, Booking, Service, etc.)
│   ├── routes/             # API routes
│   ├── middleware/         # JWT auth & strict admin-only middleware
│   ├── .env.example        # Environment variable template
│   └── server.js           # Server entry point
├── frontend/               # React 19 + Vite Frontend SPA
│   ├── public/             # Static assets, studio sample photos
│   ├── src/
│   │   ├── api/            # Axios API client
│   │   ├── components/     # Navbar, Footer, Icons, SmartBook
│   │   ├── context/        # AuthContext
│   │   ├── pages/          # Home, Services, Packages, Gallery, Admin, etc.
│   │   ├── App.jsx         # Routes & app wrapper
│   │   └── index.css       # Global luxury design system & tokens
│   └── package.json
└── README.md
```

---

## 🚀 Getting Started (Local Development)

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (running locally on `mongodb://localhost:27017` or MongoDB Atlas)
- **Python 3.10+**

---

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env if needed (default port is 5000)
node server.js
```
*Backend runs on `http://localhost:5000`*

---

### 3. AI Service Setup
```bash
cd ai
pip install -r requirements.txt
python main.py
```
*AI service runs on `http://localhost:8000`*

---

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 🔑 Default Accounts

| Role | Email | Permissions |
|---|---|---|
| **Studio Owner / Admin** | `gokulsurya021@gmail.com` | Full access to `/admin` control center, order confirmations, advance checks |
| **Customer** | Any registered email | Browse gallery, book shoots, manage personal reservations |

---

## 📄 License
This project is proprietary and created for **MLP Kids Studio, Samalkot**. All rights reserved.
