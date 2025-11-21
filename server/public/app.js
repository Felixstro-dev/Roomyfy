const socket = io(window.location.origin);


const msgInput = document.querySelector('#message')
const nameInput = document.querySelector('#name')
const chatRoom = document.querySelector('#room')
const activity = document.querySelector('.activity')
const usersList = document.querySelector('.user-list')
const roomList = document.querySelector('.room-list')
const chatDisplay = document.querySelector('.chat-display')

function sendMessage(e) {
    e.preventDefault()
    if (nameInput.value && msgInput.value && chatRoom.value) {
        socket.emit('message', {
            name: nameInput.value,
            text: msgInput.value
        })
        msgInput.value = ""
    }
    msgInput.focus()
}

function enterRoom(e) {
    e.preventDefault()
    if (nameInput.value && chatRoom.value) {
        socket.emit('enterRoom', {
            name: nameInput.value,
            room: chatRoom.value
        })
    }
    const li = document.createElement('li');
    li.classList.add('post__connect');
    li.innerHTML = `<div class="post__text--connect">Connected to: ${chatRoom.value}</div>`;
    chatDisplay.appendChild(li);
    document.getElementById("join").disabled = true;
    setTimeout(() => {
      document.getElementById("join").disabled = false;
    }, 4000);
}

document.querySelector('.form-msg')
    .addEventListener('submit', sendMessage)

document.querySelector('.form-join')
    .addEventListener('submit', enterRoom)

msgInput.addEventListener('keypress', () => {
    socket.emit('activity', nameInput.value)
})

// Listen for messages 
socket.on("message", (data) => {
    activity.textContent = ""; // clear typing indicator
    const { name, text, time } = data;

    const li = document.createElement('li');
    li.classList.add('post');

    const isAdminMessage = name === 'system-messages-normal-user-unclaimable'; // assumes ADMIN is defined in your client JS
    const isOwnMessage = name === nameInput.value;

    // Determine post alignment
    if (isOwnMessage) {
        li.classList.add('post--right');
    } else if (!isAdminMessage) {
        li.classList.add('post--left');
    }

    // Build inner HTML
    if (!isAdminMessage) {
        const headerClass = isOwnMessage ? 'post__header--user' : 'post__header--reply';
        li.innerHTML = `
            <div class="post__header ${headerClass}">
                <span class="post__header--name">${name}</span>
                <span class="post__header--time">${time}</span>
            </div>
            <div class="post__text">${text}</div>
        `;
    } else {
        li.classList.add('post__system')
        li.innerHTML = `<div class="post__text--system">${text}</div>`;
    }

    chatDisplay.appendChild(li);
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
});


let activityTimer
socket.on("activity", (name) => {
    activity.textContent = `${name} is typing...`
    clearTimeout(activityTimer)
    activityTimer = setTimeout(() => {
        activity.textContent = ""
    }, 3000)
})

socket.on('userList', ({ users }) => {
    showUsers(users)
})

function showUsers(users) {
    usersList.textContent = ''
    if (users) {
        usersList.innerHTML = `<em>Users in ${chatRoom.value}:</em>`
        users.forEach((user, i) => {
            usersList.textContent += ` ${user.name}`
            if (users.length > 1 && i !== users.length - 1) {
                usersList.textContent += ","
            }
        })
    }
}
