# Version Control in the GOV.UK Prototype Kit

This guide explains how to implement version control in the GOV.UK Prototype Kit.

## Why Use Versioning?

Versioning allows you to maintain multiple iterations of your prototype without affecting previous versions. This is particularly useful for:

- **User Testing:** You can keep an older version live while testing a new one.
- **Stakeholder Feedback:** Different teams can compare multiple versions side by side.
- **Incremental Changes:** It makes it easy to modify and improve designs without breaking existing functionality.

It's important to keep track of what changes you make and why. Consider using an index page to note these down or a separate changelog.

## Key Features

- **Version-Agnostic Forms:** HTML forms do not require hardcoded `action` attributes.
- **Automated Routing and Redirects:** A single middleware automatically prefixes all redirects.
- **Scalable and Maintainable:** Adding a new version is straightforward.

## Code Structure

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

- **`routes.js`**: This is the central routing file. It mounts each version’s router under its respective path (e.g., `/v1`, `/v2`).
- **`routing.js`**: These files define the routes and ensure that all navigation stays within the correct version.

## Example Question Page

```html
<form method="post" novalidate>
    <h1 class="govuk-heading-xl">Question 1</h1>
    <button type="submit" class="govuk-button" data-module="govuk-button">
        Continue
    </button>
</form>
```

The `<form>` element shouldn't have an `action` attribute.

## Automatic Redirects

```javascript
module.exports = () => {
    const govukPrototypeKit = require('govuk-prototype-kit');
    const subRouter = govukPrototypeKit.requests.setupRouter();

    subRouter.use((req, res, next) => {
        const originalRedirect = res.redirect;
        res.redirect = function(url) {
            if (url.startsWith('/') && !url.startsWith(req.baseUrl)) {
                url = req.baseUrl + url;
            }
            return originalRedirect.call(this, url);
        };
        next();
    });

    subRouter.post('/question-1', (req, res) => { res.redirect('/question-2'); });
    subRouter.post('/question-2', (req, res) => { res.redirect('/question-1'); });
    return subRouter;
};
```

This ensures that redirects always include the correct version prefix. If you call `res.redirect('/question-2')`, it automatically updates to `/v1/question-2` or `/v2/question-2`, depending on the version.

- This code should go in the `routing.js` file for each version.
- You must type out the full path to both the question page and the redirect page (e.g., `/question-1`, `/question-2`). You do not need to include `v1` or `v2`—this is handled automatically. However, if your version folder contains subdirectories, you should include the full nested path (e.g., `/nested/question-1`).
- The `subRouter` function should be used instead of the main `router` function.

## Mounting Version-Specific Routers

```javascript
const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();

router.use('/v1', require('./views/v1/routing')());
router.use('/v2', require('./views/v2/routing')());

module.exports = router;
```

This is the `routes.js` file. It mounts the `routing.js` files from each version.

## Creating a New Version

1. Duplicate the `v2` folder and rename it to `v3`. This will create a copy of all pages and routes, so you can update them without affecting previous versions.
2. Open the `routes.js` file and add the following line to mount your new version:

   ```javascript
   router.use('/v3', require('./views/v3/routing')());
   ```

   This ensures that requests to `/v3` are handled by the `v3` routing file.

3. Edit the files inside the `v3` folder to make your changes.

