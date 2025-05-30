module.exports = () => {
  const govukPrototypeKit = require('govuk-prototype-kit');
  const subRouter = govukPrototypeKit.requests.setupRouter();

  // Middleware to auto-prefix redirects with the top-level folder (e.g. /v1 or /v2)
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

  // Define your routes. These definitions remain unchanged.
  subRouter.post('/question-1', (req, res) => {
    res.redirect('/question-2');
  });

  subRouter.post('/question-2', (req, res) => {
    res.redirect('/question-1');
  });

  // type the full path to the question page and the redirect page
  subRouter.post('/nested/question-1', (req, res) => {
    res.redirect('/nested/question-2');
  });

  subRouter.post('/nested/question-2', (req, res) => {
    res.redirect('/nested/question-1');
  });

  return subRouter;
};
