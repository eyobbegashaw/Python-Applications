import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
import threading
import pytesseract
from pdf2image import convert_from_path
from PIL import Image, ImageTk
import os
import sys
from datetime import datetime
import webbrowser
import platform

class PDFAmharicExtractor:
    def __init__(self, root):
        self.root = root
        self.root.title("ፒዲኤፍ ወደ አማርኛ ጽሑፍ መቀየሪያ")
        self.root.geometry("1000x700")
        self.root.configure(bg='#2c3e50')
        
        # Set Poppler path based on OS
        self.poppler_path = self.get_poppler_path()
        
        # Variables
        self.pdf_path = tk.StringVar()
        self.output_path = tk.StringVar()
        self.status_var = tk.StringVar(value="ምንም አልተጫነም")
        self.progress_var = tk.IntVar(value=0)
        
        # Style configuration
        self.setup_styles()
        
        # Setup UI
        self.setup_ui()
        
        # Check for Poppler
        self.check_poppler()
        
    def get_poppler_path(self):
        """Get Poppler path based on operating system"""
        system = platform.system()
        
        # Common Poppler paths
        if system == "Windows":
            # Try common Windows paths
            possible_paths = [
                r"C:\poppler\Library\bin",
                r"C:\Program Files\poppler\Library\bin",
                r"C:\poppler\bin",
                r"C:\Program Files\poppler\bin",
                r"C:\Users\{}\Downloads\poppler\bin".format(os.getlogin()),
                os.path.join(os.environ.get('LOCALAPPDATA', ''), 'poppler', 'bin')
            ]
            
            # Check which path exists
            for path in possible_paths:
                if os.path.exists(path):
                    return path
            
            # If no path found, return None
            return None
            
        elif system == "Linux" or system == "Darwin":  # Darwin is macOS
            # Linux and macOS usually have poppler in PATH
            return None
            
        return None
    
    def check_poppler(self):
        """Check if Poppler is installed and show instructions if not"""
        try:
            # Try to convert a dummy PDF to test
            test_pdf = "test_dummy.pdf"
            if not os.path.exists(test_pdf):
                # Create a minimal dummy PDF file for testing
                with open(test_pdf, 'wb') as f:
                    f.write(b'%PDF-1.4\n1 0 obj\n<<>>\nendobj\nxref\n0 2\n0000000000 65535 f\n0000000010 00000 n\ntrailer\n<< /Size 2 /Root 1 0 R >>\nstartxref\n20\n%%EOF\n')
                
            # Test conversion
            if self.poppler_path:
                convert_from_path(test_pdf, poppler_path=self.poppler_path)
            else:
                convert_from_path(test_pdf)
                
            # Clean up test file
            if os.path.exists(test_pdf):
                os.remove(test_pdf)
                
        except Exception as e:
            # Show installation instructions
            self.show_poppler_instructions()
    
    def show_poppler_instructions(self):
        """Show instructions for installing Poppler"""
        instructions = """Poppler is required for PDF processing!

Please install Poppler:

Windows:
1. Download from: http://blog.alivate.com.au/poppler-windows/
2. Extract to: C:\\poppler
3. Add C:\\poppler\\bin to PATH

Linux (Ubuntu/Debian):
sudo apt-get install poppler-utils

macOS:
brew install poppler

After installation, restart the application."""
        
        messagebox.showwarning("Poppler Required", instructions)
        
    def setup_styles(self):
        """Configure custom styles for the application"""
        style = ttk.Style()
        style.theme_use('clam')
        
        # Colors
        self.bg_color = '#2c3e50'
        self.fg_color = '#ecf0f1'
        self.accent_color = '#3498db'
        self.success_color = '#2ecc71'
        self.warning_color = '#e74c3c'
        
        # Configure styles
        style.configure('Title.TLabel', 
                       background=self.bg_color,
                       foreground=self.fg_color,
                       font=('Arial Unicode MS', 24, 'bold'))
        
        style.configure('Custom.TButton',
                       background=self.accent_color,
                       foreground=self.fg_color,
                       font=('Arial Unicode MS', 12),
                       padding=10)
        
        style.map('Custom.TButton',
                 background=[('active', '#2980b9')])
        
        style.configure('Status.TLabel',
                       background=self.bg_color,
                       foreground=self.fg_color,
                       font=('Arial Unicode MS', 10))
        
        style.configure('Custom.Horizontal.TProgressbar',
                       background=self.success_color,
                       troughcolor=self.bg_color)
        
    def setup_ui(self):
        """Create the main UI components"""
        
        # Main container with padding
        main_container = ttk.Frame(self.root, padding="20")
        main_container.pack(fill=tk.BOTH, expand=True)
        
        # Title
        title_label = ttk.Label(main_container, 
                               text="ፒዲኤፍ ወደ አማርኛ ጽሑፍ መቀየሪያ",
                               style='Title.TLabel')
        title_label.pack(pady=(0, 20))
        
        # PDF Selection Frame
        pdf_frame = ttk.LabelFrame(main_container, 
                                  text="ፒዲኤፍ ፋይል ምረጥ",
                                  padding="15")
        pdf_frame.pack(fill=tk.X, pady=(0, 15))
        
        # PDF path entry and browse button
        pdf_entry_frame = ttk.Frame(pdf_frame)
        pdf_entry_frame.pack(fill=tk.X)
        
        ttk.Label(pdf_entry_frame, text="ፒዲኤፍ ፋይል:", 
                 font=('Arial Unicode MS', 12)).pack(side=tk.LEFT, padx=(0, 10))
        
        pdf_entry = ttk.Entry(pdf_entry_frame, 
                             textvariable=self.pdf_path,
                             font=('Arial Unicode MS', 11),
                             width=50)
        pdf_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 10))
        
        browse_btn = ttk.Button(pdf_entry_frame,
                               text="አሰስ",
                               command=self.browse_pdf,
                               style='Custom.TButton')
        browse_btn.pack(side=tk.LEFT)
        
        # Output Settings Frame
        output_frame = ttk.LabelFrame(main_container,
                                     text="ውጤት ማውጫ ማስቀመጫ",
                                     padding="15")
        output_frame.pack(fill=tk.X, pady=(0, 15))
        
        output_entry_frame = ttk.Frame(output_frame)
        output_entry_frame.pack(fill=tk.X)
        
        ttk.Label(output_entry_frame, text="ውጤት ፋይል:", 
                 font=('Arial Unicode MS', 12)).pack(side=tk.LEFT, padx=(0, 10))
        
        default_output = os.path.join(os.path.expanduser("~"), "Desktop", "extracted_amharic.txt")
        self.output_path.set(default_output)
        
        output_entry = ttk.Entry(output_entry_frame,
                                textvariable=self.output_path,
                                font=('Arial Unicode MS', 11),
                                width=50)
        output_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 10))
        
        browse_output_btn = ttk.Button(output_entry_frame,
                                      text="አሰስ",
                                      command=self.browse_output,
                                      style='Custom.TButton')
        browse_output_btn.pack(side=tk.LEFT)
        
        # Poppler Status Frame
        poppler_frame = ttk.Frame(main_container)
        poppler_frame.pack(fill=tk.X, pady=(0, 10))
        
        poppler_status = "✓ Poppler ተገኝቷል" if self.poppler_path else "⚠ Poppler ማስተካከያ ያስፈልጋል"
        poppler_color = self.success_color if self.poppler_path else self.warning_color
        
        self.poppler_label = ttk.Label(poppler_frame,
                                      text=poppler_status,
                                      foreground=poppler_color,
                                      font=('Arial Unicode MS', 10, 'bold'))
        self.poppler_label.pack()
        
        # Configure Poppler Button
        if not self.poppler_path:
            configure_btn = ttk.Button(poppler_frame,
                                      text="Poppler አስተካክል",
                                      command=self.configure_poppler,
                                      style='Custom.TButton')
            configure_btn.pack(pady=(5, 0))
        
        # Progress Frame
        progress_frame = ttk.Frame(main_container)
        progress_frame.pack(fill=tk.X, pady=(0, 15))
        
        self.progress_bar = ttk.Progressbar(progress_frame,
                                           variable=self.progress_var,
                                           maximum=100,
                                           style='Custom.Horizontal.TProgressbar')
        self.progress_bar.pack(fill=tk.X, pady=5)
        
        self.status_label = ttk.Label(progress_frame,
                                     textvariable=self.status_var,
                                     style='Status.TLabel')
        self.status_label.pack()
        
        # Action Buttons Frame
        buttons_frame = ttk.Frame(main_container)
        buttons_frame.pack(pady=(0, 15))
        
        self.convert_btn = ttk.Button(buttons_frame,
                                     text="ፒዲኤፉን ወደ አማርኛ ጽሑፍ ቀይር",
                                     command=self.start_conversion,
                                     style='Custom.TButton',
                                     state=tk.NORMAL)
        self.convert_btn.pack(side=tk.LEFT, padx=5)
        
        self.clear_btn = ttk.Button(buttons_frame,
                                   text="አጽዳ",
                                   command=self.clear_all,
                                   style='Custom.TButton')
        self.clear_btn.pack(side=tk.LEFT, padx=5)
        
        self.open_btn = ttk.Button(buttons_frame,
                                  text="ውጤቱን ክፈት",
                                  command=self.open_output,
                                  style='Custom.TButton',
                                  state=tk.DISABLED)
        self.open_btn.pack(side=tk.LEFT, padx=5)
        
        # Preview Frame
        preview_frame = ttk.LabelFrame(main_container,
                                      text="ውጤት ቅድመ-ዕይታ",
                                      padding="10")
        preview_frame.pack(fill=tk.BOTH, expand=True)
        
        # Text preview with scrollbar
        text_frame = ttk.Frame(preview_frame)
        text_frame.pack(fill=tk.BOTH, expand=True)
        
        self.text_preview = scrolledtext.ScrolledText(text_frame,
                                                     wrap=tk.WORD,
                                                     font=('Arial Unicode MS', 11),
                                                     bg='white',
                                                     fg='black',
                                                     height=15)
        self.text_preview.pack(fill=tk.BOTH, expand=True)
        
        # Add tag for highlighting Amharic text
        self.text_preview.tag_configure("amharic", foreground="green", font=('Arial Unicode MS', 11, 'bold'))
        
        # Statistics Frame (bottom)
        stats_frame = ttk.Frame(main_container)
        stats_frame.pack(fill=tk.X, pady=(10, 0))
        
        self.stats_label = ttk.Label(stats_frame,
                                    text="ስታቲስቲክስ: ምንም አልተጫነም",
                                    style='Status.TLabel')
        self.stats_label.pack()
        
        # Footer
        footer_label = ttk.Label(main_container,
                                text="የተሰራው በ DeepSeek | የፒዲኤፍ አማርኛ ጽሑፍ ማውጫ",
                                style='Status.TLabel')
        footer_label.pack(pady=(10, 0))
        
    def configure_poppler(self):
        """Open dialog to configure Poppler path"""
        poppler_dir = filedialog.askdirectory(
            title="Poppler ቢን ማህደር ምረጥ",
            mustexist=True
        )
        
        if poppler_dir:
            # Check if pdftoppm exists in the directory
            pdftoppm_path = os.path.join(poppler_dir, "pdftoppm.exe" if platform.system() == "Windows" else "pdftoppm")
            
            if os.path.exists(pdftoppm_path):
                self.poppler_path = poppler_dir
                self.poppler_label.config(text="✓ Poppler ተገኝቷል", foreground=self.success_color)
                messagebox.showinfo("ስኬት", "Poppler መንገድ በተሳካ ሁኔታ ተቀምጧል!")
            else:
                messagebox.showerror("ስህተት", 
                                   f"pdftoppm በዚህ ማህደር ውስጥ አልተገኘም።\n"
                                   f"እባክዎ ትክክለኛውን Poppler ቢን ማህደር ይምረጡ።")
    
    def browse_pdf(self):
        """Open file dialog to select PDF file"""
        file_path = filedialog.askopenfilename(
            title="ፒዲኤፍ ፋይል ምረጥ",
            filetypes=[("PDF files", "*.pdf"), ("All files", "*.*")]
        )
        if file_path:
            self.pdf_path.set(file_path)
            self.status_var.set(f"ፒዲኤፍ ተጫኗል: {os.path.basename(file_path)}")
            self.update_stats("ፒዲኤፍ ተጫኗል")
            
    def browse_output(self):
        """Open file dialog to select output location"""
        file_path = filedialog.asksaveasfilename(
            title="ውጤት ፋይል አስቀምጥ",
            defaultextension=".txt",
            filetypes=[("Text files", "*.txt"), ("All files", "*.*")]
        )
        if file_path:
            self.output_path.set(file_path)
            
    def start_conversion(self):
        """Start the conversion process in a separate thread"""
        if not self.pdf_path.get():
            messagebox.showwarning("ማስጠንቀቂያ", "እባክዎ ፒዲኤፍ ፋይል ይምረጡ!")
            return
            
        # Disable convert button during conversion
        self.convert_btn.config(state=tk.DISABLED)
        self.open_btn.config(state=tk.DISABLED)
        
        # Start conversion in separate thread
        thread = threading.Thread(target=self.convert_pdf)
        thread.daemon = True
        thread.start()
        
    def convert_pdf(self):
        """Convert PDF to Amharic text"""
        try:
            self.status_var.set("ፒዲኤፉ በመቀየር ላይ...")
            self.progress_var.set(10)
            
            # Convert PDF to images
            self.root.after(0, self.update_preview, "ፒዲኤፉ ወደ ምስል በመቀየር ላይ...\n")
            
            # Use Poppler path if configured
            if self.poppler_path:
                pages = convert_from_path(self.pdf_path.get(), poppler_path=self.poppler_path)
            else:
                pages = convert_from_path(self.pdf_path.get())
                
            total_pages = len(pages)
            
            self.progress_var.set(30)
            self.root.after(0, self.update_preview, f"ጠቅላላ ገጾች: {total_pages}\n\n")
            
            full_text = ""
            
            # Process each page
            for i, page in enumerate(pages, 1):
                self.status_var.set(f"ገጽ {i}/{total_pages} በማንበብ ላይ...")
                
                # Extract text with Amharic language
                text = pytesseract.image_to_string(page, lang='amh')
                full_text += f"\n--- ገጽ {i} ---\n{text}\n"
                
                # Update progress
                progress_value = 30 + (i / total_pages) * 60
                self.progress_var.set(progress_value)
                
                # Update preview with current page text
                self.root.after(0, self.update_preview, f"ገጽ {i} ተጠናቋል ✓\n")
            
            # Save to file
            self.root.after(0, self.update_preview, "\nውጤቱን በመቀመጥ ላይ...\n")
            
            with open(self.output_path.get(), "w", encoding="utf-8") as f:
                f.write(full_text)
            
            self.progress_var.set(100)
            self.status_var.set("በተሳካ ሁኔታ ተጠናቋል!")
            
            # Show success message
            self.root.after(0, messagebox.showinfo, "እንኳን ደስ አለህ!", 
                          f"ጽሑፉ በተሳካ ሁኔታ ተወስዷል!\n\nየወጣበት ቦታ: {self.output_path.get()}")
            
            # Update preview with extracted text (first 5000 characters)
            preview_text = full_text[:5000] + ("..." if len(full_text) > 5000 else "")
            self.root.after(0, self.update_preview, preview_text)
            
            # Enable buttons
            self.root.after(0, lambda: self.convert_btn.config(state=tk.NORMAL))
            self.root.after(0, lambda: self.open_btn.config(state=tk.NORMAL))
            
            # Update statistics
            char_count = len(full_text)
            word_count = len(full_text.split())
            self.update_stats(f"ገጾች: {total_pages} | ቃላት: {word_count:,} | ፊደላት: {char_count:,}")
            
        except Exception as e:
            self.root.after(0, messagebox.showerror, "ስህተት", 
                          f"ስህተት ተከስቷል: {str(e)}\n\n"
                          f"የሚከተሉትን ያረጋግጡ:\n"
                          f"1. Poppler ተጭኗል።\n"
                          f"2. Poppler መንገድ ትክክል ነው።\n"
                          f"3. PDF ፋይል ትክክል ነው።")
            self.status_var.set("ስህተት ተከስቷል")
            self.progress_var.set(0)
            self.root.after(0, lambda: self.convert_btn.config(state=tk.NORMAL))
            
    def update_preview(self, text):
        """Update the text preview area"""
        self.text_preview.delete(1.0, tk.END)
        self.text_preview.insert(1.0, text)
        
        # Highlight Amharic text (simple detection - could be improved)
        self.highlight_amharic()
        
    def highlight_amharic(self):
        """Simple Amharic text highlighting"""
        text_content = self.text_preview.get(1.0, tk.END)
        
        # Clear previous tags
        for tag in self.text_preview.tag_names():
            if tag != "sel":
                self.text_preview.tag_remove(tag, 1.0, tk.END)
        
        # Simple Amharic character range (Unicode)
        amharic_range = r'[\u1200-\u137F]'
        
        # This is a simple implementation - for production, use regex
        # Here we'll just tag the entire text if it contains Amharic
        if any('\u1200' <= char <= '\u137F' for char in text_content):
            self.text_preview.tag_add("amharic", 1.0, tk.END)
            
    def clear_all(self):
        """Clear all fields and reset the application"""
        self.pdf_path.set("")
        self.output_path.set(os.path.join(os.path.expanduser("~"), "Desktop", "extracted_amharic.txt"))
        self.text_preview.delete(1.0, tk.END)
        self.progress_var.set(0)
        self.status_var.set("ምንም አልተጫነም")
        self.update_stats("ምንም አልተጫነም")
        self.convert_btn.config(state=tk.NORMAL)
        self.open_btn.config(state=tk.DISABLED)
        
    def open_output(self):
        """Open the output file"""
        if os.path.exists(self.output_path.get()):
            try:
                # Try to open with default text editor
                os.startfile(self.output_path.get())  # For Windows
            except:
                # Fallback for other OS or if startfile fails
                webbrowser.open(self.output_path.get())
        else:
            messagebox.showwarning("ማስጠንቀቂያ", "ውጤት ፋይል አልተገኘም!")
            
    def update_stats(self, stats_text):
        """Update statistics label"""
        self.stats_label.config(text=f"ስታቲስቲክስ: {stats_text}")
        

