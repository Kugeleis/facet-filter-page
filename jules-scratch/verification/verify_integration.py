from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    page.goto("http://localhost:5173/facet-filter-page/")

    try:
        # Wait for the product cards to be visible
        expect(page.locator(".card")).to_have_count(2, timeout=5000)
    finally:
        page.screenshot(path="jules-scratch/verification/integration-verification.png")
        browser.close()

with sync_playwright() as playwright:
    run(playwright)