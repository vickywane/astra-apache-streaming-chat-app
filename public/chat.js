const sendButton = document.getElementById("send-message-btn");
const sendInput = document.getElementById("message-input");
const messagesList = document.getElementById("messages-element-list");

const username = window.location.href.split("username=")[1];

window.addEventListener("load", async (event) => {
  try {
    const ws = new WebSocket("ws://localhost:5050/stream");
    ws.onopen = () => console.log("-> CHAT CONNECTED");

    ws.onmessage = (event) => {
      const incoming = JSON.parse(event.data);

      messagesList.innerHTML += `
        <li class="my-8" >
          <div class="
          ${
            username === incoming.properties.username
              ? "bg-blue-700"
              : "bg-gray-200"
          } 
          ${
            username === incoming.properties.username
              ? "text-[white]"
              : "text-[black]"
          } rounded p-4">
            <p class="text-lg">
              ${incoming.message}
            </p>
            <br />
            <p class="text-sm italic">
             Sent at 
               <b>  ${new Date(incoming.publishTime).toLocaleString()} </b> 
             by 
               <b> ${incoming.properties.username} </b>
            </p>
          </div>
        </li>
        `;
    };
  } catch (error) {
    console.log(error);
  }
});

sendButton.addEventListener("click", async () => {
  try {
    sendButton.disabled = true;

    const req = await fetch("http://localhost:5050/stream", {
      method: "POST",
      body: JSON.stringify({
        message: sendInput.value || "",
        username,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    await req.json();
    sendInput.value = "";
  } catch (error) {
    console.log(error);
  } finally {
    sendButton.disabled = false;
  }
});
