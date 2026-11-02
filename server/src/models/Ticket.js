const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },
    
    title: {
      type: String,
      required: [true, "Please provide a ticket title."],
      trim: true,
      maxlength: [120, "Title must be 120 characters or fewer."],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description must be 2000 characters or fewer."],
      default: "",
    },

    status: {
      type: String,
      enum: ["open", "in_progress", "resolved"],
      default: "open",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Ticket", ticketSchema);
