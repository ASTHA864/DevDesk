const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/user");

async function requireAuth(req, res, next) {
  // Token ab Authorization header nahi, cookie se aayega.
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({
      message: "Please log in to continue.",
    });
  }

  let payload;

  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "devdesk-api",
      audience: "devdesk-client",
    });
  } catch {
    return res.status(401).json({
      message: "Invalid or expired session. Please log in again.",
    });
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    !mongoose.isObjectIdOrHexString(payload.sub)
  ) {
    return res.status(401).json({
      message: "Invalid session. Please log in again.",
    });
  }

  try {
    const user = await User.findById(payload.sub);

    if (!user) {
      return res.status(401).json({
        message: "Please log in again.",
      });
    }

    req.user = user;

    return next();
  } catch (error) {
    console.error("Authentication failed:", error.name);

    return res.status(500).json({
      message: "Could not authenticate request.",
    });
  }
}

module.exports = {
  requireAuth,
};
