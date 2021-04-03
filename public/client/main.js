const socket = io();
const CONTAINER = document.querySelector(".container");
const TIMER_INNER = document.querySelector(".inner");
const PLAYER_PICS = document.querySelectorAll(".player_pic");
const GAME_SCREEN = document.querySelector(".game__screen");
const PLAYERS_LIST = document.querySelectorAll(".player");
const WINNER_NAME_DIV = document.querySelector(".winner_name");
const WINNER_MESSAGE_DIV = document.querySelector(".winner_message");
const GAME_OVER_SCREEN = document.querySelector(".gameOver");
const PLAY_AGAIN_YES_BUTTON = document.querySelector(".yes__button");
const PLAY_AGAIN_NO_BUTTON = document.querySelector(".no__button");
const GAMEOVER_IMG = document.querySelector(".gameover_img");

const GAME_SIZE = 600;
const WIN_MESSAGE = "GANÓ";

const clickSound = new Audio("../sounds/clickSound.ogg");

let timeValue = 100;
let TIMER = 60;
let clearTimer;

let MY_NAME,ENEMY_NAME,ROOM_NAME;
let MY_SCORE=0,ENEMY_SCORE=0,ENEMY_ID;
let LEVEL=0,COLOR_SELECTED,CHANGE_LEVEL=0;

ROOM_NAME = localStorage.ROOM_NAME;
const GAME_INFO = JSON.parse(localStorage.GAME_INFO);

function ResetGame(){
    MY_NAME="";ENEMY_NAME="";
    MY_SCORE=0;ENEMY_SCORE=0;ENEMY_ID="";
    LEVEL=0,COLOR_SELECTED="",CHANGE_LEVEL=0;
    timeValue = 100;
    TIMER = 60;
}

function SetUpGame(data){
    const { playerInformations, newColor, gameLevel ,selectedSquare} = data;
    let num = window.location.search.split("player=")[1];
    MY_NAME = playerInformations[num].userName;
    LEVEL = gameLevel;

    playerInformations.forEach((player,index) => {
        player.userName !== MY_NAME ? ENEMY_NAME = player.userName : null;
        player.userName !== MY_NAME ? ENEMY_ID = player.id : null;
        let playerScore = PLAYERS_LIST[index].children[0];
        let playerName = PLAYERS_LIST[index].children[1];
        PLAYERS_LIST[index].id = player.userName;
        playerName.innerText = player.userName;
        playerScore.children[0].innerText = 0;
    })
    StartGame(newColor,selectedSquare);
}

function GetNumber(number){
    return Math.floor(Math.random() * number );
}

function ClickSquare({ target: {style: {backgroundColor : b}} }){
   let clickedData = {
        name: MY_NAME,
        room: localStorage.ROOM_NAME,
        selectFrom: LEVEL * LEVEL
    }

    if(b.split(",").length === 4){
        socket.emit("SQUARE_CLICKED",clickedData)
        clickSound.play()
    }
}

