Below is the updated documentation that reflects the new middleware, which automatically prefixes both top‐level and nested redirect URLs with the correct version folder. This updated guide explains the new code structure and how it works with nested questions and redirects.

---

# Version Control in the GOV.UK Prototype Kit

This guide explains how to implement version control in the GOV.UK Prototype Kit. The approach lets you manage multiple versions of your prototype while keeping routing mostly automated. It now supports nested routes—so redirects from pages in subdirectories are correctly prefixed with the version folder (e.g. `/v1` or `/v2`)—without requiring you to hardcode version-specific paths in your HTML or route handlers.

---

## Key Features

1. **Version-Agnostic Forms**:
   HTML forms do not require hardcoded `action` attributes. They submit to the current URL, which already includes the version prefix.

2. **Automated Routing and Redirects**:
   A single middleware automatically prefixes all redirects with the correct version folder—even for nested routes—ensuring that navigation stays within the appropriate version.

3. **Scalable and Maintainable**:
   Adding a new version is straightforward. The routing logic and middleware are defined once and work across all versions, regardless of folder depth.

---

## Code Structure

The project is organized as follows:

```
/project-root
  ├── app/
  │   ├── routes.js
  │   └── views/
  │       ├── v1/
  │       │   ├── routing.js
  │       │   ├── question-1.html
  │       │   ├── question-2.html
  │       │   └── nested/
  │       │       ├── question-1.html
  │       │       └── question-2.html
  │       └── v2/
  │           ├── routing.js
  │           ├── question-1.html
  │           └── question-2.html
```

- **`routes.js`**:
  Mounts version-specific routers under `/v1`, `/v2`, etc.

- **`v1/routing.js` and `v2/routing.js`**:
  Define the routes and middleware for each version. The middleware here is now enhanced to work for nested routes.

- **HTML Files**:
  The forms in these files omit the `action` attribute (or use relative URLs), allowing the browser to submit to the current URL that already includes the version.

---

## How It Works

### 1. **Form Submissions Without Hardcoding the Version**

By omitting the `action` attribute (or using a relative URL), a form submits to the current URL. For example, if you’re on `/v1/question-1` or `/v1/nested/question-1`, the submission goes to that same path. This means no version-specific code is required in your HTML.

#### Example Form

```html
{% extends "layouts/main.html" %}
{% set pageName="Question 1" %}

{% block content %}
<div class="govuk-grid-row">
  <div class="govuk-grid-column-two-thirds">
    <!-- The form submits to the current URL (e.g. /v1/question-1 or /v1/nested/question-1) -->
    <form method="post" novalidate>
      <h1 class="govuk-heading-xl">Question 1</h1>
      <button type="submit" class="govuk-button" data-module="govuk-button">
        Continue
      </button>
    </form>
  </div>
</div>
{% endblock %}
```

---

### 2. **Middleware for Automated Redirects**

A middleware function in each version’s `routing.js` overrides `res.redirect` so that if you call, for example, `res.redirect('/question-2')` or `res.redirect('/nested/question-2')`, the middleware automatically prepends the current router’s base URL (e.g. `/v1` or `/v2`). This works regardless of whether the route is at the top level or within a nested directory.

#### Updated Middleware Code

```javascript
module.exports = () => {
  const govukPrototypeKit = require('govuk-prototype-kit');
  const subRouter = govukPrototypeKit.requests.setupRouter();

  // Middleware to auto-prefix redirects with the top-level folder (e.g. /v1 or /v2)
  // This works for both top-level and nested routes.
  subRouter.use((req, res, next) => {
    const originalRedirect = res.redirect;
    res.redirect = function(url) {
      // If the URL is absolute and does not already start with req.baseUrl,
      // then automatically prefix it with req.baseUrl.
      if (url.startsWith('/') && !url.startsWith(req.baseUrl)) {
        url = req.baseUrl + url;
      }
      return originalRedirect.call(this, url);
    };
    next();
  });

  // Define your routes. These definitions remain unchanged.
  subRouter.post('/question-1', (req, res) => {
    res.redirect('/question-2');
  });

  subRouter.post('/question-2', (req, res) => {
    res.redirect('/question-1');
  });

  // Define nested routes by using the full nested path.
  subRouter.post('/nested/question-1', (req, res) => {
    res.redirect('/nested/question-2');
  });

  subRouter.post('/nested/question-2', (req, res) => {
    res.redirect('/nested/question-1');
  });

  return subRouter;
};
```

