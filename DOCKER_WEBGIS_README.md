# SIH Enhanced WebGIS Platform - Docker Deployment Guide

## 🌍 WebGIS Features Overview

### ✅ Interactive Mapping System
- **Leaflet-based Maps**: Professional zoom, pan, and interactive controls
- **Multi-layer Visualization**: States, Districts, Villages, IFR/CFR Claims
- **Status Indicators**: Color-coded claim status (Green=Approved, Orange=Pending, Red=Rejected) 
- **Village Assets**: AI-detected infrastructure with condition monitoring
- **Real-time Filtering**: Administrative boundaries and tribal group filtering

### ✅ Advanced Analytics Dashboard  
- **Multi-level Progress**: State → District → Block → Village tracking
- **Interactive Charts**: Bar charts, pie charts, trend analysis using Recharts
- **Export Functionality**: CSV (functional), PDF & Excel (ready for integration)
- **Performance Metrics**: Success rates, claim distribution, progress analytics

### ✅ Enhanced User Experience
- **Layer Toggles**: Enable/disable map layers with visual feedback
- **Detailed Popups**: Comprehensive claim and asset information
- **Responsive Design**: Optimized for desktop and mobile
- **Real-time Updates**: Live layer indicator showing active data

## 🚀 Docker Deployment Options

### Option 1: Development Mode (Recommended for Testing)
```bash
# Start all services in development mode
start-docker-webgis.bat

# Or manually:
docker-compose up -d --build
```

**Access Points:**
- **WebGIS System**: http://localhost:5173/webgis
- **Main Backend**: http://localhost:8000
- **Asset Mapping**: http://localhost:8001  
- **Asset Frontend**: http://localhost:3000
- **Database**: localhost:5432

### Option 2: Production Deployment
```bash
# Deploy to production environment  
deploy-production.bat

# Or manually:
docker-compose -f docker-compose.prod.yml up -d --build
```

### Option 3: Health Monitoring
```bash
# Check all services health and performance
health-check.bat

# Or manually check specific services:
docker-compose ps
docker-compose logs -f fra-atlas-system
```

## 🔧 Service Configuration

### Core Services
1. **PostgreSQL + PostGIS**: Spatial database for GIS data
2. **Redis**: Caching and session management  
3. **Backend API**: FastAPI with GIS endpoints
4. **Asset Mapping Backend**: AI detection services
5. **FRA Atlas Frontend**: Enhanced WebGIS interface
6. **Nginx**: Reverse proxy and load balancing

### WebGIS-Specific Environment Variables
```bash
# Development (.env.development)
VITE_BACKEND_URL=http://localhost:8000
VITE_ASSET_BACKEND_URL=http://localhost:8001
VITE_WEBGIS_ENABLED=true
VITE_LEAFLET_TILES=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png

# Production (.env.production)  
VITE_BACKEND_URL=http://your-domain:8000
VITE_ASSET_BACKEND_URL=http://your-domain:8001
VITE_WEBGIS_ENABLED=true
```

## 🧪 Testing WebGIS Features

### 1. Map Visualization
```
Navigate to: http://localhost:5173/webgis
Click: "Test Load Map Component"
Expected: Interactive map with India view
```

### 2. Layer Controls
```
Click: "Show Filters" 
Expand: "Map Layers" section
Toggle: IFR Claims, CFR Claims, Village Assets
Expected: Real-time layer indicator updates
```

### 3. Dashboard Analytics  
```
Click: "Show Dashboard"
Navigate: State/District/Block/Village tabs
Test: Export CSV functionality
Expected: Comprehensive analytics with working CSV export
```

### 4. Interactive Features
```
Click: Map markers (IFR/CFR claims, Village assets)
Expected: Detailed popups with status, area, submission dates
Colors: Green (Approved), Orange (Pending), Red (Rejected)
```

## 📊 Performance Monitoring

### Container Resource Usage
```bash
# Monitor real-time resource usage
docker stats

# Check specific service logs
docker-compose logs -f fra-atlas-system
docker-compose logs -f postgres
```

### Database Health
```bash
# Check PostGIS extension
docker-compose exec postgres psql -U sih_user -d sih_db -c "SELECT postgis_version();"

# Check GIS tables
docker-compose exec postgres psql -U sih_user -d sih_db -c "\dt+ *gis*"
```

## 🔒 Security Considerations

### Development Environment
- Default ports exposed for local testing
- Basic authentication enabled
- CORS configured for local development

### Production Environment  
- Change default passwords in `.env.production`
- Enable HTTPS with SSL certificates
- Configure firewall rules
- Set up proper backup strategies

## 🚀 Deployment Checklist

### Pre-deployment
- [ ] Docker Desktop installed and running
- [ ] Port availability (5173, 8000, 8001, 3000, 5432, 6379)
- [ ] Sufficient disk space (>5GB recommended)
- [ ] Network connectivity for tile downloads

### Post-deployment Verification
- [ ] All containers running: `docker-compose ps`
- [ ] WebGIS accessible: http://localhost:5173/webgis
- [ ] Map loads without errors
- [ ] Filters respond correctly  
- [ ] Dashboard charts render
- [ ] CSV export downloads successfully

## 📞 Support & Troubleshooting

### Common Issues
1. **Port conflicts**: Stop other services using ports 5173, 8000, 8001
2. **Memory issues**: Increase Docker Desktop memory allocation 
3. **Map not loading**: Check network connectivity and tile server access
4. **Database connection**: Verify PostgreSQL container health

### Log Analysis
```bash
# View all service logs
docker-compose logs

# Follow specific service logs
docker-compose logs -f fra-atlas-system
docker-compose logs -f postgres
```

## 🎯 WebGIS System Architecture

```
┌─────────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Vite Frontend     │    │   FastAPI        │    │   PostgreSQL    │
│   (WebGIS UI)       │◄──►│   (GIS APIs)     │◄──►│   + PostGIS     │
│   Port: 5173        │    │   Port: 8000     │    │   Port: 5432    │
└─────────────────────┘    └──────────────────┘    └─────────────────┘
           │                          │                        │
           │                          │                        │
           ▼                          ▼                        ▼
┌─────────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Asset Mapping     │    │   Redis Cache    │    │   Nginx Proxy   │
│   Backend/Frontend  │    │   Session Store  │    │   Load Balance  │ 
│   Ports: 8001/3000  │    │   Port: 6379     │    │   Port: 80/443  │
└─────────────────────┘    └──────────────────┘    └─────────────────┘
```

---

**Ready to deploy? Run `start-docker-webgis.bat` and access your WebGIS system at http://localhost:5173/webgis!**