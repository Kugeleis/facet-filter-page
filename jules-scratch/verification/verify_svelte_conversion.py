from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Listen for console events and print them to the terminal
        page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.type} - {msg.text}"))

        page.goto("http://localhost:5173/")

        # Wait for the product list to be populated
        expect(page.locator('.column.is-one-third')).to_have_count(20, timeout=10000)

        page.screenshot(path="jules-scratch/verification/verification.png")
        browser.close()

if __name__ == "__main__":
    run()