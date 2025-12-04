import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from tkinterdnd2 import DND_FILES, TkinterDnD
from PIL import Image, ImageTk
from rembg import remove
import os
import threading
import sys

class BackgroundRemoverApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Background Remover Pro")
        self.root.geometry("900x600")
        self.root.configure(bg="#f0f0f0")
        
        # Variables
        self.input_path = None
        self.output_path = None
        self.original_image = None
        self.processed_image = None
        
        # Configure styles
        self.setup_styles()
        
        # Create UI
        self.create_widgets()
        
    def setup_styles(self):
        self.style = ttk.Style()
        self.style.theme_use('clam')
        
        # Custom colors
        self.colors = {
            'primary': '#4a6fa5',
            'secondary': '#166088',
            'accent': '#db5461',
            'light': '#f8f9fa',
            'dark': '#343a40'
        }
        
    def create_widgets(self):
        # Main container
        main_frame = ttk.Frame(self.root, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Title
        title_label = ttk.Label(
            main_frame, 
            text="🎨 Background Remover Pro", 
            font=('Arial', 24, 'bold'),
            foreground=self.colors['primary']
        )
        title_label.pack(pady=(0, 20))
        
        # Two-column layout
        container = ttk.Frame(main_frame)
        container.pack(fill=tk.BOTH, expand=True)
        
        # Left panel - Input
        left_panel = ttk.LabelFrame(container, text="Input Image", padding="15")
        left_panel.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 10))
        
        # Drag & Drop area
        self.drop_area = tk.Label(
            left_panel,
            text="📁 Drag & Drop Image Here\n\nor\n\nClick to Browse",
            bg='white',
            relief=tk.SUNKEN,
            borderwidth=2,
            font=('Arial', 14),
            cursor="hand2",
            height=15
        )
        self.drop_area.pack(fill=tk.BOTH, expand=True, pady=10)
        self.drop_area.bind('<Button-1>', self.browse_image)
        self.drop_area.drop_target_register(DND_FILES)
        self.drop_area.dnd_bind('<<Drop>>', self.on_drop)
        
        # File info
        self.file_info = ttk.Label(left_panel, text="No file selected", foreground="gray")
        self.file_info.pack(pady=5)
        
        # Right panel - Output & Controls
        right_panel = ttk.Frame(container)
        right_panel.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)
        
        # Preview frame
        preview_frame = ttk.LabelFrame(right_panel, text="Preview", padding="15")
        preview_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 15))
        
        # Image preview
        self.preview_label = tk.Label(preview_frame, bg='white', relief=tk.SUNKEN)
        self.preview_label.pack(fill=tk.BOTH, expand=True)
        
        # Controls frame
        controls_frame = ttk.Frame(right_panel)
        controls_frame.pack(fill=tk.X, pady=10)
        
        # Buttons
        btn_style = {'padding': '10 20', 'font': ('Arial', 11)}
        
        self.process_btn = ttk.Button(
            controls_frame,
            text="🚀 Remove Background",
            command=self.process_image,
            state=tk.DISABLED,
            style='Accent.TButton'
        )
        self.process_btn.pack(side=tk.LEFT, padx=(0, 10))
        
        self.save_btn = ttk.Button(
            controls_frame,
            text="💾 Save Image",
            command=self.save_image,
            state=tk.DISABLED
        )
        self.save_btn.pack(side=tk.LEFT, padx=(0, 10))
        
        self.batch_btn = ttk.Button(
            controls_frame,
            text="📚 Batch Process",
            command=self.batch_process
        )
        self.batch_btn.pack(side=tk.LEFT)
        
        # Progress bar
        self.progress = ttk.Progressbar(
            right_panel,
            mode='indeterminate',
            length=300
        )
        self.progress.pack(pady=10)
        
        # Status bar
        self.status_bar = ttk.Label(
            self.root,
            text="Ready",
            relief=tk.SUNKEN,
            anchor=tk.W,
            padding=(10, 5)
        )
        self.status_bar.pack(side=tk.BOTTOM, fill=tk.X)
        
        # Configure custom button style
        self.style.configure('Accent.TButton', 
                           background=self.colors['accent'],
                           foreground='white')
        
    def browse_image(self, event=None):
        filetypes = [
            ("Image files", "*.jpg *.jpeg *.png *.bmp *.webp"),
            ("All files", "*.*")
        ]
        
        filename = filedialog.askopenfilename(filetypes=filetypes)
        if filename:
            self.load_image(filename)
    
    def on_drop(self, event):
        # Clean up file path from drag & drop
        file_path = event.data.strip('{}')
        if file_path:
            self.load_image(file_path)
    
    def load_image(self, file_path):
        try:
            self.input_path = file_path
            self.original_image = Image.open(file_path)
            
            # Update file info
            file_name = os.path.basename(file_path)
            file_size = os.path.getsize(file_path) / 1024  # KB
            self.file_info.config(
                text=f"{file_name} ({file_size:.1f} KB)",
                foreground=self.colors['dark']
            )
            
            # Show thumbnail
            self.show_preview(self.original_image)
            
            # Enable process button
            self.process_btn.config(state=tk.NORMAL)
            self.status_bar.config(text="Image loaded. Ready to remove background.")
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load image: {str(e)}")
    
    def show_preview(self, image):
        # Resize for preview
        preview_size = (400, 300)
        image.thumbnail(preview_size, Image.Resampling.LANCZOS)
        
        # Convert for Tkinter
        photo = ImageTk.PhotoImage(image)
        
        self.preview_label.config(image=photo)
        self.preview_label.image = photo  # Keep reference
    
    def process_image(self):
        if not self.original_image:
            messagebox.showwarning("Warning", "Please select an image first!")
            return
        
        # Start processing in thread
        self.process_btn.config(state=tk.DISABLED)
        self.progress.start()
        self.status_bar.config(text="Processing... Please wait.")
        
        threading.Thread(target=self._process_background, daemon=True).start()
    
    def _process_background(self):
        try:
            # Remove background
            output = remove(self.original_image)
            self.processed_image = output
            
            # Update UI in main thread
            self.root.after(0, self._on_processing_complete, output)
            
        except Exception as e:
            self.root.after(0, self._on_processing_error, str(e))
    
    def _on_processing_complete(self, output_image):
        self.progress.stop()
        self.show_preview(output_image)
        self.save_btn.config(state=tk.NORMAL)
        self.status_bar.config(text="Background removed successfully!")
        messagebox.showinfo("Success", "Background removed successfully!")
    
    def _on_processing_error(self, error_msg):
        self.progress.stop()
        self.process_btn.config(state=tk.NORMAL)
        messagebox.showerror("Error", f"Failed to process image: {error_msg}")
        self.status_bar.config(text="Processing failed.")
    
    def save_image(self):
        if not self.processed_image:
            return
        
        filetypes = [
            ("PNG files", "*.png"),
            ("JPEG files", "*.jpg *.jpeg"),
            ("WebP files", "*.webp"),
            ("All files", "*.*")
        ]
        
        filename = filedialog.asksaveasfilename(
            defaultextension=".png",
            filetypes=filetypes
        )
        
        if filename:
            try:
                # Determine format
                if filename.lower().endswith('.jpg') or filename.lower().endswith('.jpeg'):
                    self.processed_image.save(filename, 'JPEG', quality=95)
                elif filename.lower().endswith('.webp'):
                    self.processed_image.save(filename, 'WEBP', quality=95)
                else:
                    self.processed_image.save(filename, 'PNG')
                
                self.status_bar.config(text=f"Image saved to {os.path.basename(filename)}")
                messagebox.showinfo("Success", f"Image saved successfully!\n{filename}")
                
            except Exception as e:
                messagebox.showerror("Error", f"Failed to save image: {str(e)}")
    
    def batch_process(self):
        directory = filedialog.askdirectory()
        if directory:
            # Create output directory
            output_dir = os.path.join(directory, "background_removed")
            os.makedirs(output_dir, exist_ok=True)
            
            # Process all images
            extensions = ('.jpg', '.jpeg', '.png', '.bmp', '.webp')
            for file in os.listdir(directory):
                if file.lower().endswith(extensions):
                    try:
                        input_path = os.path.join(directory, file)
                        output_path = os.path.join(output_dir, f"no_bg_{file}")
                        
                        input_img = Image.open(input_path)
                        output_img = remove(input_img)
                        
                        if file.lower().endswith(('.jpg', '.jpeg')):
                            output_img.save(output_path, 'JPEG', quality=95)
                        else:
                            output_img.save(output_path, 'PNG')
                            
                    except Exception as e:
                        print(f"Failed to process {file}: {e}")
            
            messagebox.showinfo("Batch Complete", 
                              f"Batch processing completed!\nImages saved in: {output_dir}")

