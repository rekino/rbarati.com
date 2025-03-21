module.exports = {
    ensureAuthenticated: (req, res, next) => {
      if (req.isAuthenticated()) {
        return next(); // User is logged in, allow access
      }
      res.redirect('/login'); // Redirect to login page
    }
  };
  