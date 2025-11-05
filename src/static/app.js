document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function  to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

  // Clear loading message and reset activity select
  activitiesList.innerHTML = "";
  activitySelect.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants section manually so we can attach delete handlers
        const participantsContainer = document.createElement("div");
        participantsContainer.className = "participants";

        const participantsHeader = document.createElement("h5");
        participantsHeader.textContent = "Participants";
        participantsContainer.appendChild(participantsHeader);

        if (details.participants && details.participants.length) {
          const ul = document.createElement("ul");
          ul.className = "participants-list";

          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            const span = document.createElement("span");
            span.className = "participant-email";
            span.textContent = p;

            const delBtn = document.createElement("button");
            delBtn.className = "delete-btn";
            delBtn.type = "button";
            delBtn.setAttribute("aria-label", `Remove ${p}`);
            delBtn.innerHTML = "&#128465;"; // trash can emoji

            // Click handler opens an inline confirmation prompt below the activity
            delBtn.addEventListener("click", () => {
              // Remove any existing prompts for this card
              const existing = activityCard.querySelector('.confirm-prompt');
              if (existing) existing.remove();

              const prompt = document.createElement('div');
              prompt.className = 'confirm-prompt';
              prompt.innerHTML = `
                <p>Remove <strong>${p}</strong> from <strong>${name}</strong>?</p>
                <div class="prompt-actions">
                  <button class="confirm-yes">Yes, remove</button>
                  <button class="confirm-cancel">Cancel</button>
                </div>
              `;

              // Confirm handler
              prompt.querySelector('.confirm-yes').addEventListener('click', async () => {
                try {
                  const res = await fetch(`/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(p)}`, { method: 'DELETE' });
                  const data = await res.json();
                  if (res.ok) {
                    messageDiv.textContent = data.message;
                    messageDiv.className = 'success';
                    messageDiv.classList.remove('hidden');
                    // Refresh activities list
                    fetchActivities();
                  } else {
                    messageDiv.textContent = data.detail || 'Failed to remove participant';
                    messageDiv.className = 'error';
                    messageDiv.classList.remove('hidden');
                  }

                  setTimeout(() => messageDiv.classList.add('hidden'), 5000);
                } catch (err) {
                  messageDiv.textContent = 'Failed to remove participant. Please try again.';
                  messageDiv.className = 'error';
                  messageDiv.classList.remove('hidden');
                  console.error('Error removing participant:', err);
                }
              });

              // Cancel handler
              prompt.querySelector('.confirm-cancel').addEventListener('click', () => {
                prompt.remove();
              });

              // Append prompt below the activity card
              activityCard.appendChild(prompt);
            });

            li.appendChild(span);
            li.appendChild(delBtn);
            ul.appendChild(li);
          });

          participantsContainer.appendChild(ul);
        } else {
          const pNo = document.createElement('p');
          pNo.className = 'no-participants';
          pNo.textContent = 'No participants yet';
          participantsContainer.appendChild(pNo);
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        activityCard.appendChild(participantsContainer);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities to show the new participant
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