def cli_mode():
    """Simple CLI mode for headless environments"""
    print("\n🎨 Background Remover Pro - CLI Mode")
    print("=" * 50)
    
    while True:
        print("\nOptions:")
        print("1. Remove background from single image")
        print("2. Batch process images from directory")
        print("3. Exit")
        
        choice = input("\nSelect option (1-3): ").strip()
        
        if choice == '1':
            file_path = input("Enter image path: ").strip()
            if os.path.exists(file_path):
                try:
                    print("Processing image...")
                    img = Image.open(file_path)
                    output = remove(img)
                    
                    output_path = file_path.rsplit('.', 1)[0] + '_no_bg.png'
                    output.save(output_path, 'PNG')
                    print(f"✓ Image saved to: {output_path}")
                except Exception as e:
                    print(f"✗ Error: {e}")
            else:
                print("✗ File not found!")
        
        elif choice == '2':
            directory = input("Enter directory path: ").strip()
            if os.path.isdir(directory):
                try:
                    output_dir = os.path.join(directory, "background_removed")
                    os.makedirs(output_dir, exist_ok=True)
                    
                    extensions = ('.jpg', '.jpeg', '.png', '.bmp', '.webp')
                    processed = 0
                    
                    for file in os.listdir(directory):
                        if file.lower().endswith(extensions):
                            try:
                                input_path = os.path.join(directory, file)
                                output_path = os.path.join(output_dir, f"no_bg_{file}")
                                
                                img = Image.open(input_path)
                                output = remove(img)
                                
                                if file.lower().endswith(('.jpg', '.jpeg')):
                                    output.save(output_path, 'JPEG', quality=95)
                                else:
                                    output.save(output_path, 'PNG')
                                
                                processed += 1
                                print(f"✓ {file}")
                            except Exception as e:
                                print(f"✗ {file}: {e}")
                    
                    print(f"\n✓ Batch complete! {processed} images processed.")
                    print(f"  Output: {output_dir}")
                except Exception as e:
                    print(f"✗ Error: {e}")
            else:
                print("✗ Directory not found!")
        
        elif choice == '3':
            print("Goodbye!")
            break
        else:
            print("✗ Invalid option!")

def main():
    try:
        root = TkinterDnD.Tk()
        app = BackgroundRemoverApp(root)
        root.mainloop()
    except Exception as e:
        if "no display name" in str(e) or "_tkinter.TclError" in str(type(e).__name__):
            print("\n⚠️  GUI mode unavailable (no display server)")
            print("Starting CLI mode instead...\n")
            cli_mode()
        else:
            raise

if __name__ == "__main__":
    main()