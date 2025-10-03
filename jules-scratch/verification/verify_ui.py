from playwright.sync_api import sync_playwright, Page, expect

def run_verification(page: Page):
    """
    Navigates to the app, verifies initial state, applies filters,
    and takes screenshots to verify UI changes.
    """
    # 1. Navigate to the app
    page.goto("http://localhost:5173/")

    # 2. Wait for the initial product cards to load and take a screenshot
    expect(page.locator(".product-card").first).to_be_visible(timeout=10000)
    page.screenshot(path="jules-scratch/verification/01_initial_view.png")

    # 3. Apply a categorical filter (Color: Red)
    # Use get_by_role for a more robust locator
    red_checkbox = page.get_by_role('checkbox', name='Red')
    expect(red_checkbox).to_be_visible()
    red_checkbox.check()

    # Wait for the product list to update.
    page.wait_for_timeout(1000)
    page.screenshot(path="jules-scratch/verification/02_after_color_filter.png")

    # 4. Apply a continuous filter (Price)
    price_sliders = page.locator("#slider-price .noUi-handle")
    left_slider = price_sliders.nth(0)

    # Drag the left slider to the right to increase the minimum price
    left_slider_bb = left_slider.bounding_box()
    page.mouse.move(left_slider_bb['x'] + left_slider_bb['width'] / 2, left_slider_bb['y'] + left_slider_bb['height'] / 2)
    page.mouse.down()
    page.mouse.move(left_slider_bb['x'] + 100, left_slider_bb['y'] + left_slider_bb['height'] / 2)
    page.mouse.up()

    # Wait for re-render and take the final screenshot
    page.wait_for_timeout(1000)
    page.screenshot(path="jules-scratch/verification/03_after_price_filter.png")


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        run_verification(page)
        browser.close()

if __name__ == "__main__":
    main()