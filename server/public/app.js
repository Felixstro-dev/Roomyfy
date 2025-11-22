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

let currentRoom = null;

function enterRoom(e) {
    if (!currentRoom === null) {
        return;
    } else {
        e.preventDefault();
        if (nameInput.value && chatRoom.value) {
            socket.emit('enterRoom', { name: nameInput.value, room: chatRoom.value }, ( room ) => {
                chatDisplay.innerHTML = '';

                currentRoom = room
                document.getElementById("join").disabled = true;
                setTimeout(() => {
                    document.getElementById("join").disabled = false;
                }, 4000);
            });
        }
    }

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
    activity.textContent = "";
});


socket.on("chat_image", (data) => {
    activity.textContent = "";
    const { name, image, time } = data;

    const isOwnMessage = name === nameInput.value;
    const li = document.createElement('li');
    li.classList.add('post');

    if (isOwnMessage) {
        li.classList.add('post--right');
    } else {
        li.classList.add('post--left');
    }

    const blob = new Blob([image], { type: data.type });
    const url = URL.createObjectURL(blob);


    const headerClass = isOwnMessage ? 'post__header--user' : 'post__header--reply';
    li.innerHTML = `
        <div class="post__header ${headerClass}">
            <span class="post__header--name">${name}</span>
            <span class="post__header--time">${time}</span>
        </div>
        <div class="post__text">
            <img width="300px" style="image-rendering: pixelated;" src="${url}">
        </div>
    `;

    chatDisplay.appendChild(li);
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
});



const typingUsers = new Set();

function updateActivityText() {
    if (typingUsers.size === 0) {
        activity.textContent = "";
    } else if (typingUsers.size === 1) {
        activity.textContent = `${Array.from(typingUsers)[0]} is typing...`;
    } else {
        activity.textContent = `${Array.from(typingUsers).join(", ")} are typing...`;
    }
}

socket.on("activity", (name) => {
    typingUsers.add(name);
    updateActivityText();

    setTimeout(() => {
        typingUsers.delete(name);
        updateActivityText();
    }, 1500);
});


socket.on('userList', ({ users, room }) => {
    showUsers(users, room);
    console.log('userList:', users);
})

function showUsers(users, room) {
    if (!users || users.length === 0) {
        usersList.textContent = '';
        return;
    }

    const userNames = users.map(user => user.name).join(', ');
    usersList.textContent = `Users in ${room}: ${userNames}`;
}





