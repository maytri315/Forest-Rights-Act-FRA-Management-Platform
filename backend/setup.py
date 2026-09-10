#!/usr/bin/env python3
"""
Setup script for FRA Atlas AI Backend
This script helps set up the Python environment and install dependencies
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"\n🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed:")
        print(f"Error: {e.stderr}")
        return False

def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    if version.major == 3 and version.minor >= 8:
        print(f"✅ Python {version.major}.{version.minor}.{version.micro} is compatible")
        return True
    else:
        print(f"❌ Python {version.major}.{version.minor}.{version.micro} is not compatible")
        print("Please install Python 3.8 or higher")
        return False

def create_virtual_environment():
    """Create a virtual environment"""
    venv_path = Path("venv")
    if venv_path.exists():
        print("✅ Virtual environment already exists")
        return True
    
    return run_command("python -m venv venv", "Creating virtual environment")

def install_tesseract():
    """Instructions for installing Tesseract OCR"""
    print("\n📋 Tesseract OCR Installation:")
    print("Please install Tesseract OCR separately:")
    print("- Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki")
    print("- macOS: brew install tesseract")
    print("- Ubuntu/Debian: sudo apt-get install tesseract-ocr")
    print("- Add Tesseract to your system PATH")

def install_spacy_model():
    """Install spaCy English model"""
    return run_command(
        "python -m spacy download en_core_web_sm", 
        "Installing spaCy English model"
    )

def main():
    """Main setup function"""
    print("🚀 FRA Atlas AI Backend Setup")
    print("=" * 40)
    
    # Check Python version
    if not check_python_version():
        return False
    
    # Create virtual environment
    if not create_virtual_environment():
        return False
    
    # Activate virtual environment and install requirements
    if os.name == 'nt':  # Windows
        activate_command = "venv\\Scripts\\activate"
        pip_command = "venv\\Scripts\\pip"
        python_command = "venv\\Scripts\\python"
    else:  # Unix/Linux/macOS
        activate_command = "source venv/bin/activate"
        pip_command = "venv/bin/pip"
        python_command = "venv/bin/python"
    
    # Install requirements
    if not run_command(f"{pip_command} install --upgrade pip", "Upgrading pip"):
        return False
    
    if not run_command(f"{pip_command} install -r requirements.txt", "Installing Python packages"):
        return False
    
    # Install spaCy model
    if not run_command(f"{python_command} -m spacy download en_core_web_sm", "Installing spaCy model"):
        print("⚠️  spaCy model installation failed. You can install it later with:")
        print(f"   {python_command} -m spacy download en_core_web_sm")
    
    # Show Tesseract installation instructions
    install_tesseract()
    
    print("\n✅ Setup completed successfully!")
    print("\nNext steps:")
    print("1. Activate the virtual environment:")
    if os.name == 'nt':
        print("   venv\\Scripts\\activate")
    else:
        print("   source venv/bin/activate")
    print("2. Install Tesseract OCR (see instructions above)")
    print("3. Start the server: python main.py")
    print("4. Open http://localhost:8000 in your browser")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
