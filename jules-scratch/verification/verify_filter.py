from playwright.sync_api import sync_playwright, expect

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Navigate to the local dev server
        page.goto("http://localhost:5173")

        # 2. Wait for the initial product list to be visible.
        # The data generation script creates 7 products.
        expect(page.locator(".product-card")).to_have_count(7)

        # 3. Find and click the "Black" color filter checkbox
        black_filter_label = page.locator("label:has-text('Black')")
        black_filter_label.click()

        # 4. Assert that the product list has updated.
        # Based on the original data, there are 3 black items.
        expect(page.locator(".product-card")).to_have_count(3)

        # 5. Take a screenshot of the filtered view
        page.screenshot(path="jules-scratch/verification/verification.png")

        browser.close()

if __name__ == "__main__":
    run_verification()