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

socket.on("message", (data) => {
    activity.textContent = "";
    const { name, text, time } = data;

    const li = document.createElement('li');
    li.classList.add('post');

    const isAdminMessage = name === 'system-messages-normal-user-unclaimable';
    const isOwnMessage = name === nameInput.value;

    if (isOwnMessage) {
        li.classList.add('post--right');
    } else if (!isAdminMessage) {
        li.classList.add('post--left');
    }

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

const typingUsers = new Set();

socket.on("activity", (name) => {
    typingUsers.add(name);

    if (typingUsers.size === 0) {
        activity.textContent = "";
    } else if (typingUsers.size === 1) {
        activity.textContent = `${name} is typing...`
    } else {
        activity.textContent = `${typingUsers.join(", ")} are typing...`;
    }

    setTimeout(() => {
        if (typingUsers.size === 0) {
            activity.textContent = "";
        } else if (typingUsers.size === 1) {
            activity.textContent = `${name} is typing...`
        } else {
            activity.textContent = `${Array.from(typingUsers).join(", ")} are typing...`;
        }
    }, 1500)
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
