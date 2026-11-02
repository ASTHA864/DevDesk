import { useEffect, useState } from "react";

export default function TicketDashboard({ user, onSessionExpired }) {
  const [tickets, setTickets] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  const [updatingId, setUpdatingId] = useState(null);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    let ignore = false;

    async function loadTickets() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/tickets", {
          credentials: "include",
        });

        if (ignore) return;

        if (response.status === 401) {
          onSessionExpired();
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not load tickets.");
        }

        if (!ignore) {
          setTickets(data);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadTickets();

    return () => {
      ignore = true;
    };
  }, [onSessionExpired]);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSaving(true);

    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
        }),
      });

      if (response.status === 401) {
        onSessionExpired();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not create ticket.");
      }

      setTickets((currentTickets) => [data, ...currentTickets]);

      setTitle("");
      setDescription("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(ticketId, newStatus) {
    if (!isAdmin) return;

    setError("");
    setUpdatingId(ticketId);

    try {
      const response = await fetch(`/api/tickets/${ticketId}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (response.status === 401) {
        onSessionExpired();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not update ticket.");
      }

      setTickets((currentTickets) =>
        currentTickets.map((ticket) =>
          ticket._id === data._id ? data : ticket,
        ),
      );

      setSelectedTicket((currentTicket) =>
        currentTicket?._id === data._id ? data : currentTicket,
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleViewDetails(ticketId) {
    setDetailsError("");
    setSelectedTicket(null);
    setDetailsLoading(true);

    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        credentials: "include",
      });

      if (response.status === 401) {
        onSessionExpired();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load this ticket.");
      }

      setSelectedTicket(data);
    } catch (err) {
      setDetailsError(err.message);
    } finally {
      setDetailsLoading(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: "640px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>DevDesk</h1>

      <p>
        {isAdmin
          ? "Review company support tickets and update their progress."
          : "Create support tickets and track their progress."}
      </p>

      <h2>Create a ticket</h2>

      <form onSubmit={handleSubmit}>
        <label htmlFor="title">Ticket title</label>

        <input
          id="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Example: Unable to reset password"
          maxLength={120}
          required
          disabled={saving}
          style={{
            display: "block",
            width: "100%",
            boxSizing: "border-box",
            margin: "10px 0",
            padding: "10px",
          }}
        />

        <label htmlFor="description">Description</label>

        <textarea
          id="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Explain the issue and what you expected to happen."
          maxLength={2000}
          rows={4}
          disabled={saving}
          style={{
            display: "block",
            width: "100%",
            boxSizing: "border-box",
            margin: "10px 0",
            padding: "10px",
            font: "inherit",
          }}
        />

        <button type="submit" disabled={saving || loading || !title.trim()}>
          {saving ? "Creating..." : "Create ticket"}
        </button>
      </form>

      {error && <p role="alert">{error}</p>}

      <h2>{isAdmin ? "All company tickets" : "My tickets"}</h2>

      {loading ? (
        <p role="status">Loading tickets...</p>
      ) : tickets.length === 0 ? (
        <p>No tickets yet.</p>
      ) : (
        <ul style={{ paddingLeft: "20px" }}>
          {tickets.map((ticket) => (
            <li
              key={ticket._id}
              style={{
                marginBottom: "20px",
                paddingBottom: "16px",
                borderBottom: "1px solid #ddd",
              }}
            >
              <h3>{ticket.title}</h3>

              <button
                type="button"
                disabled={detailsLoading || updatingId !== null}
                onClick={() => handleViewDetails(ticket._id)}
              >
                View details
              </button>

              {isAdmin ? (
                <div style={{ marginTop: "12px" }}>
                  <label htmlFor={`status-${ticket._id}`}>Status: </label>

                  <select
                    id={`status-${ticket._id}`}
                    value={ticket.status}
                    disabled={updatingId !== null || detailsLoading}
                    onChange={(event) =>
                      handleStatusChange(ticket._id, event.target.value)
                    }
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In progress</option>
                    <option value="resolved">Resolved</option>
                  </select>

                  {updatingId === ticket._id && (
                    <span role="status"> Saving...</span>
                  )}
                </div>
              ) : (
                <p>Status: {ticket.status.replaceAll("_", " ")}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      <section
        aria-labelledby="ticket-details-heading"
        style={{ marginTop: "32px" }}
      >
        <h2 id="ticket-details-heading">Ticket details</h2>

        {detailsLoading && <p role="status">Loading ticket details...</p>}

        {detailsError && <p role="alert">{detailsError}</p>}

        {!detailsLoading && !detailsError && !selectedTicket && (
          <p>Select a ticket to view its details.</p>
        )}

        {selectedTicket && (
          <article>
            <h3>{selectedTicket.title}</h3>

            <p style={{ whiteSpace: "pre-wrap" }}>
              {selectedTicket.description || "No description provided."}
            </p>

            <p>Status: {selectedTicket.status.replaceAll("_", " ")}</p>

            <p>
              Created: {new Date(selectedTicket.createdAt).toLocaleString()}
            </p>

            <button type="button" onClick={() => setSelectedTicket(null)}>
              Close details
            </button>
          </article>
        )}
      </section>
    </main>
  );
}
