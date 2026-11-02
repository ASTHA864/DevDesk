const bcrypt = require("bcrypt");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

// Register a new user
async function register(req, res) {
  const { name, email, password } = req.body || {};

  if (typeof name !== "string" || !name.trim() || name.trim().length > 80) {
    return res.status(400).json({
      message: "Name must contain 1 to 80 characters.",
    });
  }

  if (typeof email !== "string") {
    return res.status(400).json({
      message: "Please provide a valid email address.",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (normalizedEmail.length > 254 || !emailPattern.test(normalizedEmail)) {
    return res.status(400).json({
      message: "Please provide a valid email address.",
    });
  }

  if (
    typeof password !== "string" ||
    password.length < 6 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return res.status(400).json({
      message:
        "Password must contain at least 6 characters and be no more than 72 UTF-8 bytes.",
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    });

    return res.status(201).json({
      message: "Account created successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Please check your registration details.",
      });
    }

    console.error("Registration failed:", error.name);

    return res.status(500).json({
      message: "Could not create account. Please try again.",
    });
  }
}

// Login a user
async function login(req, res) {
  const { email, password } = req.body || {};

  if (
    typeof email !== "string" ||
    !email.trim() ||
    email.trim().length > 254 ||
    typeof password !== "string" ||
    !password ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return res.status(400).json({
      message: "Please provide a valid email and password.",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+passwordHash");

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign({}, process.env.JWT_SECRET, {
      algorithm: "HS256",
      subject: user._id.toString(),
      expiresIn: "15m",
      issuer: "devdesk-api",
      audience: "devdesk-client",
    });

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
      path: "/",
    });


    return res.json({
      message: "Logged in successfully.",

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login failed:", error.name);

    return res.status(500).json({
      message: "Could not log in. Please try again.",
    });
  }
}


// Logout a user
function logout(req, res) {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return res.status(200).json({
    message: "Logged out successfully.",
  });
}
module.exports = {
  register,
  login, logout ,
};