def main():
    # Check if Tesseract is installed
    try:
        pytesseract.get_tesseract_version()
    except Exception as e:
        messagebox.showerror("ስህተት", 
                           "Tesseract OCR አልተገኘም!\n\nእባክዎ የሚከተሉትን ያግኙ:\n"
                           "1. Tesseract OCR ከዚህ ያውርዱ: https://github.com/UB-Mannheim/tesseract/wiki\n"
                           "2. Amharic ቋንቋ መለያ ያክሉ: https://github.com/tesseract-ocr/tessdata\n"
                           "3. መቀመጫውን ያረጋግጡ: pytesseract.pytesseract.tesseract_cmd = r'C:\\Program Files\\Tesseract-OCR\\tesseract.exe'")
        return
        
    root = tk.Tk()
    app = PDFAmharicExtractor(root)
    
    # Center the window
    root.eval('tk::PlaceWindow . center')
    
    # Add Tesseract configuration tip in console
    print("=" * 60)
    print("አስፈላጊ ማስታወሻ:")
    print("1. Tesseract ከተጫነ በኋላ አማርኛ ቋንቋ መለያ መጫን አለቦት።")
    print("2. 'amh.traineddata' ፋይልን ወደ tessdata ማህደር ያስገቡ።")
    print("3. Poppler መጫን አለበት።")
    print("=" * 60)
    
    root.mainloop()

if __name__ == "__main__":
    main()
