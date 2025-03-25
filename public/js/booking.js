document.addEventListener("DOMContentLoaded", () => {
    const sessionType = document.getElementById("session-type");
    const dateInput = document.getElementById("date");
    const timeSelect = document.getElementById("time");
    const bookBtn = document.getElementById("book-btn");
  
    sessionType.addEventListener("change", () => {
      if (sessionType.value) {
        dateInput.removeAttribute("disabled");
      } else {
        dateInput.setAttribute("disabled", true);
        timeSelect.setAttribute("disabled", true);
        bookBtn.setAttribute("disabled", true);
      }
    });
  
    dateInput.addEventListener("change", async () => {
      if (!dateInput.value) return;
  
      const duration = sessionType.value; // 15, 30, or 60 minutes
      try {
        const response = await axios.get(`/api/v1/availability?date=${dateInput.value}&duration=${duration}`);
        timeSelect.innerHTML = '<option value="">-- Select a Time Slot --</option>';
  
        response.data.slots.forEach(slot => {
          const option = document.createElement("option");
          option.value = slot;
          option.textContent = slot;
          timeSelect.appendChild(option);
        });
  
        timeSelect.removeAttribute("disabled");
      } catch (error) {
        console.error("Error fetching availability:", error);
      }
    });
  
    timeSelect.addEventListener("change", () => {
      bookBtn.disabled = !timeSelect.value;
    });
  
    bookBtn.addEventListener("click", async () => {
      const date = dateInput.value;
      const time = timeSelect.value;
      const duration = sessionType.value;
  
      try {
        const response = await axios.post("/api/v1/book", { date, time, duration });
        alert("Booking confirmed! Check your email.");
      } catch (error) {
        console.error("Booking error:", error);
        alert("Booking failed. Please try again.");
      }
    });
  });
  