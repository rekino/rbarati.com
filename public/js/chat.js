const socket = io();

function sendMessage() {
    const input = document.getElementById("message");
    const message = input.value.trim();
    
    if (message) {
        addMessage("You", message);
        socket.emit("message", message);
        input.value = "";
    }
}

socket.on("response", (msg) => {
    addMessage("AI", msg);
});

function addMessage(sender, text) {
    const chatbox = document.getElementById("chatbox");
    const messageElem = document.createElement("p");
    messageElem.innerHTML = `<strong>${sender}:</strong> ${text}`;
    chatbox.appendChild(messageElem);
}

const btnSend = document.getElementById("btnSend");
btnSend.addEventListener("click", sendMessage);