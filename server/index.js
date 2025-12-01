import express from 'express'
import { Server } from "socket.io"
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT || 3500
const ADMIN = "system-messages-normal-user-unclaimable"

const app = express()

app.use(express.static(path.join(__dirname, "public")))

const expressServer = app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`)
})

// state 
const UsersState = {
    users: [],
    setUsers: function (newUsersArray) {
        this.users = newUsersArray
    }
}

const io = new Server(expressServer, {
    cors: {
        origin: process.env.NODE_ENV === "production" ? false : ["http://localhost:5500", "http://127.0.0.1:5500"]
    }
})

io.on('connection', socket => {
    console.log(`User ${socket.id} connected`);

    // Upon connection - only to user 
    socket.emit('message', buildMsg(ADMIN, "Connected to websocket successfully!"));
    socket.emit('message', buildMsg('INFO', "Enter a username and chatroom to chat with other people."));

    socket.on('enterRoom', ({ name, room }) => {
        
        const prohibitedNames = [
            'SYSTEM', 
            'ADMIN', 
            'MODERATOR', 
            'SERVER', 
            'OWNER', 
            'DEV', 
            'DEVELOPER', 
            'BOT',  
            'MANAGER', 
            'TEAM', 
            'STAFF', 
            'ADMINISTRATOR', 
            'SERVERBOT', 
            'INFO',
            ' '
        ];
        const allowedCharacters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '_', '-']; 
        const cleanName = name.trim().toUpperCase();
        if (prohibitedNames.some(word => cleanName.includes(word))) {
            socket.emit('message', buildMsg(ADMIN, `The name "${name}" is reserved or blacklisted. \n Please choose another name.`));
            return;
        }
        if (![...cleanName].every(char => allowedCharacters.includes(char))) {
            socket.emit('message', buildMsg(ADMIN, `The name "${name}" contains invalid characters`))
            return;
        }

        // leave previous room 
        const prevRoom = getUser(socket.id)?.room;

        if (prevRoom) {
            socket.leave(prevRoom);
            io.to(prevRoom).emit('message', buildMsg(ADMIN, `${name} has left the room`));
        }

        const user = activateUser(socket.id, name, room);

        // Cannot update previous room users list until after the state update in activate user 
        if (prevRoom) {
            io.to(prevRoom).emit('userList', {
                users: getUsersInRoom(prevRoom)
            });
        }

        // join room 
        socket.join(user.room);

        // To user who joined 
        socket.emit('message', buildMsg(ADMIN, `You have joined the ${user.room} chat room`));

        // To everyone else 
        socket.broadcast.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} has joined the room`));

        // Update user list for room 
        io.to(user.room).emit('userList', {
            users: getUsersInRoom(user.room),
            room: user.room
        });
    });

    // When user disconnects - to all others 
    socket.on('disconnect', () => {
        const user = getUser(socket.id);
        userLeavesApp(socket.id);
        buildMsg(ADMIN, `You have disconnected from the room`)

        if (user) {
            io.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} has left the room`));

            io.to(user.room).emit('userList', {
                users: getUsersInRoom(user.room),
                room: user.room
            });
        }

        console.log(`User ${socket.id} disconnected`);
    });

    // Listening for a message event 
    socket.on('message', ({ name, text }) => {
        const room = getUser(socket.id)?.room;
        if (room) {
            io.to(room).emit('message', buildMsg(name, text));
            console.log('A message has been sent!');
        }
        
    });

    socket.on("chat_image", ({ name, type, image }) => {
        const room = getUser(socket.id)?.room;
        if (!room) return;

        const time = new Intl.DateTimeFormat("default", {
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
        }).format(new Date());

        io.to(room).emit("chat_image", {
            name,
            type,
            image,
            time,
        });
        console.log('An image has been sent!');
    });


    // Listen for activity 
    socket.on('activity', (name) => {
        const room = getUser(socket.id)?.room;
        if (room) {
            socket.broadcast.to(room).emit('activity', name);
        }
    });
});


function buildMsg(name, text) {
    return {
        name,
        text,
        time: new Intl.DateTimeFormat('default', {
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric'
        }).format(new Date())
    }
}

// User functions 
function activateUser(id, name, room) {
    const user = { id, name, room }
    UsersState.setUsers([
        ...UsersState.users.filter(user => user.id !== id),
        user
    ])
    return user
}

function userLeavesApp(id) {
    UsersState.setUsers(
        UsersState.users.filter(user => user.id !== id)
    )
}

function getUser(id) {
    return UsersState.users.find(user => user.id === id)
}

function getUsersInRoom(room) {
    return UsersState.users.filter(user => user.room === room)
}

/* function getAllActiveRooms() {
    return Array.from(new Set(UsersState.users.map(user => user.room)))
} */
