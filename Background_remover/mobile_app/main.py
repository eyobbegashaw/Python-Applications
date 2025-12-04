from kivy.app import App
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.image import Image
from kivy.uix.button import Button
from kivy.uix.label import Label
from kivy.uix.popup import Popup
from kivy.uix.progressbar import ProgressBar
from kivy.uix.filechooser import FileChooserListView
from kivy.core.window import Window
from kivy.graphics.texture import Texture
from kivy.clock import Clock
from kivy.lang import Builder
from kivy.utils import platform

from rembg import remove
from PIL import Image as PILImage
import io
import os
import threading

# UI Layout
Builder.load_string('''
<BackgroundRemoverMobile>:
    orientation: 'vertical'
    padding: 20
    spacing: 20
    
    BoxLayout:
        size_hint_y: 0.15
        Label:
            text: '🎨 Background Remover'
            font_size: '24sp'
            bold: True
            color: 0.2, 0.4, 0.6, 1
    
    BoxLayout:
        size_hint_y: 0.6
        orientation: 'vertical'
        spacing: 10
        
        Label:
            text: 'Preview'
            font_size: '18sp'
            size_hint_y: 0.1
        
        BoxLayout:
            size_hint_y: 0.9
            Image:
                id: preview_image
                source: ''
                allow_stretch: True
                keep_ratio: True
    
    BoxLayout:
        size_hint_y: 0.25
        orientation: 'vertical'
        spacing: 10
        
        ProgressBar:
            id: progress_bar
            size_hint_y: 0.2
            max: 100
            value: 0
        
        BoxLayout:
            size_hint_y: 0.8
            spacing: 10
            
            Button:
                text: '📁 Open'
                font_size: '16sp'
                on_press: root.open_file_chooser()
                background_color: 0.2, 0.6, 0.8, 1
            
            Button:
                id: process_btn
                text: '🚀 Process'
                font_size: '16sp'
                on_press: root.process_image()
                disabled: True
                background_color: 0.8, 0.2, 0.2, 1
            
            Button:
                id: save_btn
                text: '💾 Save'
                font_size: '16sp'
                on_press: root.save_image()
                disabled: True
                background_color: 0.2, 0.8, 0.2, 1
    
    Label:
        id: status_label
        text: 'Ready'
        font_size: '14sp'
        color: 0.5, 0.5, 0.5, 1
        size_hint_y: 0.1
''')

