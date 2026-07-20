# OfficeFlow Setup Guide

## Requirements

- PHP
- Composer
- Node.js
- npm
- PostgreSQL 17
- Laragon
- Git

## Repository

```bash
git clone https://github.com/poliiii05/officeflow.git
cd officeflow
```
## Backend Setup

```bash
cd backend
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

Backend URL:

```txt
http://127.0.0.1:8000
```

Health endpoint:

```txt
http://127.0.0.1:8000/api/v1/health
```

## Frontend Setup

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend URL:

```txt
http://localhost:5173
```

## PostgreSQL Database

Create database and user:

```sql
CREATE USER officeflow WITH PASSWORD 'secret';
CREATE DATABASE officeflow OWNER officeflow;
GRANT ALL PRIVILEGES ON DATABASE officeflow TO officeflow;
```

Laravel `.env` database config:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=officeflow
DB_USERNAME=officeflow
DB_PASSWORD=secret
```

Frontend `.env` config:

```env
VITE_API_URL=http://127.0.0.1:8000/api/v1
```