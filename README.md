# 🎓 CredSwap — Campus Marketplace & Student Living Platform

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E.svg)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-3.6%20Flash-4285F4.svg)](https://deepmind.google/technologies/gemini/)

> **CredSwap** is an all-in-one student-to-student ecosystem designed for university campuses across India. It connects students to buy & sell pre-owned items, find rooms & flatmates, access academic roadmaps, and interact with an AI campus assistant.

---

## 🌟 Key Features

### 🛒 1. Peer-to-Peer Campus Marketplace
- **Verified Student Trading**: Buy and sell textbooks, electronics, cycles, lab equipment, and hostel essentials.
- **Smart Category Filtering & Search**: Instant keyword search with category tagging and status verification.
- **Escrow & Safe Transactions**: Protect buyers and sellers with structured payment and item-handover tracking.
- **Negotiations & Counter-Offers**: Built-in offer management system with real-time updates.

### 🏠 2. Student Room Finder & Accommodation
- **Verified Accommodations**: Discover hostels, PGs, shared flats, and private rooms near university campuses.
- **Detailed Filters**: Filter by room type (Single, Shared, Flat), price range, amenities, and walking proximity.
- **Owner & Student Connections**: Inquire and initiate direct secure messaging with room owners and prospective flatmates.

### 🤖 3. Campus AI Assistant (Powered by Google Gemini 3.6 Flash)
- **Intelligent Database Retrieval**: Real-time context enrichment retrieving live listings and rooms from PostgreSQL.
- **Interactive Card Rendering**: Generates rich interactive preview cards `[ITEM_CARD:id]` and `[ROOM_CARD:id]` directly in conversation.
- **Smart Price Estimation**: AI analyzes item metadata and campus market trends to suggest fair student prices in ₹ INR.
- **High-Availability Fallback**: Orchestrated multi-provider engine (Primary: Google Gemini, Fallback: Groq Llama 3.3).

### 💬 4. Real-Time Chat & Inbox
- **Supabase Realtime**: Instant 1-on-1 direct messaging between students and sellers.
- **Presence & Read Receipts**: Live online status tracking and message delivery synchronization.
- **Integrated Listing Previews**: View item details directly within the conversation window.

### 🛡️ 5. Moderation & Admin Control Center
- **KYC & Verification Badging**: Student ID verification workflows to maintain campus trust.
- **Listing Moderation**: Admin review pipeline for approving, flagging, and managing marketplace listings.
- **Dispute Resolution**: Dedicated dispute tracking interface with audit logs.

---

## 🛠️ Architecture & Tech Stack

```
CredSwap/
├── src/
│   ├── components/       # Reusable UI components & shadcn/ui primitives
│   │   ├── chat/         # Realtime chat interfaces & sidebar
│   │   ├── marketplace/  # Listing cards, offer dialogs, price predictors
│   │   ├── rooms/        # Accommodation cards and listing modals
│   │   └── ui/           # Radix UI primitives with Tailwind styling
│   ├── contexts/         # React Context providers (Auth, Theme)
│   ├── hooks/            # Custom hooks (usePresence, useToast, useIntersectionObserver)
│   ├── lib/              # Core libraries & orchestrators (Supabase, Gemini AI, Push)
│   ├── pages/            # Application routes (Marketplace, RoomFinder, Inbox, Admin)
│   └── types/            # TypeScript schemas & Database interfaces
└── supabase/
    ├── functions/        # Deno edge functions for background workflows
    └── migrations/       # PostgreSQL schema definitions, RLS policies & RPCs
```

### Core Technologies:
- **Frontend Framework**: React 18 with TypeScript & Vite
- **Styling & UI**: Tailwind CSS, Shadcn UI (Radix UI primitives), Lucide Icons
- **Backend & Database**: Supabase (PostgreSQL, Realtime Subscriptions, Row Level Security)
- **Authentication**: Supabase Auth (Email, OAuth, Session Persistence)
- **AI / LLM Engine**: Google Gemini 3.6 Flash API + Groq SDK
- **Storage**: Supabase Storage Buckets (Product images, verification documents, avatars)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+ recommended)
- npm / yarn / bun
- A Supabase Project
- Google Gemini API Key

### 2. Installation

Clone the repository and install dependencies:
```bash
git clone https://github.com/RiyanshSingh/credswap.git
cd credswap
npm install
```

### 3. Environment Configuration

Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
VITE_GEMINI_API_KEY="your-gemini-api-key"
VITE_GROQ_API_KEY="your-groq-api-key" # Optional fallback
```

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Production Build
```bash
npm run build
npm run preview
```

---

## 🔒 Security & Privacy

- **Row Level Security (RLS)**: Enforced on all PostgreSQL tables ensuring users can only edit their own listings, messages, and profile data.
- **Safe Authentication**: Protected routing with session checks and token refresh.
- **Client-Side File Sanitization**: Automatic file size checking and client-side compression before uploading to storage buckets.

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
