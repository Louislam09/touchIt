
const express = require('express');
const path = require('path');
const app = express();
const server = require('http').Server(app);
const PORT = process.env.PORT || 3000;
const { v4: uuidv4 } = require('uuid');

app.use(express.static(path.join(__dirname,'public' )));

// app.get('/room', (req,res) => {
//     res.sendFile("/room")
// })

// Start My Server
server.listen(PORT, () => console.log(`Server running in port ${PORT}`));

const socket = require('socket.io');

const io = socket(server);

io.on('connection', onConnect);


let room1 = {};
const connections = {};
let playAgainConfirmations = {};


function getNumber(number){
    return Math.floor(Math.random() * number );
}

function getColor(){
    let r = getNumber(255); 
    let g = getNumber(255); 
    let b = getNumber(255); 
    return `rgba(${r}, ${g}, ${b},1)`; 
}

function onConnect(socket){
    let GAME_LEVEL =2;
    let INITIAL_COLOR = getColor();
    let INITIAL_SQUARE_NUMBER = getNumber(GAME_LEVEL);
    let playerIndex = -1,
    playerRoom = "default";

    socket.on('get-code', ({ hasCode, code }) => {
        if(hasCode){
            socket.join(code);
        }else{
            let uCode = uuidv4().split("-")[0];
            connections[uCode] = [null,null];
            playAgainConfirmations[uCode] = [null,null];
            room1[uCode] = [null];
            socket.emit('code', {
                code: uCode
            })
            
            socket.join(uCode);
        }
    })
    
    socket.on('user-name', ({name, roomName}) => {
        for(const i in connections[roomName]){
            if(connections[roomName][i] === null){
                playerIndex = i;
                playerRoom = roomName;
                connections[roomName][i] = name;
                break
            }
        }

        // If there is a player 3, ignore it.
        if(playerIndex === -1) return;
        
        room1[roomName][playerIndex] = { userName: name , num: playerIndex,id: socket.id};
        io.in(roomName).emit('players-info', [...room1[roomName]]);
        
    });
    

    socket.on("START_GAME", ({ roomName ,informations}) => {
        playerRoom = roomName;
        io.to(roomName).emit('START_GAME', {
            playerInformations: informations,
            roomName: roomName,
            newColor: INITIAL_COLOR,
            gameLevel: GAME_LEVEL,
            selectedSquare: INITIAL_SQUARE_NUMBER
        });
    })
    
    socket.on('SQUARE_CLICKED', ({name,room,selectFrom}) => {
        let dataToSend = {
            playerName: name,
            newColor: getColor(),
            selectedSquare: getNumber(selectFrom)
        }
        console.log(selectFrom)
        clicked(socket,dataToSend,room);
    });

}


function clicked(socket,data,room){
    console.log("from ROOM: " + room)
    io.emit("SQUARE_CLICKED",{...data,room: room});
}