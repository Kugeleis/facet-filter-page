# Data-Agnostic Facet Filter Page

This project is a highly configurable, data-agnostic single-page application that demonstrates a faceted product filtering system. It is built with Vite and Bulma, and it uses `itemsjs` for efficient client-side filtering.

The application is designed to be completely decoupled from the data it displays. You can easily swap out datasets by providing a new set of data and configuration files, without touching the source code.

## How It Works

The application's behavior is controlled by a single configuration file: `public/setup.json`. At runtime, the app reads this file to determine:
- Which dataset to load.
- What title to display on the page.
- The color theme (primary and link colors).
- UI text for labels and messages.

This approach allows for maximum flexibility and reusability.

## Project Setup and Local Development

### Prerequisites

- Node.js and npm
- Python 3

### 1. Install Dependencies

First, install the necessary Node.js packages:

```bash
npm install
```

### 2. Prepare Your Dataset

To use your own dataset, you need to create three CSV files inside the `scripts/` directory. Let's assume your dataset is named `my_awesome_products`. You would create:

1.  **`scripts/my_awesome_products.csv`**: The raw data. Each row is an item, and each column is a property.
2.  **`scripts/my_awesome_products-config.csv`**: Defines how data from your CSV maps to the HTML template. It needs `field` and `property` columns.
3.  **`scripts/my_awesome_products-ui-config.csv`**: Defines the filter groups and properties for the UI. It needs `groupName`, `id`, `title`, and `type` (`categorical` or `continuous`).

### 3. Generate JSON Data

The application uses JSON files for data loading. A Python script is provided to convert your CSV files into the required JSON format.

To generate data for the default `boxen` dataset, run:
```bash
npm run data-build
```

To generate data for your custom dataset (e.g., `my_awesome_products`), pass the name as an argument:
```bash
python3 scripts/generate_json.py my_awesome_products
```
This command will create the necessary `.json` files in the `public/` directory.

### 4. Configure `setup.json`

Now, open `public/setup.json` and configure it to use your new dataset and customize the UI:

```json
{
  "dataset": "my_awesome_products",
  "title": "My Awesome Product Showcase",
  "theme": {
    "primary": "#ff3860",
    "link": "#ff8e9b"
  },
  "ui": {
    "filtersLabel": "Refine Your Search",
    "noProductsMessage": "Sorry, no awesome products match your search."
  }
}
```

### 5. Run the Development Server

Once the dependencies are installed and the data is configured, start the Vite development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

## Testing

This project uses `vitest` for testing. To run the test suite, use:
```bash
npm test
```
The tests cover data loading, error handling, and filtering logic. They run in a `jsdom` environment to simulate a browser.