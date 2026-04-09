# Todo List App

Aplikasi Todo List full-stack dengan **Node.js/Express**, **MongoDB Atlas**, dan frontend **vanilla HTML/CSS/JS**.

##  Fitur

- ✅ Tambah todo baru (title + deskripsi)
- ✏️ Edit todo
- 🗑️ Hapus todo
- ☑️ Toggle status selesai
- 🔍 Filter (Semua / Aktif / Selesai)
- 🎨 Dark theme premium dengan glassmorphism
- 📱 Responsive design

##  Tech Stack

| Layer    | Technology       |
| -------- | ---------------- |
| Backend  | Node.js, Express |
| Database | MongoDB Atlas    |
| ODM      | Mongoose         |
| Frontend | HTML, CSS, JS    |

##  Setup

### 1. Clone & Install

```bash
cd backend
npm install
```

### 2. Konfigurasi Environment

Edit file `backend/.env`:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
PORT=3000
```

### 3. Jalankan Server

```bash
# Development (hot-reload)
npm run dev

# Production
npm start
```

Buka browser di `http://localhost:3000`

## 📡 API Endpoints

| Method | Endpoint     | Deskripsi          |
| ------ | ------------ | ------------------ |
| GET    | `/todos`     | Ambil semua todo   |
| POST   | `/todos`     | Tambah todo baru   |
| PUT    | `/todos/:id` | Update todo        |
| DELETE | `/todos/:id` | Hapus todo         |

### Contoh Request Body (POST/PUT)

```json
{
  "title": "Belajar Node.js",
  "description": "Pelajari Express dan MongoDB",
  "isCompleted": false
}
```

### Contoh Response

```json
{
  "success": true,
  "message": "Todo berhasil ditambahkan",
  "data": {
    "_id": "...",
    "title": "Belajar Node.js",
    "description": "Pelajari Express dan MongoDB",
    "isCompleted": false,
    "createdAt": "2026-04-08T03:00:00.000Z",
    "updatedAt": "2026-04-08T03:00:00.000Z"
  }
}
```

## 📂 Struktur Project

```
Website-To-Do/
├── backend/
│   ├── config/db.js       # Koneksi MongoDB
│   ├── models/Todo.js     # Mongoose schema
│   ├── routes/todos.js    # API routes
│   ├── server.js          # Entry point
│   ├── .env               # Environment variables
│   └── package.json
├── frontend/
│   ├── css/style.css      # Styling
│   ├── js/app.js          # Frontend logic
│   └── index.html         # Main page
└── README.md
```
