
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

const colors = [
    "start-6",
    "arrow-down",
    "penta",
    "start-4",
    "rhoumbus",
    "triangle",
    "heart",
    "lightning",
];

let colors1 = colors.sort(() => 0.5 - Math.random());
let colors2 = [...colors].sort(() => 0.5 - Math.random());

let room1 = [];

const connections = {};
let playAgainConfirmations = {};
let PLAYERS_INFORMATIONS;
let GAME_LEVEL =2;
let INITIAL_COLOR = getColor();
let INITIAL_SQUARE_NUMBER = getNumber(GAME_LEVEL);
let playerRoom;

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
    let playerIndex = -1,
    playerRoom = "default";
    
    socket.on('get-code', ({ hasCode, code }) => {
        if(hasCode){
            socket.join(code);
        }else{
            let uCode = uuidv4().split("-")[0];
            connections[uCode] = [null,null];
            playAgainConfirmations[uCode] = [null,null];

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
                connections[roomName][i] = i;
                break
            }
        }

        // If there is a player 3, ignore it.
        if(playerIndex === -1) return;
        
        room1[playerIndex] = { userName: name , num: playerIndex};

        io.to(roomName).emit('players-info', [...room1]);
       
    });
    
    socket.on("START_GAME", ({ roomName ,informations}) => {
        PLAYERS_INFORMATIONS = informations;
        playerRoom = roomName;
        io.to(roomName).emit('START_GAME', "THE GAME START");
    })

    socket.on("REQUEST_INFORMATIONS",(ROOM_NAME) => {
        socket.emit("GET_INFORMATIONS", {
            playerInformations: PLAYERS_INFORMATIONS,
            roomName: ROOM_NAME,
            newColor: INITIAL_COLOR,
            gameLevel: GAME_LEVEL,
            selectedSquare: INITIAL_SQUARE_NUMBER
        });
    })

    // socket.on("SQUARE_CLICKED", ({ name, room }) => {
    //     console.log(name,room)
    //     socket.to(room).emit('CLICKED', {
    //         playerName: name,
    //         newColor: getColor(),
    //         selectedSquare: getNumber(GAME_LEVEL++)
    //     });
    //     io.to(roomName).emit('CLICKED', {
    //         playerName: name,
    //         newColor: getColor(),
    //         selectedSquare: getNumber(GAME_LEVEL++)
    //     });
    // })

    // NO SE QUIERE ENVIAR LA DATA A LA SALA ACTUAL
    socket.on('SQUARE_CLICKED', (clickedData) => {
        console.log(clickedData.name,clickedData.roomName)
        let dataToSend = {
            playerName: clickedData.name,
            newColor: getColor(),
            selectedSquare: getNumber(GAME_LEVEL++)
        }
		socket.to(clickedData.roomName).broadcast.emit('clicked', dataToSend);
    });

    // socket.on('play-again-confirmation', data => {
    //     if(playerIndex === -1) return;
    //     let { alertName,roomName } = data; 
    //     for(const i in playAgainConfirmations[roomName]){
    //         if(playAgainConfirmations[roomName][i] === null){
    //             playAgainConfirmations[roomName][i] = true;
    //             break
    //         }
    //     }
        
    //     if(playAgainConfirmations[roomName].every(res => res === true)){
    //         colors1 = colors.sort(() => 0.5 - Math.random());
    //         colors2 = [...colors].sort(() => 0.5 - Math.random());
            
    //         io.to(roomName).emit('colors', {
    //             cardsName1: colors1,
    //             cardsName2: colors2
    //         });
    //         playAgainConfirmations[roomName] = [null, null];
    //     }
          
    //     if(playAgainConfirmations[roomName][0]){
    //         socket.to(roomName).broadcast.emit('acept-match', alertName);
    //     }
    // });

    // socket.on('disconnect', _ =>{
    //     if(playerIndex === -1) return;
    //         socket.to(playerRoom).broadcast.emit('oponent-disconneted', {
    //         message: 'Tu Oponente Sea Desconectado :('
    //     });

    //     if(playerIndex !== -1 ){
    //         connections[playerRoom][playerIndex] = null;
    //     }

    //     playAgainConfirmations[playerRoom][playerIndex] = null;
    // })


    
}
