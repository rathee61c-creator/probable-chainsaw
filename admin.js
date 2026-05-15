const roomInventory = document.querySelector("#roomInventory");
const adminRequests = document.querySelector("#adminRequests");
const seedDemo = document.querySelector("#seedDemo");

const renderInventory = () => {
  const bookings = getApprovedRoomBookings();
  roomInventory.innerHTML = Array.from({ length: TOTAL_ROOMS }, (_, index) => {
    const room = index + 1;
    const roomBookings = bookings.filter((booking) => booking.room === room);
    return `
      <div class="room-tile">
        <strong>Room ${room}</strong>
        <span>${roomBookings.length ? `${roomBookings.length} booking(s)` : "Available"}</span>
      </div>
    `;
  }).join("");
};

const updateRequest = (requestId, changes) => {
  const requests = readRequests();
  const nextRequests = requests.map((request) =>
    request.id === requestId ? { ...request, ...changes } : request,
  );
  writeRequests(nextRequests);
  renderAdminRequests();
  renderInventory();
};

const renderAdminCard = (request) => {
  const availableRooms = getAvailableRooms(request);
  const selectableRooms = availableRooms
    .map((room) => `<option value="${room}">Room ${room}</option>`)
    .join("");
  const canApprove = availableRooms.length >= request.roomsRequired;

  return `
    <article class="request-card" data-request-id="${request.id}">
      <span class="badge ${statusClass(request.status)}">${request.status}</span>
      <h3>${escapeHtml(request.guestName)}</h3>
      <div class="request-meta">
        <span><strong>Stay:</strong> ${formatDate(request.checkIn)} → ${formatDate(request.checkOut)}</span>
        <span><strong>Rooms needed:</strong> ${request.roomsRequired}</span>
        <span><strong>Guests:</strong> ${request.adults} adult(s), ${request.children} child(ren)</span>
        <span><strong>Contact:</strong> ${escapeHtml(request.phone)}</span>
        <span><strong>Email:</strong> ${escapeHtml(request.email)}</span>
        <span><strong>Purpose:</strong> ${request.purpose}</span>
      </div>
      ${request.reference ? `<p><strong>Reference:</strong> ${escapeHtml(request.reference)}</p>` : ""}
      ${request.notes ? `<p><strong>Guest notes:</strong> ${escapeHtml(request.notes)}</p>` : ""}
      ${request.allottedRooms.length ? `<p><strong>Allotted rooms:</strong> ${request.allottedRooms.join(", ")}</p>` : ""}
      <div class="admin-controls">
        <label>
          Select room(s)
          <select class="room-select" multiple size="${Math.min(availableRooms.length || 1, 7)}" ${canApprove ? "" : "disabled"}>
            ${selectableRooms || '<option>No rooms available</option>'}
          </select>
        </label>
        <button type="button" data-action="approve" ${canApprove ? "" : "disabled"}>Approve</button>
        <button type="button" class="button-muted" data-action="reject">Reject</button>
      </div>
      ${canApprove ? "" : '<p class="form-message error">Not enough rooms are available for these dates.</p>'}
    </article>
  `;
};

const renderAdminRequests = () => {
  const requests = readRequests().slice().reverse();
  adminRequests.innerHTML = requests.length
    ? requests.map(renderAdminCard).join("")
    : '<p class="muted">No guest requests are waiting for admin action.</p>';
};

adminRequests.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const card = button.closest(".request-card");
  const requestId = card.dataset.requestId;
  const request = readRequests().find((item) => item.id === requestId);
  const action = button.dataset.action;

  if (action === "reject") {
    updateRequest(requestId, {
      status: "Rejected",
      allottedRooms: [],
      adminNote: "Request could not be accommodated for the selected stay dates.",
    });
    return;
  }

  const selectedRooms = Array.from(card.querySelector(".room-select").selectedOptions).map((option) =>
    Number(option.value),
  );

  if (selectedRooms.length !== request.roomsRequired) {
    alert(`Please select exactly ${request.roomsRequired} room(s) before approving.`);
    return;
  }

  updateRequest(requestId, {
    status: "Approved",
    allottedRooms: selectedRooms,
    adminNote: "Your stay is confirmed. Please carry a valid ID at check-in.",
  });
});

seedDemo.addEventListener("click", () => {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const dayAfter = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const requests = readRequests();
  requests.push({
    id: crypto.randomUUID(),
    submittedAt: new Date().toISOString(),
    status: "Pending",
    allottedRooms: [],
    adminNote: "",
    guestName: "Demo Guest",
    phone: "+1 555 0100",
    email: "demo@example.com",
    reference: "Walk-in enquiry",
    checkIn: tomorrow,
    checkOut: dayAfter,
    roomsRequired: 1,
    adults: 2,
    children: 0,
    arrivalTime: "15:00",
    purpose: "Tourism",
    notes: "Prefers a quiet room if available.",
  });
  writeRequests(requests);
  renderAdminRequests();
});

document.addEventListener("DOMContentLoaded", () => {
  renderInventory();
  renderAdminRequests();
});
