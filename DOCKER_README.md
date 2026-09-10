# SIH Project - Docker Setup

This project is fully dockerized with support for both development and production environments.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- At least 8GB RAM available
- 10GB free disk space

### Development Mode
```bash
# Start all services in development mode
start-dev.bat

# Or manually:
docker-compose up --build -d
```

### Production Mode  
```bash
# Start all services in production mode
start-prod.bat

# Or manually:
docker-compose -f docker-compose.prod.yml up --build -d
```

## 🏗️ Architecture

### Services Overview
- **backend**: Main FastAPI application (Port 8000)
- **asset-mapping-backend**: Asset mapping ML service (Port 8001) 
- **asset-mapping-frontend**: React frontend for asset mapping (Port 3000)
- **fra-atlas-system**: Vite React app for atlas system (Port 5173)
- **postgres**: PostgreSQL database with PostGIS (Port 5432)
- **redis**: Redis cache and session store (Port 6379)
- **nginx**: Reverse proxy and load balancer (Port 80/443)

### Network Architecture
```
Internet → Nginx (80/443) → 
├── Frontend Apps (3000, 5173)
├── Backend APIs (8000, 8001)
└── Database (5432, 6379)
```

## 📁 Directory Structure
```
├── backend/                    # Main FastAPI backend
│   ├── Dockerfile             # Multi-stage Python container
│   └── requirements.txt       # Python dependencies
├── asset-mapping-backend/     # ML backend service  
│   ├── Dockerfile             # Optimized ML container
│   └── requirements.txt       # ML dependencies
├── asset-mapping-frontend/    # React CRA frontend
│   ├── Dockerfile             # Multi-stage Node container
│   └── nginx.conf             # Frontend nginx config
├── fra-atlas-system/          # Vite React frontend
│   ├── Dockerfile             # Multi-stage Vite container  
│   └── nginx.conf             # Frontend nginx config
├── docker/                    # Docker configurations
│   ├── nginx/                 # Nginx reverse proxy setup
│   │   ├── Dockerfile         # Nginx container
│   │   └── conf.d/            # Nginx configurations
│   └── init-db.sql           # Database initialization
├── docker-compose.yml         # Development orchestration
├── docker-compose.prod.yml    # Production orchestration
├── .env.development           # Development environment vars
└── .env.production           # Production environment vars
```

## 🛠️ Development Workflow

### Starting Services
```bash
# Start all services with logs
docker-compose up --build

# Start in background
docker-compose up --build -d

# Start specific service
docker-compose up backend
```

### Viewing Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f asset-mapping-frontend
```

### Running Commands in Containers
```bash
# Backend shell
docker-compose exec backend bash

# Database access
docker-compose exec postgres psql -U sih_user -d sih_db

# Redis CLI
docker-compose exec redis redis-cli
```

### Hot Reloading
- **Python backends**: Auto-reload enabled with volume mounts
- **React frontends**: Hot reload enabled with volume mounts
- **Database**: Persistent data in Docker volumes

## 🚀 Production Deployment

### Environment Setup
1. Copy `.env.production` and update with real values:
   ```bash
   # Update database passwords
   POSTGRES_PASSWORD=your-super-strong-password
   
   # Update API keys
   GOOGLE_API_KEY=your-actual-api-key
   GEMINI_API_KEY=your-actual-gemini-key
   
   # Update JWT secrets
   JWT_SECRET_KEY=your-super-secret-jwt-key
   
   # Update domains
   REACT_APP_BACKEND_URL=https://your-domain.com/api
   ```

2. Start production services:
   ```bash
   start-prod.bat
   ```

### SSL Setup (Optional)
1. Place SSL certificates in `docker/nginx/ssl/`
2. Update nginx configuration for HTTPS
3. Restart nginx service

### Scaling Services
```bash
# Scale backend instances
docker-compose -f docker-compose.prod.yml up --scale backend=3 -d

# Scale frontend instances  
docker-compose -f docker-compose.prod.yml up --scale asset-mapping-frontend=2 -d
```

## 🔧 Maintenance

### Updating Services
```bash
# Rebuild specific service
docker-compose build --no-cache backend

# Update and restart
docker-compose up --build -d
```

### Database Operations
```bash
# Backup database
docker-compose exec postgres pg_dump -U sih_user sih_db > backup.sql

# Restore database  
docker-compose exec -T postgres psql -U sih_user sih_db < backup.sql

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

### Cleanup
```bash
# Clean all resources
cleanup.bat

# Or manually:
docker-compose down -v --remove-orphans
docker system prune -f
```

## 📊 Monitoring

### Health Checks
- Nginx: `http://localhost/health`
- Backend: `http://localhost:8000/docs`
- Asset API: `http://localhost:8001/docs`

### Resource Usage
```bash
# Container stats
docker stats

# Disk usage
docker system df

# Network info
docker network ls
```

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**: Stop other services using ports 3000, 5173, 8000, 8001, 5432
2. **Memory issues**: Increase Docker Desktop memory allocation to 8GB+
3. **Build failures**: Run `cleanup.bat` and rebuild
4. **Database connection**: Ensure PostgreSQL container is healthy

### Debug Commands
```bash
# Check container status
docker-compose ps

# View container logs
docker-compose logs [service-name]

# Inspect containers
docker inspect [container-name]

# Network debugging
docker network inspect sih-coppro_sih-network
```

### Performance Optimization
- Use `.dockerignore` files to exclude unnecessary files
- Multi-stage builds reduce image sizes
- Volume mounts enable fast development iterations
- Health checks ensure service availability

## 🔐 Security Notes

- Change all default passwords in production
- Use environment variables for sensitive data
- Enable SSL/TLS in production
- Regularly update base images
- Monitor container vulnerabilities

## 📝 Environment Variables

See `.env.development` and `.env.production` for complete configuration options.

Key variables to configure:
- Database credentials
- API keys
- JWT secrets  
- Domain names
- File upload limits