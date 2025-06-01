import sys
import os

def render(script_path):
    print(f"Rendering: {script_path}")
    os.system(f"manim -pql {script_path}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("No file path provided")
        sys.exit(1)
    script_path = sys.argv[1]
    render(script_path)
