const mongoose = require("mongoose");
const Ticket = require("../models/Ticket");

// GET /api/tickets
async function getTickets(req, res) {
  try {
   const filter = req.user.role === "admin" ? {} : { createdBy: req.user._id };

   const tickets = await Ticket.find(filter).sort({
     createdAt: -1,
   });

    res.json(tickets);
  } catch (error) {
    console.error("Failed to fetch tickets:", error.message);

    res.status(500).json({
      message: "Could not load tickets. Please try again.",
    });
  }
}

// POST /api/tickets
async function createTicket(req, res) {
  const title = req.body?.title;
  const description = req.body?.description ?? "";

  if (typeof title !== "string" || !title.trim()) {
    return res.status(400).json({
      message: "Please provide a ticket title.",
    });
  }

  if (title.trim().length > 120) {
    return res.status(400).json({
      message: "Title must be 120 characters or fewer.",
    });
  }

  if (typeof description !== "string") {
    return res.status(400).json({
      message: "Description must be text.",
    });
  }

  if (description.trim().length > 2000) {
    return res.status(400).json({
      message: "Description must be 2000 characters or fewer.",
    });
  }

  try {
    const ticket = await Ticket.create({
      title: title.trim(),
      description: description.trim(),
      createdBy: req.user._id,
    });

    res.status(201).json(ticket);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Please check your ticket details.",
      });
    }

    console.error("Failed to create ticket:", error.message);

    res.status(500).json({
      message: "Could not create ticket. Please try again.",
    });
  }
}

// GET /api/tickets/:id
async function getTicketById(req, res) {
  const { id } = req.params;

  if (!mongoose.isObjectIdOrHexString(id)) {
    return res.status(400).json({
      message: "Invalid ticket ID.",
    });
  }

  try {
 const filter =
   req.user.role === "admin"
     ? { _id: id }
     : {
         _id: id,
         createdBy: req.user._id,
       };

 const ticket = await Ticket.findOne(filter);

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found.",
      });
    }

    res.json(ticket);
  } catch (error) {
    console.error("Failed to fetch ticket:", error.message);

    res.status(500).json({
      message: "Could not load this ticket.",
    });
  }
}

// PATCH /api/tickets/:id/status
async function updateTicketStatus(req, res) {
  const { id } = req.params;
  const status = req.body?.status;

  if (!mongoose.isObjectIdOrHexString(id)) {
    return res.status(400).json({
      message: "Invalid ticket ID.",
    });
  }

  const allowedStatuses = ["open", "in_progress", "resolved"];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      message: "Status must be open, in_progress, or resolved.",
    });
  }

  try {
   const ticket = await Ticket.findById(id);

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found.",
      });
    }

    ticket.status = status;
    await ticket.save();

    res.json(ticket);
  } catch (error) {
    console.error("Failed to update ticket:", error.message);

    res.status(500).json({
      message: "Could not update ticket. Please try again.",
    });
  }
}

module.exports = {
  getTickets,
  createTicket,
  getTicketById,
  updateTicketStatus,
};
