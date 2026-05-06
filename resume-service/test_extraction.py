import requests
import os

# Configuration
BASE_URL = "http://localhost:8000"
TEST_FILES_DIR = ".." # Files are in the parent directory (root)

def test_extract(file_path):
    if not os.path.exists(file_path):
        print(f"Skipping {file_path}: File not found")
        return

    print(f"\n--- Testing Extraction: {os.path.basename(file_path)} ---")
    url = f"{BASE_URL}/extract"
    
    with open(file_path, "rb") as f:
        files = {"file": f}
        try:
            response = requests.post(url, files=files)
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    print(f"Success: {data['success']}")
                    print(f"Format: {data['metadata']['format']}")
                    print(f"Scanned: {data['metadata']['is_scanned']}")
                    print(f"Text Preview (first 100 chars): {data['text'][:100]}...")
                else:
                    print(f"Service Error: {data.get('error')}")
            else:
                print(f"Failed! Status: {response.status_code}")
                print(f"Error: {response.text}")
        except Exception as e:
            print(f"Request failed: {e}")

if __name__ == "__main__":
    # Test files available in the root directory
    test_files = [
        "../flutter_application_1/DragonMind_SDE_II_-_AWS_Cloud_Report.pdf",
        "../flutter_application_1/DragonMind_UI_UX_Designer_Report.pdf",
        "../flutter_application_1/dragon_logo_transparent_style_1772790134400.png"
    ]
    
    print("Starting Resume Extraction Unit Tests...")
    for file in test_files:
        test_extract(file)