class BackgroundRemoverMobile(BoxLayout):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.input_image = None
        self.processed_image = None
        self.input_path = None
        
        # Set window size for mobile emulation
        if platform == 'android' or platform == 'ios':
            Window.size = (400, 700)
        else:
            Window.size = (400, 700)
    
    def open_file_chooser(self):
        # Create file chooser popup
        content = BoxLayout(orientation='vertical')
        filechooser = FileChooserListView(filters=['*.png', '*.jpg', '*.jpeg'])
        
        # Buttons
        btn_layout = BoxLayout(size_hint_y=0.2, spacing=10)
        select_btn = Button(text='Select', size_hint_x=0.5)
        cancel_btn = Button(text='Cancel', size_hint_x=0.5)
        
        # Bind buttons
        select_btn.bind(on_press=lambda x: self.select_file(filechooser.path, filechooser.selection))
        cancel_btn.bind(on_press=lambda x: self.popup.dismiss())
        
        # Add widgets
        btn_layout.add_widget(select_btn)
        btn_layout.add_widget(cancel_btn)
        content.add_widget(filechooser)
        content.add_widget(btn_layout)
        
        # Create and open popup
        self.popup = Popup(title='Select Image', 
                          content=content, 
                          size_hint=(0.9, 0.9))
        self.popup.open()
    
    def select_file(self, path, selection):
        if selection:
            self.input_path = os.path.join(path, selection[0])
            self.load_image(self.input_path)
            self.popup.dismiss()
    
    def load_image(self, file_path):
        try:
            self.input_image = PILImage.open(file_path)
            
            # Display preview
            self.display_preview(self.input_image)
            
            # Enable process button
            self.ids.process_btn.disabled = False
            self.ids.status_label.text = f"Loaded: {os.path.basename(file_path)}"
            
        except Exception as e:
            self.show_error(f"Failed to load image: {str(e)}")
    
    def display_preview(self, pil_image):
        # Convert PIL Image to texture
        pil_image = pil_image.convert('RGB')
        data = pil_image.tobytes()
        
        texture = Texture.create(size=(pil_image.width, pil_image.height), colorfmt='rgb')
        texture.blit_buffer(data, colorfmt='rgb', bufferfmt='ubyte')
        
        # Update image widget
        self.ids.preview_image.texture = texture
    
    def process_image(self):
        if not self.input_image:
            self.show_error("Please select an image first!")
            return
        
        # Disable buttons and show progress
        self.ids.process_btn.disabled = True
        self.ids.process_btn.text = "Processing..."
        self.ids.progress_bar.value = 30
        self.ids.status_label.text = "Removing background..."
        
        # Process in background thread
        threading.Thread(target=self._remove_background, daemon=True).start()
    
    def _remove_background(self):
        try:
            # Remove background
            self.processed_image = remove(self.input_image)
            
            # Update UI in main thread
            Clock.schedule_once(lambda dt: self._on_processing_complete())
            
        except Exception as e:
            Clock.schedule_once(lambda dt: self._on_processing_error(str(e)))
    
    def _on_processing_complete(self):
        # Display processed image
        self.display_preview(self.processed_image)
        
        # Update UI
        self.ids.progress_bar.value = 100
        self.ids.process_btn.text = "🚀 Process"
        self.ids.save_btn.disabled = False
        self.ids.status_label.text = "Background removed successfully!"
        
        # Show success message
        self.show_popup("Success", "Background removed successfully!")
    
    def _on_processing_error(self, error):
        # Reset UI
        self.ids.progress_bar.value = 0
        self.ids.process_btn.disabled = False
        self.ids.process_btn.text = "🚀 Process"
        self.ids.status_label.text = "Processing failed"
        
        # Show error
        self.show_error(f"Processing failed: {error}")
    
    def save_image(self):
        if not self.processed_image:
            return
        
        # For mobile, save to Pictures directory
        if platform == 'android':
            from android.storage import primary_external_storage_path
            save_dir = os.path.join(primary_external_storage_path(), 'Pictures', 'BackgroundRemoved')
        else:
            save_dir = os.path.expanduser('~/Pictures/BackgroundRemoved')
        
        os.makedirs(save_dir, exist_ok=True)
        
        # Generate filename
        if self.input_path:
            filename = f"no_bg_{os.path.basename(self.input_path).split('.')[0]}.png"
        else:
            filename = f"no_bg_{int(Clock.get_time())}.png"
        
        save_path = os.path.join(save_dir, filename)
        
        try:
            self.processed_image.save(save_path, 'PNG')
            self.ids.status_label.text = f"Saved to: {filename}"
            self.show_popup("Saved", f"Image saved successfully!\n{save_path}")
            
        except Exception as e:
            self.show_error(f"Failed to save: {str(e)}")
    
    def show_popup(self, title, message):
        content = BoxLayout(orientation='vertical', padding=10, spacing=10)
        content.add_widget(Label(text=message))
        
        ok_btn = Button(text='OK', size_hint_y=0.3)
        popup = Popup(title=title, content=content, size_hint=(0.8, 0.4))
        
        ok_btn.bind(on_press=popup.dismiss)
        content.add_widget(ok_btn)
        
        popup.open()
    
    def show_error(self, message):
        self.show_popup("Error", message)

class BackgroundRemoverApp(App):
    def build(self):
        self.title = "Background Remover Mobile"
        return BackgroundRemoverMobile()
    
    def on_pause(self):
        # Save state when app is paused (mobile)
        return True
    
    def on_resume(self):
        # Restore state when app resumes
        pass

if __name__ == '__main__':
    BackgroundRemoverApp().run()