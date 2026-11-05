# 🏥 MediCare – Hospital Management System

### 💊 Smart Healthcare Management & Doctor Appointment Booking Platform

<p align="center">
  <b>🌐 Live Demo:</b>
  <a href="https://hospital-management-system-u4tu.onrender.com/">Visit MediCare</a>
</p>

---

## 📌 About the Project

**MediCare** is a modern web-based Hospital Management System designed to simplify healthcare operations and improve patient-doctor interactions through a centralized digital platform.

The application provides dedicated portals for patients, doctors, and administrators, enabling efficient appointment management, doctor availability tracking, patient record management, and hospital administration.

---

## 🎯 Project Objectives

- 🩺 Simplify doctor appointment booking.
- 👥 Provide dedicated portals for patients, doctors, and administrators.
- 🔐 Implement secure authentication and role-based access control.
- 📅 Manage doctor availability and appointment schedules.
- 🗂️ Maintain patient and appointment records.
- ⚡ Improve healthcare management efficiency.

---

## ✨ Features

### 👤 Patient Portal

- 🔑 Secure registration and login.
- 🔍 Search doctors by specialization.
- 📅 Check doctor availability.
- 📝 Book and cancel appointments.
- 📋 View appointment history.
- 🏥 Access personal medical records.

### 👨‍⚕️ Doctor Portal

- 📆 View daily and weekly appointment schedules.
- ⏰ Manage availability.
- 📋 View patient appointments.
- ✅ Mark appointments as completed or cancelled.
- 💊 Add prescriptions and medical notes.

### 🛡️ Admin Dashboard

- 👨‍⚕️ Manage doctor profiles.
- 👥 Manage patient accounts.
- 🏢 Manage hospital departments.
- 📊 Monitor appointments and platform statistics.
- ⚙️ Manage hospital operations.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| ⚛️ React.js | Frontend Development |
| 📘 TypeScript | Type-safe Development |
| ⚡ Vite | Development Server & Build Tool |
| 🎨 Tailwind CSS | UI Styling |
| 🗄️ Supabase | Backend Services & Database |
| 🔐 Supabase Authentication | User Authentication |
| 🐘 PostgreSQL | Relational Database |
| 🔄 Git | Version Control |

---

## 📂 Project Structure

```text
MediCare/
│
├── .bolt/
│   ├── config.json
│   └── prompt
│
├── dist/
│   ├── assets/
│   └── index.html
│
├── node_modules/
│
├── src/
│   ├── components/
│   ├── context/
│   ├── lib/
│   ├── portals/
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
│
├── supabase/
│   └── migrations/
│       ├── hospital_help...
│       ├── hospital_table...
│       ├── fix_doctors...
│       └── seed_doctors...
│
├── .env
├── .gitignore
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── postcss.config.js
├── README.md
├── tailwind.config.js
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone <your-repository-url>
```

### 2️⃣ Navigate to Project Directory

```bash
cd MediCare
```

### 3️⃣ Install Dependencies

```bash
npm install
```

### 4️⃣ Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5️⃣ Start Development Server

```bash
npm run dev
```

### 6️⃣ Build for Production

```bash
npm run build
```

---

## 🔐 Security Features

- 🔑 Secure user authentication.
- 🛡️ Role-Based Access Control (RBAC).
- 🔒 Protected portal access.
- 🗄️ Supabase Row Level Security (RLS).
- 🔐 Secure database access policies.

---

## 🚀 Future Enhancements

- 📧 Email and SMS appointment notifications.
- 💊 Prescription PDF downloads.
- 📹 Online doctor consultations.
- 💳 Online payment integration.
- 📈 Advanced healthcare analytics.

---

## 🌐 Deployment

The application can be deployed using:

- ▲ Vercel
- 🚀 Render
- 🌍 Netlify

---

## 👩‍💻 Project Information

| Category | Details |
|---|---|
| Project Name | MediCare |
| Project Type | Full Stack Web Application |
| Domain | Healthcare / Medical Management |
| Frontend | React + TypeScript |
| Backend Services | Supabase |
| Database | PostgreSQL |
| Purpose | Academic & Learning Project |

---

## 📄 License

This project is developed for educational and learning purposes.

---

<p align="center">
  💙 Made with dedication for better healthcare management.
</p>
