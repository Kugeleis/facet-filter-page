from playwright.sync_api import sync_playwright, Page, expect

def run_verification(page: Page):
    """
    Navigates to the app and takes a screenshot to verify product card rendering.
    """
    # 1. Navigate to the application.
    page.goto("http://localhost:5173/")

    # 2. Wait for the product list to be populated.
    # We can wait for one of the product cards to be visible.
    product_list_container = page.locator("#product-list-container")
    expect(product_list_container.locator(".card").first).to_be_visible()

    # 3. Assert that the content is rendered correctly by the new logic.
    # The price of the first product in the CSV is 35000.00.
    first_product_price = page.locator('[data-template-field="price"]').first
    expect(first_product_price).to_have_text("$35000.00")

    # 4. Take a screenshot for visual confirmation.
    page.screenshot(path="jules-scratch/verification/verification.png")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        run_verification(page)
        browser.close()

if __name__ == "__main__":
    main()