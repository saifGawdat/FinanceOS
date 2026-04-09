# 💰 FinanceOS - Enterprise Financial System

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge&logo=google-chrome&logoColor=white)](https://frontend-ksrqkq.taqnihub.cloud/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React 19](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Google Gemini](https://img.shields.io/badge/Gemini_AI-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://deepmind.google/technologies/gemini/)

A sophisticated, enterprise-grade financial management solution built with modern **TypeScript MERN Stack**. Designed for seamless business operations, this platform integrates **Generative AI** for financial insights and robust **multi-language (RTL)** support.

---

## 🌟 Key Features

### 🤖 Generative AI Assistant (Gemini)
- **Financial Chat**: Interact with an AI assistant for real-time analysis of your spending patterns and budget optimization.
- **Voice Transcription**: Transcribe audio notes directly into the system for hands-free transaction logging.
- **Predictive Insights**: Advanced forecasting for upcoming financial trends based on historical data.

### 🔄 Recurring Transaction Engine
- **Automated Logging**: Schedule monthly income and expenses once and let the system handle the rest.
- **Dynamic Controls**: Toggle recurring items on/off with enterprise-grade status management.
- **Precise Scheduling**: Select exact dates for monthly renewals to ensure accurate cash flow forecasting.

### 🌍 Global Ready (Multi-language & RTL)
- **Local Language Support**: Fully localized in **English** and **Arabic**.
- **RTL Optimization**: Pixel-perfect Right-to-Left (RTL) layout support for an authentic Arabic-speaking user experience.
- **Seamless Switching**: Instant locale management without page reloads.

### 📊 Strategic Financial Dashboard
- **Real-time Analytics**: Holistic view of net profit, total liquidity, and burn rate.
- **Interactive Visualizations**: High-fidelity charts powered by **Recharts**.
- **Customer & HR Management**: Integrated CRM for tracking payments and a dedicated HR module for payroll management.

### 📱 Progressive Web App (PWA)
- **Enterprise Mobility**: Installable as a native app on iOS, Android, and Windows.
- **Offline Resiliency**: Access your financial data and cached dashboards even in zero-connectivity environments.

---

## 🛠 Tech Stack

### Frontend
- **Core:** React 19 (Vite)
- **Typing:** TypeScript
- **Styling:** Tailwind CSS (Enterprise Design System)
- **State:** Context API + Axios
- **Intl:** i18next (RTL Support)

### Backend
- **Core:** Node.js (TypeScript)
- **API:** Express.js
- **Intelligence:** Google Gemini AI SDK
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT + Bcrypt

---

## ⚙️ Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB Connection String | `REQUIRED` |
| `JWT_SECRET` | Secret key for session encryption | `REQUIRED` |
| `GEMINI_API_KEY` | API Key for Google Gemini Insights | `REQUIRED` |
| `PORT` | Backend server port | `5000` |
| `VITE_API_URL` | Frontend API endpoint | `http://localhost:5000/api` |

---

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
npm run build
npm run start
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 📂 Project Structure

```text
├── backend/
│   ├── src/
│   │   ├── controllers/    # AI, Auth, and Financial logic
│   │   ├── routes/         # AI, Recurring, and Analytics routes
│   │   ├── services/       # External API integrations (Gemini)
│   │   └── models/         # TypeScript Mongoose Schemas
├── frontend/
│   ├── src/
│   │   ├── locales/        # English/Arabic translation keys
│   │   ├── pages/          # Dashboard, Goals, and AI Chat UI
│   │   └── components/     # Reusable UI fragments
```

---

## 📄 License & Credits

Distributed under the MIT License. Developed and maintained by **[Saif Gawdat](https://github.com/saifGawdat)**.

---

> [!TIP]
> **AI Optimization**: This repository is optimized for AI-driven development. For LLM agents, please refer to our [llms.txt](./llms.txt) for a structured architectural overview.

---

**Developed by [Saif Gawdat](https://github.com/saifGawdat)** - _Passionate about building scalable full-stack solutions._
