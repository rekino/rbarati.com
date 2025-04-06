async function startInterview() {
  try{
    const response = await axios.get('/chat/history');

    response.data.conversation.forEach(dialog => addMessage(dialog.role, dialog.text));
    replaceActions(response.data.actions);
  } catch (error) {
    console.error("Error fetching chat history:", error);
  }
}

async function sendMessage(message) {
  try{
    addMessage("user", message);

    const response = await axios.post("/chat/history", { message: message });

    addMessage("agent", response.data.message);
    replaceActions(response.data.actions);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    removeLastMessage();
  }
}

function replaceActions(actions) {
  chatActions.innerHTML = "";

  if (actions.length === 0) {
    chatDefaultActions.classList.remove("hidden");
    chatActions.classList.add("hidden");
    btnSend.disabled = false;
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
  messageElem.className = sender === "agent" ? "message confidant" : "message user"
  messageElem.innerHTML = text;
  chatbox.appendChild(messageElem);
}

function removeLastMessage() {
  chatbox.removeChild(chatbox.lastChild);
}

const chatActions = document.getElementById("chat-actions");
const chatDefaultActions = document.getElementById("chat-default-actions");
const btnStart = document.getElementById("start-btn");
const btnSend = document.getElementById("send-btn");
const txtMessage = document.getElementById("chat-input");
const chatbox = document.getElementById("chat-box");

btnStart.addEventListener("click", startInterview);
btnSend.addEventListener("click", () => {
  sendMessage(txtMessage.value);
  txtMessage.value = "";
})
txtMessage.addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    btnSend.click();
  }
});