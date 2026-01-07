import json
import re

def hex_to_rgb_normalized(hex_color):
    """Convert hex color to normalized RGB array [r, g, b, a]"""
    hex_color = hex_color.lstrip('#')
    r, g, b = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    return [round(r/255, 4), round(g/255, 4), round(b/255, 4), 1]

def modify_lottie_colors(input_file, output_file, color_mapping):
    """
    Modify colors in Lottie JSON file
    color_mapping: dict of old_hex -> new_hex
    """
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Convert to JSON
    data = json.loads(content)
    
    # Convert content to string for replacement
    content_str = json.dumps(data, indent=2)
    
    # Replace colors
    for old_hex, new_hex in color_mapping.items():
        old_rgb = hex_to_rgb_normalized(old_hex)
        new_rgb = hex_to_rgb_normalized(new_hex)
        
        # Format: [0.xxxx, 0.xxxx, 0.xxxx, 1]
        old_pattern = f'[{old_rgb[0]},{old_rgb[1]},{old_rgb[2]}'
        new_pattern = f'[{new_rgb[0]},{new_rgb[1]},{new_rgb[2]}'
        
        content_str = content_str.replace(old_pattern, new_pattern)
        
        # Also try without spaces
        old_pattern_nospace = f'[{old_rgb[0]}, {old_rgb[1]}, {old_rgb[2]}'
        content_str = content_str.replace(old_pattern_nospace, new_pattern)
    
    # Save modified JSON
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content_str)
    
    print(f"✅ Color modification complete! Saved to: {output_file}")

if __name__ == "__main__":
    # Color mapping: Pink shades -> Purple/Cyan theme
    color_map = {
        # Light pink -> Light purple
        '#FFB6C1': '#A29BFE',
        '#FFC0CB': '#74B9FF',
        
        # Hot pink -> Main purple
        '#FF69B4': '#6C5CE7',
        '#FF1493': '#00CEC9',
        
        # Dark pink -> Darker purple
        '#C71585': '#5F3DC4',
        '#DB7093': '#0984E3',
        
        # Additional pink shades
        '#FFE4E1': '#DFE6E9',
        '#FFA07A': '#A29BFE',
    }
    
    input_path = "404-cat.json"
    output_path = "404-cat-themed.json"
    
    modify_lottie_colors(input_path, output_path, color_map)
