import { io, buildMsg, getUserByName, getUser, commandsEnabled, ADMIN } from './index.js'

export function runCommand(cmd, room, socket) {
    const parts = cmd.trim().split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (commandsEnabled !== "true") {
        socket.emit('message', buildMsg(ADMIN, "Commands are not enabled on this Instance"));
        return;
    }
    
    if (command == '/!help') {
        const commands = [
            { cmd: '/!troll', desc: '->:]' },
            { cmd: '/!help', desc: 'View this list.' },
            { cmd: '/!catblink', desc: 'A cat :3' },
            { cmd: '/!github', desc: "Get the link to this project's github page"},
            { cmd: '/!dm <user> <message>', desc: 'Send a direct message to a user'}
        ];
        let output = 'Here is a list of all commands:<br><br>'
        commands.forEach(c => {
            output += `${c.cmd} - ${c.desc}<br>`;
        });
        output += '<br><span class="small">only you can see this</span>'
        socket.emit('message', buildMsg('COMMANDS', output))
    } else if (command == '/!troll') {
        io.to(room).emit('message', buildMsg('COMMANDS', '<button onclick="window.open(`https://www.youtube.com/watch?v=iik25wqIuFo`, `_blank`);`">Click this &gt;:]</button>'));
    } else if (command == '/!catblink') {
        io.to(room).emit('message', buildMsg('Cat', '<img height="75px" width="256px" src="https://media1.tenor.com/m/y1QFa-1vyKYAAAAC/plink-wide-cat.gif">'));
    } else if (command == '/!github') {
        socket.emit('message', buildMsg('COMMANDS', "Check out the project's github page! <a target='_blank' href='https://github.com/Felixstro-dev/Roomyfy'>github.com/Felixstro-dev/Roomyfy</a><span class='small'>only you can see this</span>"));
    } else if (command == '/!dm') {
        if (args.length < 2) {
            socket.emit('message', buildMsg('COMMANDS', 'Usage: /!dm &lt;username&gt; &lt;message&gt;<br><span class="small">only you can see this</span>'));
            return;
        }
        
        const targetUsername = args[0];
        const message = args.slice(1).join(' ');
        const sender = getUser(socket.id);
        
        if (!sender) {
            socket.emit('message', buildMsg('COMMANDS', 'You must be in a room to send DMs.<br><span class="small">only you can see this</span>'));
            return;
        }
        
        const targetUser = getUserByName(targetUsername, room);
        
        if (!targetUser) {
            socket.emit('message', buildMsg('COMMANDS', 'User "' + targetUsername + '" not found in this room.<br><span class="small">only you can see this</span>'));
            return;
        }
        
        if (targetUser.id === socket.id) {
            socket.emit('message', buildMsg('COMMANDS', 'You cannot send a DM to yourself!<br><span class="small">only you can see this</span>'));
            return;
        }
        
        io.to(targetUser.id).emit('message', buildMsg('DM from ' + sender.name, message));
        
        socket.emit('message', buildMsg('COMMANDS', 'DM sent to ' + targetUsername + ': "' + message + '"<br><span class="small">only you can see this</span>'));
    } else {
        socket.emit('message', buildMsg('COMMANDS', 'Command not found! Try /!help to see a list of commands.<span class="small">only you can see this</span>'));
    }
}