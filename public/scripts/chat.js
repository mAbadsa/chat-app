//Elements
const $sendMessageForm = document.querySelector("#send-message");
const $sendMessageFormBtn = $sendMessageForm.querySelector("button");
const $sendMessageFormInput = $sendMessageForm.querySelector("input");
const $sendLocationBtn = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");
const $LocationMsg = document.querySelector("#messages");
const $sidebar = document.querySelector('#sidebar');

//templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const messageTemplateLocation = document.querySelector("#message-template-location").innerHTML;
const messageTemplateUsers = document.querySelector("#sidebar-template").innerHTML;

//Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});

const autoscroll = () => {
  // New message elements
  const $newMessage = $messages.lastElementChild;

  // Height of new message
  const newMessageStyle = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyle.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // Visible height
  const visibleHeight = $messages.offsetHeight;

  // Height of message container
  const containerHeight = $messages.scrollHeight;

  const scrollOffset = $messages.scrollTop + visibleHeight;

  if(containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }

  console.log("containerHeight", containerHeight);
  console.log("$messages.scrollTop", $messages.scrollTop);
  console.log("scrollOffset",scrollOffset);
  console.log("visibleHeight", visibleHeight);
  console.log("containerHeight - newMessageHeight", containerHeight - newMessageHeight);

}

const socket = io();

socket.on("message", message => {
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createAt: moment(message.createAt).format("h:mm a")
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

$sendMessageForm.addEventListener("submit", e => {
  e.preventDefault();

  $sendMessageFormBtn.setAttribute("disabled", "disabled");

  const messageInput = e.target.elements.messageText.value;
  socket.emit("sendMessage", messageInput, error => {
    $sendMessageFormBtn.removeAttribute("disabled");
    $sendMessageFormInput.value = "";
    $sendMessageFormInput.focus();
    if (error) {
      return console.log(error);
    }
    console.log("Message delevired!");
  });
});

socket.on("sendLocation", data => {
  console.log(data);
  const html = Mustache.render(messageTemplateLocation, {
    username: data.username,
    url: data.url,
    createAt: moment(data.createAt).format("ddd, MMM, h:mm a")
  });
  $LocationMsg.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(messageTemplateUsers, {
    room,
    users
  })
  $sidebar.innerHTML = html;
  // console.log(room);
  // console.log(users);
})

$sendLocationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return "Your browser are not support geolocation";
  }

  $sendLocationBtn.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition(position => {
    console.log(position);
    socket.emit(
      "sendPosition",
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      },
      locationMsg => {
        $sendLocationBtn.removeAttribute("disabled");
        console.log("Location shared!", locationMsg);
      }
    );
  });
});

socket.emit("join", { username, room }, error => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
