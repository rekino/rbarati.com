document.addEventListener("DOMContentLoaded", async () => {
  const sessionType = document.getElementById("session-type");
  const dateInput = document.getElementById("date");
  const timeSelect = document.getElementById("time");
  const bookBtn = document.getElementById("book-btn");

  sessionType.addEventListener("change", async () => {
    if (sessionType.value) {
      dateInput.disabled = false;
      const closestDate = await getClosestAvailableDate(sessionType.value);
      if (closestDate) {
        dateInput.value = closestDate;
        await loadAvailableSlots(closestDate, sessionType.value);
      }
    } else {
      dateInput.value = "";
      timeSelect.innerHTML = `<option value="">-- Select a Time Slot --</option>`;
      dateInput.disabled = true;
      timeSelect.disabled = true;
      bookBtn.disabled = true;
    }
  });

  dateInput.addEventListener("change", async () => {
    if (dateInput.value && sessionType.value) {
      await loadAvailableSlots(dateInput.value, sessionType.value);
    }
  });

  timeSelect.addEventListener("change", () => {
    bookBtn.disabled = !timeSelect.value;
  });

  // bookBtn.addEventListener("click", async () => {
  //   const selectedDate = dateInput.value;
  //   const selectedTime = timeSelect.value;
  //   const selectedSession = sessionType.value;

  //   if (!selectedDate || !selectedTime || !selectedSession) {
  //     alert("Please select a valid date and time.");
  //     return;
  //   }

  //   try {
  //     const response = await axios.post("/api/book", {
  //       date: selectedDate,
  //       time: selectedTime,
  //       sessionType: selectedSession,
  //     });

  //     alert("Booking confirmed! Check your email for details.");
  //     window.location.reload();
  //   } catch (error) {
  //     console.error(error);
  //     alert("Failed to book the session. Try again later.");
  //   }
  // });

  /**
   * Fetch the closest available date from the server.
   * @param {string} sessionType - The session type in minutes (15, 30, 60).
   * @returns {Promise<string>} - Closest available date in YYYY-MM-DD format.
   */
  async function getClosestAvailableDate(sessionType) {
    try {
      const response = await axios.get(`/booking/availability?type=${sessionType}`);
      return response.data.closestDate; // Expected to return 'YYYY-MM-DD'
    } catch (error) {
      console.error("Error fetching closest available date:", error);
      return null;
    }
  }

  /**
   * Fetch available slots for a given date and session type.
   * @param {string} date - The selected date in YYYY-MM-DD format.
   * @param {string} sessionType - The session duration in minutes.
   */
  async function loadAvailableSlots(date, sessionType) {
    try {
      const response = await axios.get(`/booking/availability?date=${date}&type=${sessionType}`);
      const slots = response.data.slots;

      timeSelect.innerHTML = `<option value="">-- Select a Time Slot --</option>`;
      if (slots.length === 0) {
        timeSelect.innerHTML = `<option value="">No available slots</option>`;
        timeSelect.disabled = true;
        bookBtn.disabled = true;
        return;
      }

      slots.forEach((slot) => {
        const option = document.createElement("option");
        option.value = slot;
        option.textContent = slot;
        timeSelect.appendChild(option);
      });

      timeSelect.disabled = false;
    } catch (error) {
      console.error("Error fetching available time slots:", error);
    }
  }
});
