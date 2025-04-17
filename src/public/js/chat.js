async function startInterview() {
  try{
    const response = await axios.get('/chat/history');

    response.data.conversation.forEach(dialog => addMessage(dialog.role, dialog.content));
    replaceActions(response.data.actions);
  } catch (error) {
    console.error("Error fetching chat history:", error);
  }
}

async function sendMessage(message) {
  try{
    addMessage("user", message);

    const response = await axios.post("/chat/history", { message: message });

    addMessage("assistant", response.data.message);
    replaceActions(response.data.actions);
  } catch (error) {
    console.error("Error sending message:", error);
    removeLastMessage();
  }
}

async function resetHistory() {
  try{
    const response = await axios.delete("/chat/history");
    clearMessages();
    await startInterview();
  } catch (error) {
    console.error("Error reseting history:", error);
  }
}

function replaceActions(actions) {
  chatActions.innerHTML = "";

  if (actions.length === 0) {
    chatDefaultActions.classList.remove("hidden");
    chatActions.classList.add("hidden");
    btnSend.disabled = false;
  } else {
    chatDefaultActions.classList.add("hidden");
    chatActions.classList.remove("hidden");
    btnSend.disabled = true;
  }

  let btnAction;
  actions.forEach(action => {
    btnAction = document.createElement("button");
    btnAction.className = action.class;
    btnAction.innerHTML = action.action;
    btnAction.addEventListener("click", () => sendMessage(action.action))
    chatActions.appendChild(btnAction)
  });
}

function addMessage(sender, text) {
  const messageElem = document.createElement("div");
  messageElem.className = sender === "assistant" ? "message confidant" : "message user"
  messageElem.innerHTML = text;
  chatbox.appendChild(messageElem);
  messageElem.scrollIntoView();
}

function removeLastMessage() {
  chatbox.removeChild(chatbox.lastChild);
}

function clearMessages() {
  chatbox.innerHTML = "";
}

const chatActions = document.getElementById("chat-actions");
const chatDefaultActions = document.getElementById("chat-default-actions");
const btnStart = document.getElementById("start-btn");
const btnSend = document.getElementById("send-btn");
const btnReset = document.getElementById("reset-btn");
const txtMessage = document.getElementById("chat-input");
const chatbox = document.getElementById("chat-box");

btnStart.addEventListener("click", startInterview);
btnSend.addEventListener("click", () => {
  sendMessage(txtMessage.value);
  txtMessage.value = "";
})
btnReset.addEventListener("click", () => {
  resetHistory();
  txtMessage.value = "";
})
txtMessage.addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    btnSend.click();
  }
});