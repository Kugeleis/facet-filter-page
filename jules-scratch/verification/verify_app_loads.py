from playwright.sync_api import sync_playwright, expect

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the running application
        page.goto("http://localhost:4174/facet-filter-page/")

        # Wait for the main title to be visible to ensure the page has loaded
        main_title = page.locator("#main-title")
        expect(main_title).to_be_visible()
        expect(main_title).not_to_contain_text("Application Error!")

        # Also, wait for the product list to have some cards rendered
        product_list = page.locator("#product-list-container")
        expect(product_list.locator(".card")).to_have_count(12)

        # Take a screenshot for visual confirmation
        page.screenshot(path="jules-scratch/verification/verification.png")

        browser.close()

if __name__ == "__main__":
    run_verification()