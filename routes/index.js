const express = require("express");
const router = express.Router();
const UserSchema = require("../models/user");
const { isEmail, isEmpty } = require("validator");
const passport = require("passport");

/* GET home page. */
// router.get("/", async (req, res, next) => {
//   res.render("index", { title: "fuck boy" });
// });
router.get('/', function(req, res){
  res.render('index', { user: req.user, title: "fuck boy" });
});
router.post("/register", async (req, res) => {
  let { fullName, email, password } = req.body;
  if (
    isEmpty(fullName) ||
    !isEmail(email) ||
    isEmpty(password)
  ) {
    res.status(400).json({
      result: "failed",
      data: {},
      message: `wrong data`
    });
    return;
  }
  try {
    let newUser = new UserSchema({ ...req.body, 
      avatarUrl: req.body.avatarUrl ? req.body.avatarUrl : null,
      gender: req.body.gender ? req.body.gender : null
     });
    newUser.save((err, doc) => {
      if (err) {
        return res.status(500).json({ message: `loi server ${err}` });
      }
      if (doc) {
        console.log('user:',doc);
        res.status(200).json({ message: "thanh cong" });
      }
    });
  } catch (error) {
    res.json({
      result: "failed",
      data: {},
      message: `error ${error}`
    });
  }
});
router.get("/account", ensureAuthenticated, function(req, res) {
  res.render("account", { user: req.user, title: "fuck boy" });
});
router.get(
  "/auth/facebook",
  passport.authenticate("facebook", { scope: "email" })
);

router.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", {
    successRedirect: "/",
    failureRedirect: "/login"
  }),
  function(req, res) {
    res.redirect("/");
  }
);

router.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}
module.exports = router;
