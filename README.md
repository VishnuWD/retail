# pixelcode.in

> Modern, High-Performance Retail POS, Inventory & Store Management Platform built with Next.js App Router, Prisma ORM, and Tailwind CSS.

---

## 🚀 Overview

**pixelcode.in** is a full-featured Point of Sale (POS) and retail management application designed for FMCG, supermarkets, retail stores, and grocery merchants. It features offline-first local storage fallback, cloud database persistence, 58mm/80mm thermal receipt printing, GST tax invoice generation, customer credit (Khata) tracking, automated stock alerts, and multi-language support.

---

## ✨ Features

- 🛒 **High-Speed POS Register**: Fast barcode scanning, live search, cart calculations, discount rules, split payments (Cash, UPI, Card, Store Credit), and keyboard shortcuts (`Ctrl+K`, `Ctrl+Enter`).
- 🖨️ **Thermal & Tax Invoice Printing**: 
  - 1-click direct invisible thermal printing (58mm POS & 80mm Wide Desktop Thermal rolls).
  - Standalone clean `@media print` isolation at `/print/[id]` without dashboard chrome.
  - Full A4 retail tax invoice format.
- 📦 **Inventory & Stock Tracking**: Real-time batch stock ledger, stock adjustments, low stock alerts, supplier purchase orders, and receiving.
- 👥 **Customer Profile & Khata Ledger**: Customer Udhaar balance management, debt collection receipts, payment settlements, and WhatsApp digital receipt sharing.
- 🌐 **Multi-Language Support**: English, Hindi (हिन्दी), Tamil (தமிழ்), Telugu (తెలుగు), Kannada (ಕನ್ನಡ), Malayalam (മലയാളം), Bengali (বাংলা), Marathi (मराठी), and Gujarati (ગુજરાતી).
- 💾 **Dual Storage Engine**: Client-side offline-ready local storage with realistic FMCG catalog + PostgreSQL / Prisma cloud backend.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Database & ORM**: PostgreSQL / Prisma ORM
- **UI & Styling**: Tailwind CSS, Lucide Icons, Framer Motion
- **Form & Validation**: React Hook Form, Zod
- **Charts & Reports**: Recharts

---

## 🏁 Getting Started

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/VishnuWD/pixelcode.in.git
cd pixelcode.in

# Install dependencies
npm install
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/pixelcode_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.