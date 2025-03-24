const socket = io();

function sendMessage() {
    const input = document.getElementById("chat-input");
    const message = input.value;
    
    if (message) {
        addMessage("You", message);
        socket.emit("message", message.trim());
        input.value = "";
    }
}

socket.on("response", (msg) => {
    addMessage("AI", msg);
});

function addMessage(sender, text) {
    const chatbox = document.getElementById("chat-box");
    const messageElem = document.createElement("p");
    messageElem.innerHTML = `<strong>${sender}:</strong> ${text}`;
    chatbox.appendChild(messageElem);
}

const btnSend = document.getElementById("send-btn");
btnSend.addEventListener("click", sendMessage);