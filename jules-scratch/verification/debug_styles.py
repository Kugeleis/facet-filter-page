from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    page.goto("http://localhost:5173/")
    # Wait for the product cards to be visible
    page.wait_for_selector('.card')

    # Add a delay to ensure all styles are loaded and applied
    page.wait_for_timeout(1000)

    page.screenshot(path="jules-scratch/verification/verification.png")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)