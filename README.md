# Facet Filter Page

This project is a single-page application that demonstrates a faceted product filtering system. It is built with Vite, Tailwind CSS, and uses `itemsjs` for client-side filtering.

## Project Setup and Local Development

Follow these steps to get the project running on your local machine.

### Prerequisites

- Node.js and npm
- Python 3

### 1. Install Dependencies

First, install the necessary Node.js packages:

```bash
npm install
```

### 2. Generate Product Data

The application requires a `products.json` file to function. This file is generated from a CSV using a Python script. Run the following command to create it:

```bash
npm run data-build
```
This command must be run before starting the development server. If you don't, the application will fail to load with an error.

### 3. Run the Development Server

Once the dependencies are installed and the data is generated, you can start the Vite development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the next available port).

### 4. Running Tests

This project uses `vitest` for testing. To run the test suite, use:

```bash
npm test
```
The tests cover data loading, error handling, and filtering logic. They run in a `jsdom` environment to simulate a browser.