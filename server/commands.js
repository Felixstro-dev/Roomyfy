import { io, buildMsg } from './index.js'

export function runCommand(cmd, room, socket) {
    if (cmd == '/!help') {
        socket.emit('message', buildMsg('COMMANDS', 'Here is a list of all commands:<br><br>/!troll - &gt;:]<br>/!help - View this list.<br>/!catblink - A cat :3<span class="small">only you can see this</span>'))
    } else if (cmd == '/!troll') {
        io.to(room).emit('message', buildMsg('COMMANDS', '<button onclick="window.open(`https://www.youtube.com/watch?v=iik25wqIuFo`, `_blank`);`">Click this &gt;:]</button>'));
    } else if (cmd == '/!catblink') {
        io.to(room).emit('message', buildMsg('Cat', '<img height="75px" width="256px" src="https://media1.tenor.com/m/y1QFa-1vyKYAAAAC/plink-wide-cat.gif">'));
    } else if (cmd == '/!github') {
        socket.emit('message', buildMsg('COMMANDS', "Check out the project's github page! <a target='_blank' href='https://github.com/Felixstro-dev/Roomyfy'>github.com/Felixstro-dev/Roomyfy</a><span class='small'>only you can see this</span>"));
    } else {
        socket.emit('message', buildMsg('COMMANDS', 'Command not found! Try /!help to see a list of commands.<span class="small">only you can see this</span>'));
    }
}