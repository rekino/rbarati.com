async function startInterview() {
  try{
    const reponse = await axios.get('/chat/history');

    reponse.data.conversation.forEach(dialog => addMessage(dialog.role, dialog.text));
    replaceActions(reponse.data.actions);
  } catch (error) {
    console.error("Error fetching chat history:", error);
  }
}

function sendMessage() {
  const input = document.getElementById("chat-input");
  const message = input.value;

  if (message) {
    addMessage("You", message);
    input.value = "";
  }
}

function replaceActions(actions) {
  const chatActions = document.getElementById("chat-actions");
  chatActions.innerHTML = actions;
}

function addMessage(sender, text) {
  const chatbox = document.getElementById("chat-box");
  const messageElem = document.createElement("div");
  messageElem.className = sender === "agent" ? "message confidant" : "message user"
  messageElem.innerHTML = text;
  chatbox.appendChild(messageElem);
}

const btnStart = document.getElementById("start-btn");
btnStart.addEventListener("click", startInterview);
