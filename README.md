# 🌍 SIH Forest Rights Act (FRA) Management Platform

[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com/)
[![WebGIS](https://img.shields.io/badge/WebGIS-Enhanced-green.svg)](http://localhost:5173/webgis)
[![React](https://img.shields.io/badge/React-18.x-61dafb.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688.svg)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://python.org/)

## 🎯 Project Overview

A comprehensive **Forest Rights Act (FRA) Management Platform** featuring advanced WebGIS capabilities, AI-powered document processing, satellite asset mapping, and decision support systems. Built for the Smart India Hackathon (SIH) to digitize and streamline FRA processes across India.

## 🚀 **Quick Start - Host Locally in 3 Steps**

### **📋 Prerequisites (Install These First):**
- **Windows 10/11** (Primary support)
- **Python 3.8+** - [Download from python.org](https://www.python.org/downloads/)
- **Node.js 16+** - [Download from nodejs.org](https://nodejs.org/en/download/)
- **Git** - [Download from git-scm.com](https://git-scm.com/download/win)

### **🔽 Step 1: Download the Project**
```bash
# Clone the repository
git clone https://github.com/Tweeeter/team_GIGO.git
cd team_GIGO

# OR download ZIP from GitHub and extract
```

### **⚙️ Step 2: Install Dependencies (Run Once)**
```batch
# Double-click this file OR run in Command Prompt/PowerShell:
install-all.bat
```
**What this does:** Installs Python packages, Node.js dependencies, creates virtual environment

### **🚀 Step 3: Start All Services**
```batch
# Double-click this file OR run in Command Prompt/PowerShell:
start-all-local.bat
```
**What this does:** Starts all backend services and frontend applications

## 📱 **Access Your Local Application**

After running `start-all-local.bat`, open these URLs in your browser:

| Service | URL | Description |
|---------|-----|-------------|
| **🗺️ Main WebGIS Platform** | [http://localhost:5173](http://localhost:5173) | Interactive mapping & analytics |
| **�️ WebGIS Maps** | [http://localhost:5173/webgis](http://localhost:5173/webgis) | Advanced mapping interface |
| **🛰️ Asset Mapping** | [http://localhost:3000](http://localhost:3000) | Satellite image analysis |
| **📡 API Documentation** | [http://localhost:8000/docs](http://localhost:8000/docs) | Backend API reference |
| **🤖 DSS System** | [http://localhost:8000/api/dss](http://localhost:8000/api/dss) | Decision support APIs |

## 🌟 **Key Features You Can Use**

### **🗺️ Interactive WebGIS System**
- **Leaflet-based Maps** with zoom, pan, multi-layer support
- **IFR/CFR Claims Visualization** with color-coded status
- **Village Asset Mapping** with AI detection results
- **Advanced Filtering** by states, districts, villages
- **Fullscreen Mode** for immersive mapping experience

### **🤖 AI-Powered Document Processing**
- **OCR Text Extraction** from uploaded documents
- **NER Entity Recognition** for structured data
- **Gemini AI Integration** for intelligent processing
- **Batch Processing** support for multiple files

### **🛰️ Satellite Asset Detection**
- **Computer Vision Analysis** of satellite imagery  
- **NDVI Vegetation Index** calculations
- **Land Use Classification** with confidence scores
- **Asset Detection** (roads, buildings, water bodies)

### **📊 Analytics & Decision Support**
- **Multi-level Progress Tracking** (State → District → Village)
- **CSS Scheme Eligibility Assessment**
- **Village Intervention Prioritization**
- **Interactive Charts** and data visualization
- **Export Capabilities** (CSV, PDF, Excel ready)

## 🔧 **Manual Setup (Alternative Method)**

If the automated scripts don't work, follow these manual steps:

### **Backend Setup:**
```bash
# 1. Create Python virtual environment
python -m venv .venv
.venv\Scripts\activate

# 2. Install Python dependencies
cd backend
pip install -r requirements.txt
cd ..

cd asset-mapping-backend  
pip install -r requirements.txt
cd ..

# 3. Start backend services
cd backend
python main_dss.py
# Keep this terminal open, open new terminal for next step
```

### **Frontend Setup:**
```bash
# 1. Install Node.js dependencies
cd fra-atlas-system
npm install
npm run dev
# Keep this terminal open, open new terminal for next step

# 2. Start asset mapping frontend
cd asset-mapping-frontend
npm install  
npm run dev
```

## 🏗️ **System Architecture**

```
┌─────────────────────────────────────────┐
│             Frontend Layer              │
├─────────────────────────────────────────┤
│  🌐 FRA Atlas (Port 5173)              │
│  🛰️ Asset Mapping (Port 3000)         │
└─────────────────────────────────────────┘
                    ↕ HTTP API
┌─────────────────────────────────────────┐
│             Backend Layer               │
├─────────────────────────────────────────┤
│  🚀 DSS Backend (Port 8000)            │
│  🔍 Asset Mapping API (Port 8002)      │
│  📄 Document Processing                 │
│  🤖 AI Services (OCR, NER, Gemini)     │
└─────────────────────────────────────────┘
```

## 📂 **Project Structure**
```
team_GIGO/
├── 📁 backend/                    # Main FastAPI backend
│   ├── main_dss.py               # DSS server entry point
│   ├── requirements.txt          # Python dependencies
│   └── app/                      # Application modules
├── 📁 asset-mapping-backend/     # AI analysis backend
├── 📁 asset-mapping-frontend/    # React asset mapping UI
├── 📁 fra-atlas-system/          # Main React frontend
│   ├── src/pages/WebGISPageSimple.tsx  # Main mapping page
│   ├── src/components/           # Reusable components
│   └── package.json              # Node.js dependencies
├── � install-all.bat            # Auto-installer
├── 🚀 start-all-local.bat        # Service launcher
├── ⚙️ launcher.bat               # Alternative launcher
└── 📋 README.md                  # This file
```

## 🌐 **Using the Application**

### **1. WebGIS Mapping:**
- Navigate to [http://localhost:5173/webgis](http://localhost:5173/webgis)
- Use map controls to zoom and pan
- Toggle layers (IFR Claims, CFR Claims, Assets, Boundaries)
- Click **Fullscreen** button for immersive experience
- Use filters to narrow down by state/district

### **2. Document Processing:**
- Go to FRA Data Management section
- Upload PDF/image documents
- View OCR extraction results
- See NER entity recognition
- Download structured data

### **3. Asset Mapping:**
- Visit [http://localhost:3000](http://localhost:3000)
- Upload satellite images
- View AI analysis results
- Examine NDVI vegetation calculations
- Export detection results

## 🛠️ **Troubleshooting**

### **Common Issues & Solutions:**

#### **🚨 "Port already in use" Error:**
```bash
# Find and kill processes using ports
netstat -ano | findstr :5173
taskkill /PID <process_id> /F
```

#### **🚨 Python/Node.js not found:**
- **Python**: Download from [python.org](https://python.org/downloads/)
- **Node.js**: Download from [nodejs.org](https://nodejs.org/download/)
- **Restart** Command Prompt after installation

#### **🚨 Virtual environment issues:**
```bash
# Delete and recreate virtual environment
rmdir /s .venv
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt
```

#### **🚨 Frontend dependencies fail:**
```bash
# Clear npm cache and reinstall
cd fra-atlas-system
npm cache clean --force
rmdir /s node_modules
npm install
```

### **🔍 Verify Installation:**
- **Python**: `python --version` (should show 3.8+)
- **Node.js**: `node --version` (should show 16+)  
- **Git**: `git --version`
- **Pip**: `pip --version`

---
**Built with ❤️ for Smart India Hackathon (SIH) 2024**
