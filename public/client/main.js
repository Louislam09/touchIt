const socket = io();
const CONTAINER = document.querySelector(".container");
const TIMER__INNER = document.querySelector(".inner");
const GAME_SCREEN = document.querySelector(".game__screen");
const PLAYERS_LIST = document.querySelectorAll(".player");
const GAME_SIZE = 600;

let MY_NAME,ENEMY_NAME,ROOM_NAME;
let MY_SCORE=0,ENEMY_SCORE=0;
let LEVEL=0,COLOR_SELECTED,CHANGE_LEVEL=0;

ROOM_NAME = localStorage.ROOM_NAME;
console.log(ROOM_NAME);
socket.emit("REQUEST_INFORMATIONS",ROOM_NAME);

socket.on("GET_INFORMATIONS", ({ playerInformations, newColor, gameLevel ,selectedSquare}) => {
    console.log(playerInformations)
    let num = window.location.search.split("player=")[1];
    MY_NAME = playerInformations[num].userName;
    LEVEL = gameLevel;

    // START THE GAME
    startGame(newColor,selectedSquare);

    playerInformations.forEach((player,index) => {
        player.userName !== MY_NAME ? ENEMY_NAME = player.userName : null;
        let playerScore = PLAYERS_LIST[index].children[0];
        let playerName = PLAYERS_LIST[index].children[1];
        PLAYERS_LIST[index].id = player.userName;
        playerName.innerText = player.userName;
        playerScore.children[0].innerText = 0;
    })
})

function getNumber(number){
    return Math.floor(Math.random() * number );
}

function touchSquare({ target: {style: {backgroundColor : b}} }){
   let clickedData = {
        name: MY_NAME,
        roomName: localStorage.ROOM_NAME
    }
    if(b.split(",").length === 4){
        socket.emit("SQUARE_CLICKED",clickedData)
    }
}

function givePointTo(name){
    if(name === MY_NAME){
        MY_SCORE++;
        let me = document.getElementById(MY_NAME);
        let myScoreDiv = me.querySelector(".player__score");
        myScoreDiv.innerText = MY_SCORE;
    }else{
        ENEMY_SCORE++;
        let op = document.getElementById(ENEMY_NAME);
        let opScoreDiv = op.querySelector(".player__score");
        opScoreDiv.innerText = ENEMY_SCORE;
    }
}

const makeSquare = (level,color,selectedSquareServer) => {
    GAME_SCREEN.innerText = null;
    let number  = level * level;
    COLOR_SELECTED = color.split("1)").join(`0.8)`);

    for (let i = 0; i < number; i++) {
        const square = document.createElement("span");
        square.addEventListener("click",touchSquare);
        square.classList.add("square");
        square.style.backgroundColor = selectedSquareServer === i ? COLOR_SELECTED : color;  

        GAME_SCREEN.style.cssText = `
            grid-template-columns: repeat(${level}, 1fr);
            grid-template-rows: repeat(${level}, 1fr);
        `
        GAME_SCREEN.appendChild(square);
    }
}

async function shareCode(code){
    let cc = "?"+code;
    const shareData = {
      title: 'Memorize Game',
      text: 'Unete A Jugar Con Este Link',
      url: cc,
    }
    try {
      await navigator.share(shareData)
    } catch(err) {
      alert("No se pudo compartir")
    }
}

function startGame(color,selectedSquare){
    TIMER__INNER.style.width = "100%";
    makeSquare(LEVEL,color,selectedSquare);
    TIMER__INNER.style.background = color;
}

socket.on("clicked", ({ playerName, newColor,selectedSquare }) => {
    console.log("from server clicked: " + playerName);
    givePointTo(playerName);
    CHANGE_LEVEL++;
    if(CHANGE_LEVEL === LEVEL * 2){
        CHANGE_LEVEL = 0;
        LEVEL++;
        makeSquare(LEVEL,newColor,selectedSquare);
    }else{
        makeSquare(LEVEL,newColor,selectedSquare);
    }
})
