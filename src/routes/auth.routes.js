const express = require('express');
const authController = require("../controller/auth.controller");


const router = express.Router();

/* POST /api/auth/register */
router.post("/register", authController.registerController)
 
/* POST /api/auth/login */
router.post("/login", authController.loginController)

module.exports = router