
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
    let playerIndex = -1;
    playerRoom = "default";

    socket.on('get-code', GET_CODE);
    socket.on('user-name', GET_USER_NAME);
    socket.on("START_GAME", START_GAME);
    socket.on('SQUARE_CLICKED', SQUARE_CLICKED);
    socket.on("PLAY_AGAIN_REQUEST",PLAY_AGAIN_REQUEST);
    socket.on("PLAY_AGAIN_REJECTED",PLAY_AGAIN_REJECTED);
    socket.on('disconnect', PLAYER_DISCONNECTED);

    function GET_CODE({ hasCode, code }){
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
    }
    
    function GET_USER_NAME({name, roomName}){
        for(const i in connections[roomName]){
            if(connections[roomName][i] === null){
                playerIndex = i;
                playerRoom = roomName;
                connections[roomName][i] = name;
                break
            }
        }
    
        if(playerIndex === -1) return;
        
        room1[roomName][playerIndex] = { userName: name , num: playerIndex,id: socket.id};
        io.in(roomName).emit('players-info', [...room1[roomName]]);
    }
    
    function START_GAME({ roomName ,informations}){
        let GAME_LEVEL = 2;
        let INITIAL_COLOR = getColor();
        let INITIAL_SQUARE_NUMBER = getNumber(GAME_LEVEL);

        io.to(roomName).emit('START_GAME', {
            playerInformations: informations,
            roomName: roomName,
            newColor: INITIAL_COLOR,
            gameLevel: GAME_LEVEL,
            selectedSquare: INITIAL_SQUARE_NUMBER
        });
    }

    function PLAY_AGAIN({ roomName ,informations}){
        let GAME_LEVEL = 2;
        let INITIAL_COLOR = getColor();
        let INITIAL_SQUARE_NUMBER = getNumber(GAME_LEVEL);

        io.emit('START_GAME', {
            playerInformations: informations,
            roomName: roomName,
            newColor: INITIAL_COLOR,
            gameLevel: GAME_LEVEL,
            selectedSquare: INITIAL_SQUARE_NUMBER
        });
    }
    
    function SQUARE_CLICKED({name,room,selectFrom}){
        let dataToSend = {
            playerName: name,
            newColor: getColor(),
            selectedSquare: getNumber(selectFrom)
        }
        CLICK_EMITED(dataToSend,room);
    }
    
    function CLICK_EMITED(data,room){
        io.emit("SQUARE_CLICKED",{...data,room: room});
    }
    
    function PLAY_AGAIN_REQUEST({ userName, roomName,gameInfo}) {
        for(const i in playAgainConfirmations[roomName]){
            if(playAgainConfirmations[roomName][i] === null){
                playAgainConfirmations[roomName][i] = true;
                break
            }
        }
        console.log(playAgainConfirmations[roomName])
        if(playAgainConfirmations[roomName].every(res => res === true)){
            playAgainConfirmations[roomName] = [null, null];
            const data = {
                roomName: roomName,
                informations: gameInfo
            }
            PLAY_AGAIN(data)
        }
            
        if(playAgainConfirmations[roomName][0]){
            io.emit('PLAY_AGAIN_REQUEST', {userName,roomName});
        }
    }

    function PLAY_AGAIN_REJECTED({userName, roomName}){
        io.emit('PLAY_AGAIN_REJECTED', {userName,roomName});
    }

    function PLAYER_DISCONNECTED(){
        if(playerIndex === -1) return;
        io.emit('PLAYER_DISCONNECTED', {
            message: 'Tu Oponente Sea Desconectado :('
        });

        if(playerIndex !== -1 ){
            connections[playerRoom][playerIndex] = null;
        }

        playAgainConfirmations[playerRoom][playerIndex] = null;
    }
}

