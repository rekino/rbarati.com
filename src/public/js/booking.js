document.addEventListener("DOMContentLoaded", async () => {
  const sessionType = document.getElementById("session-type");
  const dateInput = document.getElementById("date");
  const timeSelect = document.getElementById("time");

  sessionType.addEventListener("change", async () => {
    if (dateInput.value && sessionType.value) {
      await loadAvailableSlots(dateInput.value, sessionType.value);
    } else {
      timeSelect.innerHTML = `<option value="">-- Select a Time Slot --</option>`;
    }
  });

  dateInput.addEventListener("change", async () => {
    if (dateInput.value && sessionType.value) {
      await loadAvailableSlots(dateInput.value, sessionType.value);
    } else {
      timeSelect.innerHTML = `<option value="">-- Select a Time Slot --</option>`;
    }
  });

  /**
   * Fetch available slots for a given date and session type.
   * @param {string} date - The selected date in YYYY-MM-DD format.
   * @param {string} sessionType - The session duration in minutes.
   */
  async function loadAvailableSlots(date, sessionType) {
    try {
      const response = await axios.get(
        `/booking/availability?date=${date}&type=${sessionType}`,
      );
      const slots = response.data.slots;

      if (slots.length === 0) {
        timeSelect.innerHTML = `<option value="">No available slots</option>`;
        return;
      }

      timeSelect.innerHTML = `<option value="">-- Select a Time Slot --</option>`;
      slots.forEach((slot) => {
        date = new Date(slot);
        const option = document.createElement("option");
        option.value = slot;
        option.textContent = date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        timeSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Error fetching available time slots:", error);
    }
  }
});
