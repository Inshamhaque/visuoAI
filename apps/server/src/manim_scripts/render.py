import sys
import os
from pathlib import Path
import time
import json
import glob

def find_latest_videos_for_scenes(scenes):
    """Find the latest video files for each scene after rendering"""
    video_paths = []
    media_dir = Path("media/videos")
    
    for scene in scenes:
        print(f"Looking for videos for scene: {scene}")
        
        # Search in all subdirectories for videos containing the scene name
        pattern = f"**/*{scene}*.mp4"
        matching_files = list(media_dir.glob(pattern))
        
        if matching_files:
            # Get the most recent file for this scene
            latest_file = max(matching_files, key=lambda x: x.stat().st_mtime)
            video_path = str(latest_file.absolute())
            video_paths.append({
                'scene': scene,
                'path': video_path
            })
            print(f"Found video for {scene}: {video_path}")
        else:
            print(f"No video found for scene: {scene}")
    
    return video_paths

def render(script_path, scenes):
    print(f"Starting render for {len(scenes)} scenes: {', '.join(scenes)}")
    
    # Clear any old media files to avoid confusion
    media_dir = Path("media")
    if media_dir.exists():
        print("Cleaning old media files...")
        for old_file in media_dir.rglob("*.mp4"):
            try:
                old_file.unlink()
            except:
                pass
    
    # Record timestamp before rendering
    start_time = time.time()
    
    # Render all scenes in one command for efficiency
    scenes_args = " ".join(scenes)
    print(f"Running: manim -pql {script_path} {scenes_args}")
    
    result = os.system(f"manim -pql {script_path} {scenes_args}")
    
    if result != 0:
        print("Manim render failed")
        sys.exit(1)
    
    # Wait a moment for file system to settle
    time.sleep(2)
    
    # Find all generated video files
    video_results = find_latest_videos_for_scenes(scenes)
    
    if not video_results:
        print("No output videos found")
        sys.exit(1)
    
    # Output all video files
    for video_info in video_results:
        print(f"OUTPUT_FILE::{video_info['scene']}::{video_info['path']}")
    
    print(f"Successfully generated {len(video_results)} video files")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python render.py <script_path> <scene1> [scene2] ...")
        sys.exit(1)
    
    script_path = sys.argv[1]
    scenes = sys.argv[2:]
    
    render(script_path, scenes)