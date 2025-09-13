# File Upload Server

This is the backend server for the file upload application.

## Setup & Installation

1. **Navigate to the server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```
   
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

## Server Details

- **Port:** 3001
- **Allowed file types:** .txt, .pdf
- **Max file size:** 10MB per file
- **Upload directory:** `server/uploads/`
- **CORS:** Configured for `http://localhost:5173` (Vite dev server)

## API Endpoints

- **POST /upload** - Upload multiple files
- **GET /files** - List all uploaded files  
- **GET /files/:filename** - Download/view a specific file

## File Storage

All uploaded files are stored in the `server/uploads/` directory. The server will automatically create this directory if it doesn't exist.

## Important Notes

- Make sure to run this server before using the frontend upload functionality
- The frontend expects the server to be running on `http://localhost:3001`
- Files are served statically from `/files/` endpoint