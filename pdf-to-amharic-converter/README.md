# 📄 PDF to Amharic Text Converter

A beautiful and advanced desktop application that converts PDF files containing Amharic text into editable text format using OCR (Optical Character Recognition). This tool is specifically designed for Amharic language extraction with a modern GUI interface.

## 🌟 Features

- **Amharic Language Support**: Optimized for extracting Amharic text from PDF documents
- **Modern GUI**: Beautiful dark-themed interface with Amharic language labels
- **Real-time Preview**: See extracted text as the conversion progresses
- **Progress Tracking**: Visual progress bar and page-by-page status updates
- **Statistics Display**: Shows page count, word count, and character count
- **Multi-threading**: Prevents GUI freezing during long conversions
- **Error Handling**: Comprehensive error messages and validation
- **Platform Compatibility**: Works on Windows, Linux, and macOS

## 🛠️ Prerequisites

### 1. Python Dependencies
```bash
pip install pytesseract pdf2image pillow
```

### 2. Tesseract OCR
- **Download**: [Tesseract OCR](https://github.com/UB-Mannheim/tesseract/wiki)
- **Amharic Language Data**: Download `amh.traineddata` from [tessdata](https://github.com/tesseract-ocr/tessdata)
- Place `amh.traineddata` in Tesseract's `tessdata` folder

### 3. Poppler (Required for PDF processing)

#### **Windows:**
1. Download from: [poppler-windows](http://blog.alivate.com.au/poppler-windows/)
2. Extract to: `C:\poppler`
3. Add `C:\poppler\bin` to PATH

#### **Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install poppler-utils
```

#### **macOS:**
```bash
brew install poppler
```

## 📁 Project Structure

```
pdf-to-amharic-converter/
│
├── main.py                    # Main application file
├── requirements.txt           # Python dependencies
├── README.md                  # This file
├── LICENSE                    # License file
│
├── assets/                    # Application assets
│   ├── icon.ico              # Application icon (optional)
│   └── amharic_font.ttf      # Amharic font file (optional)
│
├── docs/                      # Documentation
│   ├── installation_guide.md
│   └── user_manual.md
│
├── samples/                   # Sample files for testing
│   ├── sample_amharic.pdf
│   └── sample_output.txt
│
└── tests/                    # Test files
    └── test_conversion.py
```

## 🚀 Installation & Usage

### Method 1: Direct Run
```bash
# Clone the repository
git clone https://github.com/yourusername/pdf-to-amharic-converter.git
cd pdf-to-amharic-converter

# Install dependencies
pip install -r requirements.txt

# Run the application
python main.py
```

### Method 2: Executable (PyInstaller)
```bash
# Create executable
pyinstaller --onefile --windowed --icon=assets/icon.ico --name="PDF_Amharic_Converter" main.py

# The executable will be in the 'dist' folder
```

## 📋 How to Use

1. **Launch the Application**
   - Run `python main.py` or double-click the executable

2. **Select PDF File**
   - Click "አሰስ" (Browse) to select your PDF file
   - Supported formats: .pdf files

3. **Set Output Location**
   - Default: Desktop/extracted_amharic.txt
   - Click "አሰስ" to choose custom location

4. **Convert**
   - Click "ፒዲኤፉን ወደ አማርኛ ጽሑፍ ቀይር" (Convert PDF to Amharic Text)
   - Monitor progress in real-time

5. **View Results**
   - Preview text in the application
   - Open output file with "ውጤቱን ክፈት" (Open Output)
   - Clear with "አጽዳ" (Clear)

## 🔧 Configuration

### Tesseract Path (if not in PATH)
```python
# Add to main.py if Tesseract is not in system PATH
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
```

### Poppler Path Configuration
The application automatically detects Poppler installation. If not found:
1. Click "Poppler አስተካክል" (Configure Poppler)
2. Browse to Poppler's `bin` directory

## 📊 Features in Detail

### 1. **Smart PDF Processing**
- Converts PDF pages to images
- Processes each page individually
- Maintains page separation in output

### 2. **Amharic OCR Optimization**
- Uses Amharic language model (`lang='amh'`)
- Handles Ethiopic script Unicode range (U+1200 to U+137F)
- Text highlighting for Amharic characters

### 3. **User Interface**
- Amharic language interface
- Dark theme with accent colors
- Responsive layout
- Tooltips and status indicators

### 4. **Error Handling**
- PDF file validation
- Poppler installation check
- Tesseract availability verification
- Comprehensive error messages

## 🐛 Troubleshooting

### Common Issues:

1. **"Poppler not found" error**
   - Install Poppler using instructions above
   - Use the "Configure Poppler" button in the app

2. **"Tesseract not found" error**
   - Install Tesseract OCR
   - Add Amharic language data
   - Set correct path in code

3. **Poor OCR accuracy**
   - Ensure PDF has clear text (not scanned images)
   - Use higher resolution PDFs
   - Check Amharic language data is properly installed

4. **Application crashes**
   - Check all dependencies are installed
   - Ensure sufficient system memory
   - Try with smaller PDF files first

## 🧪 Testing

Run sample tests:
```bash
python tests/test_conversion.py
```

Test with sample PDF:
1. Place a PDF in `samples/` folder
2. Run application and select the sample
3. Verify output matches expected results

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines:
- Follow PEP 8 coding standards
- Add comments for complex logic
- Update documentation as needed
- Test changes thoroughly

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Tesseract OCR** team for the OCR engine
- **Poppler** developers for PDF processing library
- **PIL/Pillow** team for image processing
- **Tkinter** for the GUI framework

## 📞 Support

For issues, questions, or feature requests:
1. Check [Troubleshooting](#-troubleshooting) section
2. Open an issue on GitHub
3. Provide PDF sample and error details

## 🌐 Compatibility

- **Python**: 3.7+
- **OS**: Windows 10+, Ubuntu 18.04+, macOS 10.15+
- **RAM**: Minimum 2GB, 4GB recommended for large PDFs

---

**Note**: OCR accuracy depends on PDF quality and font clarity. For best results, use PDFs with clear, high-contrast text.

Made with ❤️ for the Amharic-speaking community
