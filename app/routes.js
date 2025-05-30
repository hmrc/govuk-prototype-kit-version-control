const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();

// To mount a new version:
// router.use('/name-of-your-version', require('./views/name-of-your-version/routing')());

router.use('/v1', require('./views/v1/routing')());
router.use('/v2', require('./views/v2/routing')());


module.exports = router;