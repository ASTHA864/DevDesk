const express = require("express");

const {
  getTickets,
  createTicket,
  getTicketById,
  updateTicketStatus,
} = require("../controllers/ticketController");

const { requireAuth } = require("../middleware/authMiddleware");

const { requireAdmin } = require("../middleware/roleMiddleware");

const router = express.Router();

// Authentication must run before ticket controllers.
router.use(requireAuth);

router.get("/", getTickets);

router.post("/", createTicket);

router.get("/:id", getTicketById);

router.patch("/:id/status", requireAdmin, updateTicketStatus);

module.exports = router;
