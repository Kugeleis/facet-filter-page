from playwright.sync_api import sync_playwright, Page, expect

def take_screenshot(page: Page):
    """
    Navigates to the app and takes a screenshot after a brief wait.
    """
    # 1. Navigate to the app
    page.goto("http://localhost:5173/")

    # 2. Wait for a fixed time to allow the page to render.
    # This is not best practice for tests, but for a simple diagnostic
    # screenshot, it's sufficient to see what the browser is displaying.
    page.wait_for_timeout(5000)

    # 3. Take a screenshot
    page.screenshot(path="jules-scratch/verification/diagnostic_screenshot.png")


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        take_screenshot(page)
        browser.close()

if __name__ == "__main__":
    main()