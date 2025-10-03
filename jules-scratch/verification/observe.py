from playwright.sync_api import sync_playwright
import time

def run_observation():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        console_messages = []
        page.on("console", lambda msg: console_messages.append(msg.text))

        try:
            print("Navigating to http://localhost:5173...")
            page.goto("http://localhost:5173", wait_until="networkidle")

            print("Waiting for 10 seconds to observe...")
            time.sleep(10)

            print("Capturing final page state...")
            page.screenshot(path="jules-scratch/verification/final_screenshot.png")
            html_content = page.content()

            print("\n--- BROWSER CONSOLE LOGS ---")
            if console_messages:
                for msg in console_messages:
                    print(msg)
            else:
                print("No console messages were captured.")

            print("\n--- PAGE HTML CONTENT ---")
            print(html_content)

        except Exception as e:
            print(f"An error occurred: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run_observation()