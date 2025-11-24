#!/usr/bin/env python3
"""
Icon Generator Script for Moodle PDF Downloader Extension
Creates PNG icon files in the icons/ directory
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, output_path):
    """Creates a PNG icon with the specified size"""
    # Create image with gradient background
    img = Image.new('RGB', (size, size), color='#667eea')
    draw = ImageDraw.Draw(img)
    
    # Draw gradient effect (simplified - solid color with darker border)
    padding = int(size * 0.15)
    doc_width = size - padding * 2
    doc_height = size - padding * 2
    corner_radius = int(size * 0.05)
    
    # Draw document shape (white)
    doc_coords = [
        (padding + corner_radius, padding),
        (padding + doc_width - corner_radius, padding),
        (padding + doc_width, padding + corner_radius),
        (padding + doc_width, padding + doc_height),
        (padding, padding + doc_height),
        (padding, padding + corner_radius)
    ]
    draw.rounded_rectangle(
        [padding, padding, padding + doc_width, padding + doc_height],
        radius=corner_radius,
        fill='white'
    )
    
    # Draw folded corner
    fold_size = int(size * 0.2)
    fold_coords = [
        (padding + doc_width - fold_size, padding),
        (padding + doc_width, padding),
        (padding + doc_width, padding + fold_size)
    ]
    draw.polygon(fold_coords, fill='#e0e0e0')
    
    # Draw "PDF" text
    try:
        # Try to use a system font
        font_size = int(size * 0.25)
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
        except:
            # Fallback to default font
            font = ImageFont.load_default()
    
    text = "PDF"
    # Get text bounding box
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    # Center the text
    text_x = (size - text_width) // 2
    text_y = (size - text_height) // 2 - bbox[1]
    
    draw.text((text_x, text_y), text, fill='#667eea', font=font)
    
    # Save the image
    img.save(output_path, 'PNG')
    print(f"Created {output_path} ({size}x{size})")

def main():
    """Main function to create all icons"""
    icons_dir = 'icons'
    
    # Create icons directory if it doesn't exist
    if not os.path.exists(icons_dir):
        os.makedirs(icons_dir)
    
    # Create icons in different sizes
    sizes = [16, 48, 128]
    for size in sizes:
        output_path = os.path.join(icons_dir, f'icon{size}.png')
        create_icon(size, output_path)
    
    print("\nAll icons created successfully!")
    print("You can now load the extension in Chrome.")

if __name__ == '__main__':
    try:
        main()
    except ImportError:
        print("Error: PIL (Pillow) library is required.")
        print("Install it using: pip install Pillow")
    except Exception as e:
        print(f"Error: {e}")

