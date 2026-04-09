# Data-Agnostic Facet Filter Page (Developer Documentation)

This repository contains a highly configurable, data-agnostic single-page application that demonstrates a faceted product filtering system. It is built with Vite, TypeScript, and Bulma, and it uses `itemsjs` for efficient client-side filtering.

This document is intended for developers who want to set up, maintain, or extend the application. For a high-level overview of features, please see the [About Page](about.html).

## How It Works

The application's behavior is controlled by configuration files. At runtime, the app reads `public/setup.json` to determine:
- Which dataset to load.
- What title to display on the page.
- The color theme (primary and link colors).
- UI text for labels and messages.

The dataset itself is composed of three JSON files in the `public/` directory:
1.  **`[dataset].json`**: The actual product data.
2.  **`[dataset]-config.json`**: Mapping of data properties to the UI template.
3.  **`[dataset]-ui-config.json`**: Configuration for filters and facet groups.

## Project Setup and Local Development

### Prerequisites

- **Node.js and npm**: For the frontend application.
- **[Go Task](https://taskfile.dev/)**: For running development tasks.
- **[uv](https://docs.astral.sh/uv/)**: For managing Python scripts and dependencies.

### 1. Install Dependencies

Install Node.js packages and prepare the environment:

```bash
task setup
```

### 2. Prepare and Maintain Your Dataset

Data is maintained in the `scripts/` directory in CSV or YAML format. To use your own dataset (e.g., `my_products`):

1.  Create **`scripts/my_products.csv`** (or `.yaml`): The raw product data.
2.  Create **`scripts/my_products-config.csv`**: Defines how data maps to the UI.
3.  Create **`scripts/my_products-ui-config.yaml`** (or `.csv`): Defines filter groups and types.

#### Supported Filter Types:
- `categorical`: Multi-select checkboxes.
- `continuous`: Dual-handle range slider.
- `boolean`: On/Off switch.
- `continuous-single`: Single-handle slider (min or max).
- `stepped-continuous-single`: Single-handle slider that snaps to values.

### 3. Generate JSON Data

The application requires JSON files. Use the provided Python scripts (via `uv`) to convert your source files:

```bash
# Generate data for the default dataset (boxen)
task data

# Generate data for a custom dataset
task data DATA=my_products
```

This will generate the necessary `.json` files in the `public/` directory.

### 4. Configure `setup.json`

Update `public/setup.json` to point to your dataset and customize the appearance:

```json
{
  "dataset": "my_products",
  "title": "My Custom Showcase",
  "theme": {
    "primary": "#ff3860",
    "link": "#ff8e9b"
  },
  "ui": {
    "filtersLabel": "Refine Results",
    "noProductsMessage": "No items match your selection."
  }
}
```

### 5. Run the Development Server

Start the development server with hot-reload:

```bash
task dev
```

The application will be available at `http://localhost:5173`.

## Testing

This project uses `vitest` for unit tests and `playwright` for end-to-end tests.

```bash
# Run unit and integration tests
task test

# Run e2e tests
task test:e2e

# Run all tests
task test:all
```

## Deployment

The project is configured for GitHub Pages. To create a production build:

```bash
task build
```
The optimized files will be in the `dist/` directory.

## Using as a Template and Keeping in Sync

This repository is designed to be a template for your own data-driven showcase apps. To keep your app updated with the latest improvements from this repository, follow these steps:

### 1. Initialize Your Project
If you used the "Use this template" button on GitHub, you already have your own repository. Clone it locally.

### 2. Set Up Upstream Remote
To pull updates from the original template, add it as a remote named `upstream`:
```bash
git remote add upstream https://github.com/Kugeleis/facet-filter-page.git
```

### 3. Minimize Merge Conflicts
To make syncing easier, avoid modifying core template files. Instead, use these customization features:
- **`public/setup.local.json`**: Create this file to override settings in `setup.json`. It is ignored by Git (via `.gitignore`'s `*.local` rule), so it won't be overwritten when you pull updates.
- **Custom Data Filenames**: Use unique names for your data files in `scripts/` (e.g., `my-products.csv`). When generating JSON, use:
  ```bash
  task data DATA=my-products
  ```
  This avoids conflicts with the default `boxen` data.

### 4. Pulling Updates
When you want to sync with the latest template changes:
```bash
git fetch upstream
git merge upstream/main
```

## Repository

The source code is available at: [https://github.com/Kugeleis/facet-filter-page](https://github.com/Kugeleis/facet-filter-page)
