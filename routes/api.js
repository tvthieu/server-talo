const express = require("express");
const router = express.Router();
const AuthMiddleWare = require("../middleware/AuthMiddleware");
const AuthController = require("../controllers/AuthController");

/**
 * Init all APIs on your application
 * @param {*} app from express
 */
let initAPIs = (app) => {
  router.post("/login", AuthController.login);
  router.post("/register", AuthController.register);
  router.post("/refresh-token", AuthController.refreshToken);
  router.get("/test", async (req, res, next) => {
    res.status(401).json({mes: "respond with a resource"});
  });
  router.get("/logged_in", AuthController.checkLogin);

  // Sử dụng authMiddleware.isAuth trước những api cần xác thực
  router.use(AuthMiddleWare.isAuth);
  // List Protect APIs:
  // router.get("/example-protect-api", ExampleController.someAction);
  router.get("/test2", async (req, res, next) => {
    res.json({mes: "respond with a resource"});
  });
  return app.use("/api", router);
}

module.exports = initAPIs;