function GivePointTo(name){
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

const MakeSquare = (level,color,selectedSquareServer) => {
    GAME_SCREEN.innerText = null;
    let number  = level * level;
    COLOR_SELECTED = color.split("1)").join(`0.85)`);

    for (let i = 0; i < number; i++) {
        const square = document.createElement("span");
        square.addEventListener("click",ClickSquare);
        square.classList.add("square");
        square.style.backgroundColor = selectedSquareServer === i ? COLOR_SELECTED : color;  
        TIMER_INNER.style.background = color;
        PLAYER_PICS.forEach((item) => {
            item.style.background = color;
        })
        GAME_SCREEN.style.cssText = `
            grid-template-columns: repeat(${level}, 1fr);
            grid-template-rows: repeat(${level}, 1fr);
        `
        GAME_SCREEN.appendChild(square);
    }
}

async function ShareCode(code){
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

function StartGame(color,selectedSquare){
    MakeSquare(LEVEL,color,selectedSquare);
    TIMER_INNER.style.background = color;
    PLAYER_PICS.forEach((item) => {
        item.style.background = color;
    })
    TimeLoad()
}

function TimeLoad() {
    TIMER_INNER.style.width = "100%";
	clearTimer = setInterval(() => {
        if (timeValue === 0) {
            clearInterval(clearTimer);
        }
		timeValue -= 1;

		if (timeValue < 30) TIMER_INNER.style.backgroundColor = 'red';

		TIMER_INNER.style.width = `${timeValue}%`;

		if (timeValue === 0) {
            GameOver();
		}
	}, TIMER);

	
}

function RejectedPlayAgain(){
    socket.emit("PLAY_AGAIN_REJECTED",{
        userName: MY_NAME,
        roomName: localStorage.ROOM_NAME
    });
    window.location.href ="/";
}

function ConfirmedPlayAgain(){
    socket.emit("PLAY_AGAIN_REQUEST",{
        userName: MY_NAME,
        roomName: localStorage.ROOM_NAME,
        gameInfo: JSON.parse(localStorage.PLAYERS_INFORMATIONS)
    });
}

function SetWinner(){
    if(MY_SCORE === ENEMY_SCORE){
        WINNER_NAME_DIV.innerText = "DRAW";
        WINNER_MESSAGE_DIV.innerText = null;
        GAMEOVER_IMG.src = "./images/monkey3.gif";
    }else if(MY_SCORE > ENEMY_SCORE){
        WINNER_NAME_DIV.innerText = MY_NAME;
        WINNER_MESSAGE_DIV.innerText = WIN_MESSAGE;
        GAMEOVER_IMG.src = "./images/monkey.gif";
    }else{
        WINNER_NAME_DIV.innerText = ENEMY_NAME;
        WINNER_MESSAGE_DIV.innerText = WIN_MESSAGE;
        GAMEOVER_IMG.src = "./images/monkey_rejected2.gif";
    }
}

function GameOver(){
    GAME_SCREEN.innerText = null;
    GAME_SCREEN.classList.toggle("hide");
    GAME_OVER_SCREEN.classList.toggle("hide");
    SetWinner()
}


socket.on("SQUARE_CLICKED", ({ playerName, newColor,selectedSquare,room }) => {
    if(room === ROOM_NAME){
        GAME_SCREEN.innerText = null;
        timeValue=100;
        GivePointTo(playerName);
        CHANGE_LEVEL++;
        if(CHANGE_LEVEL === LEVEL * 2){
            TIMER = TIMER > 20 ? TIMER - 10 : TIMER;
            CHANGE_LEVEL = 0;
            LEVEL++;
            MakeSquare(LEVEL,newColor,selectedSquare);
        }else{
            MakeSquare(LEVEL,newColor,selectedSquare);
        }
    }
})

socket.on("PLAY_AGAIN_REQUEST",({userName,roomName})=>{
    if(roomName === localStorage.ROOM_NAME && MY_NAME !== userName){
        GAME_OVER_SCREEN.classList.toggle("hide");

        Swal.fire({
            customClass: {
                title: "swal__title"
            },
            title: `${userName.toUpperCase()}: Quieres Volver A Jugar ?`,
            showDenyButton: true,
            confirmButtonText: `Si`,
            denyButtonText: `No`,
            width: 800,
            padding: "3em",
            background: `
                rgba(0,0,123,0.4)
                url(./images/monkey2.gif)
                top right
                no-repeat
            `,
            backdrop: `
                rgba(0,0,123,0.4)
                url("./images/monkey5.gif")
                left top
                no-repeat
            `
            })
            .then((result) => {
                if (result.isConfirmed) {
                    ConfirmedPlayAgain();
                } else if (result.isDenied) {
                    RejectedPlayAgain();
                }
            })
    }
})

socket.on("PLAY_AGAIN_REJECTED",({userName,roomName})=>{
    if(roomName === localStorage.ROOM_NAME && MY_NAME !== userName){
        GAME_OVER_SCREEN.classList.toggle("hide");

        Swal.fire({
            customClass: {
                title: "swal__title"
            },
            title: `${userName.toUpperCase()} Rechazo La Solicitud.`,
            width: 600,
            padding: '3em',
            background: `
                rgba(0,0,123,0.4)
                url(./images/monkey_rejected2.gif)
                top right
                no-repeat
            `,
            backdrop: `
                rgba(0,0,123,0.4)
                url("./images/monkey_rejected.gif")
                left top
                no-repeat
            `,
            confirmButtonText: `Ok`
        })
        .then((result) => {
            if (result.isConfirmed) {
                window.location.href = "/";
            } 
        })
    }
})

socket.on("START_GAME", (data) => {
    const { roomName } = data;
    if(roomName === localStorage.ROOM_NAME){
        ResetGame();
        GAME_SCREEN.classList.remove("hide");
        GAME_OVER_SCREEN.classList.add("hide");
        clearInterval(clearTimer);
        SetUpGame(GAME_INFO);
    }
})

socket.on("PLAYER_DISCONNECTED", (data) => {
    Swal.fire({
        text: `${ENEMY_NAME.toUpperCase()} Abandonó El Juego!`,
        toast: true,
        position: 'top-right'
    })
})


SetUpGame(GAME_INFO);

PLAY_AGAIN_NO_BUTTON.addEventListener("click",RejectedPlayAgain);
PLAY_AGAIN_YES_BUTTON.addEventListener("click",ConfirmedPlayAgain);