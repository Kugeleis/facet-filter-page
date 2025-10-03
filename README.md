# Facet Filter Page

This project is a single-page application that demonstrates a faceted product filtering system. It is built with Vite, Bulma, and uses `itemsjs` for client-side filtering.

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

## How to use real HTML templates?

Having HTML as a string in JavaScript is not ideal. Here are a few ways to manage HTML templates more effectively:

### 1. Template Literals (Current Approach)

This is what the code was initially using. It's a step up from string concatenation (`'<div>' + content + '</div>'`) because it allows for multi-line strings and easy variable injection.

-   **Pros:** Built into JavaScript (ES6), no dependencies needed. Good for very small, simple components.
-   **Cons:** Can still be hard to read and maintain for complex HTML. Doesn't have built-in escaping, which can be a security risk (XSS) if you're injecting user-provided content.

### 2. The `<template>` HTML Element (Recommended for this project)

The `<template>` element is a native HTML tag designed to hold HTML that isn't rendered immediately but can be cloned and used by JavaScript. This is a great way to separate your HTML structure from your JavaScript logic without adding any new libraries.

-   **Pros:** Native browser feature, no dependencies. Clean separation of HTML and JS. The content is parsed as HTML, so you can write it naturally.
-   **Cons:** Requires you to manually select the template, clone it, and populate it with data in your JavaScript.

**Example Implementation:**

You would add this to your `index.html`:

```html
<template id="product-card-template">
  <div class="column is-one-third">
    <div class="card">
      <div class="card-content">
        <p class="title is-4" data-template-field="name"></p>
        <div class="content">
          <p><strong>Color:</strong> <span data-template-field="color"></span></p>
          <p><strong>Material:</strong> <span data-template-field="material"></span></p>
          <p><strong>Weight:</strong> <span data-template-field="weight"></span> kg</p>
          <p class="subtitle is-5 has-text-weight-bold mt-4" data-template-field="price"></p>
        </div>
      </div>
    </div>
  </div>
</template>
```

And then in your JavaScript (`renderProductCards`):

```javascript
function renderProductCards(products) {
  const container = document.getElementById('product-list-container');
  const template = document.getElementById('product-card-template');
  container.innerHTML = '';

  products.forEach(product => {
    const cardClone = template.content.cloneNode(true);
    cardClone.querySelector('[data-template-field="name"]').textContent = product.name;
    cardClone.querySelector('[data-template-field="color"]').textContent = product.color;
    // ...and so on for other fields
    container.appendChild(cardClone);
  });
}
```

### 3. Dedicated Templating Libraries

For more complex applications, you might use a dedicated library like [Handlebars.js](https://handlebarsjs.com/) or [Mustache.js](https://github.com/janl/mustache.js). These provide more advanced features like loops, conditionals, and partials directly in the template files.

-   **Pros:** Powerful features, logic-less templates, pre-compilation for performance.
-   **Cons:** Adds another dependency to your project. Introduces a new syntax to learn.

### 4. Frontend Frameworks

Modern frontend frameworks like [Vue](https://vuejs.org/), [React](https://react.dev/), or [Svelte](https://svelte.dev/) are the ultimate solution for this problem. They are built around the concept of components, where the HTML, CSS, and JavaScript for a piece of the UI are encapsulated together. This is the standard for building complex web applications.

-   **Pros:** Manages the entire UI layer, state management, and rendering efficiently.
-   **Cons:** A much larger dependency and a significant learning curve. Overkill for a simple project like this one.