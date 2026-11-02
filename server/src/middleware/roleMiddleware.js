function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      message: "Only an admin can perform this action.",
    });
  }

  return next();
}

module.exports = {
  requireAdmin,
};
