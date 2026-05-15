const STORAGE_KEY = "guesthouseRequests";
const TOTAL_ROOMS = 7;

const readRequests = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
const writeRequests = (requests) => localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));

const formatDate = (dateString) =>
  new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(`${dateString}T00:00:00`));

const statusClass = (status) => `status-${status.toLowerCase()}`;

const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, (character) =>
    ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#039;",
    })[character],
  );

const requestDatesOverlap = (first, second) =>
  first.checkIn < second.checkOut && first.checkOut > second.checkIn;

const getApprovedRoomBookings = (requests = readRequests()) =>
  requests
    .filter((request) => request.status === "Approved")
    .flatMap((request) =>
      request.allottedRooms.map((room) => ({
        room,
        checkIn: request.checkIn,
        checkOut: request.checkOut,
        guestName: request.guestName,
        requestId: request.id,
      })),
    );

const getAvailableRooms = (targetRequest, requests = readRequests()) => {
  const occupiedRooms = new Set(
    getApprovedRoomBookings(requests)
      .filter((booking) => booking.requestId !== targetRequest.id)
      .filter((booking) => requestDatesOverlap(targetRequest, booking))
      .map((booking) => booking.room),
  );

  return Array.from({ length: TOTAL_ROOMS }, (_, index) => index + 1).filter(
    (room) => !occupiedRooms.has(room),
  );
};

const renderRequestSummary = (request) => {
  const roomsText = request.allottedRooms?.length
    ? `Rooms allotted: ${request.allottedRooms.join(", ")}`
    : `Rooms requested: ${request.roomsRequired}`;

  return `
    <article class="request-card">
      <span class="badge ${statusClass(request.status)}">${request.status}</span>
      <h3>${escapeHtml(request.guestName)}</h3>
      <div class="request-meta">
        <span>${formatDate(request.checkIn)} → ${formatDate(request.checkOut)}</span>
        <span>${roomsText}</span>
        <span>${request.adults} adult(s), ${request.children} child(ren)</span>
        <span>${request.purpose}</span>
      </div>
      ${request.notes ? `<p>${escapeHtml(request.notes)}</p>` : ""}
      ${request.adminNote ? `<p><strong>Admin note:</strong> ${escapeHtml(request.adminNote)}</p>` : ""}
    </article>
  `;
};

const renderGuestRequests = () => {
  const container = document.querySelector("#guestRequests");
  if (!container) return;

  const requests = readRequests().slice().reverse();
  container.innerHTML = requests.length
    ? requests.map(renderRequestSummary).join("")
    : '<p class="muted">No room requests submitted yet.</p>';
};

const setMinimumDates = () => {
  const checkIn = document.querySelector("#checkIn");
  const checkOut = document.querySelector("#checkOut");
  if (!checkIn || !checkOut) return;

  const today = new Date().toISOString().slice(0, 10);
  checkIn.min = today;
  checkOut.min = today;

  checkIn.addEventListener("change", () => {
    checkOut.min = checkIn.value;
    if (checkOut.value && checkOut.value <= checkIn.value) {
      checkOut.value = "";
    }
  });
};

const collectFormData = (form) => {
  const formData = new FormData(form);
  return Object.fromEntries(formData.entries());
};

const handleRequestForm = () => {
  const form = document.querySelector("#requestForm");
  const message = document.querySelector("#formMessage");
  if (!form || !message) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = collectFormData(form);

    if (!form.checkValidity()) {
      message.textContent = "Please complete all required details before submitting.";
      message.className = "form-message error";
      form.reportValidity();
      return;
    }

    if (data.checkOut <= data.checkIn) {
      message.textContent = "Check-out date must be after the check-in date.";
      message.className = "form-message error";
      return;
    }

    const request = {
      id: crypto.randomUUID(),
      submittedAt: new Date().toISOString(),
      status: "Pending",
      allottedRooms: [],
      adminNote: "",
      guestName: data.guestName.trim(),
      phone: data.phone.trim(),
      email: data.email.trim(),
      reference: data.reference.trim(),
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      roomsRequired: Number(data.roomsRequired),
      adults: Number(data.adults),
      children: Number(data.children),
      arrivalTime: data.arrivalTime,
      purpose: data.purpose,
      notes: data.notes.trim(),
    };

    const requests = readRequests();
    requests.push(request);
    writeRequests(requests);
    form.reset();
    setMinimumDates();
    renderGuestRequests();
    message.textContent = "Request submitted. An admin will review and allot rooms soon.";
    message.className = "form-message success";
  });
};

document.addEventListener("DOMContentLoaded", () => {
  setMinimumDates();
  handleRequestForm();
  renderGuestRequests();
});