- **How It Works**:
  - **`req.baseUrl`** is automatically set by Express when the router is mounted (e.g., `/v1` or `/v2`).
  - When a route handler calls `res.redirect('/nested/question-2')`, the middleware checks if the URL already starts with the version prefix. If it doesn’t, it prepends the `req.baseUrl`.
  - This means that regardless of whether your route is defined as `/question-1` or `/nested/question-1`, a redirect will always include the correct version folder.

---

### 3. **Defining Routes**

Because the middleware handles prefixing automatically, your route definitions remain simple and version-agnostic. For instance:

```javascript
// Top-level routes in v1
subRouter.post('/question-1', (req, res) => {
  res.redirect('/question-2'); // becomes /v1/question-2
});

subRouter.post('/question-2', (req, res) => {
  res.redirect('/question-1'); // becomes /v1/question-1
});

// Nested routes in v1
subRouter.post('/nested/question-1', (req, res) => {
  res.redirect('/nested/question-2'); // becomes /v1/nested/question-2
});

subRouter.post('/nested/question-2', (req, res) => {
  res.redirect('/nested/question-1'); // becomes /v1/nested/question-1
});
```

Because the middleware automatically prefixes with `req.baseUrl`, the code above works seamlessly in both top-level and nested directories.

---

### 4. **Mounting Version-Specific Routers**

In the central `routes.js` file, each version’s router is mounted under its respective base path. For example:

```javascript
const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();

// Mount version-specific routers
router.use('/v1', require('./views/v1/routing')());
router.use('/v2', require('./views/v2/routing')());

module.exports = router;
```

- **How It Works**:
  Requests to `/v1/...` are handled by the `v1` router, and requests to `/v2/...` are handled by the `v2` router. The `req.baseUrl` value (e.g. `/v1`) is used by the middleware to ensure that redirects always remain in the correct version.

---

## Creating a New Version

To add a new version (e.g., `v3`):

1. **Create a New Directory**:
   Duplicate an existing version folder (such as `v2`) and rename it to `v3`.

2. **Mount the New Router**:
   In `routes.js`, add:
   ```javascript
   router.use('/v3', require('./views/v3/routing')());
   ```

3. **Test the New Version**:
   Visit `http://localhost:3000/v3/question-1` to verify that both top-level and nested routes and redirects work as expected.

---

## Benefits of This Approach

1. **No Hardcoding of Version-Specific Paths**:
   Both your HTML and route handlers remain version-agnostic.

2. **Automated and Consistent Routing**:
   The middleware ensures that all redirects—whether from top-level or nested routes—automatically include the correct version prefix.

3. **Scalable and Extensible**:
   Adding new versions or supporting more complex folder structures requires minimal changes.

---

## Example Workflow

1. **Access Version 1**:
   - Navigate to `http://localhost:3000/v1/question-1`.
   - Submit the form; the POST request is handled by the v1 router and the redirect is automatically prefixed to `/v1/question-2`.

2. **Access Nested Routes in Version 1**:
   - Navigate to `http://localhost:3000/v1/nested/question-1`.
   - Submit the form; the POST request is handled by the v1 router and the redirect is automatically prefixed to `/v1/nested/question-2`.

3. **Access Version 2**:
   - Navigate to `http://localhost:3000/v2/question-1` and verify similar behavior.

---

## Troubleshooting

- **404 Errors**:
  Ensure that the routers are correctly mounted in `routes.js` and that the middleware is properly applied.

- **Incorrect Redirects**:
  Verify that the middleware is correctly checking if the URL already starts with `req.baseUrl` and that it’s not duplicating the version prefix.

- **Nested Routes Issues**:
  Confirm that your route definitions in nested directories use the full path (e.g., `/nested/question-1`), so the middleware can correctly append the top-level folder.

---

This updated documentation should now clearly explain how the new middleware works—including support for nested routes—and how the overall routing structure is maintained across multiple versions.
