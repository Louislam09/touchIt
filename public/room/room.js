
const startGameButton = document.querySelector(".start-game__button");
const shareLinkButton = document.querySelector(".share-link__button");
const closeRoomButton = document.querySelector(".close-room__button");
const ROOM_DIV = document.querySelector(".room_code");
const codeValueDiv = document.querySelector(".code__value");
const playersList = document.querySelectorAll(".player");

let ROOM_NAME = "default";
let MY_NAME;
let PLAYERS_INFORMATIONS;

const socket = io();

async function shareCode(code){
  let cc = "?"+code;
  const shareData = {
    title: 'TouchIt Game',
    text: 'Unete A Jugar Con Este Link',
    url: cc,
  };

  try {
    await navigator.share(shareData)
  } catch(err) {
    alert("No se pudo compartir")
  }
}

function disabledButton(button){
  button.setAttribute("disabled",true);
  button.classList.add("disabled")
}

function ShowMonkeyImg(){
  const imgDiv = document.createElement("img");
  imgDiv.width = 150;
  imgDiv.src = "../client/images/monkey2.gif";
  ROOM_DIV.innerHTML = `<h1>Esperando...</h1>`;
  ROOM_DIV.appendChild(imgDiv);
}

shareLinkButton.addEventListener('click',  () => shareCode(ROOM_NAME))

GET_INFO()
async function GET_INFO(){
  if(window.location.search.indexOf("name") !== 1){
    ShowMonkeyImg();
    disabledButton(startGameButton);
    disabledButton(shareLinkButton);
    codeValueDiv.innerText = "🚫";
  
    let code = window.location.search.split("?")[1];
  
    if(window.location.search.split("?").length !== 3){
      const { value } = await Swal.fire({
        title: 'Escribe Tu Nombre',
        input: 'text',
        inputLabel: 'NOMBRE',
        showDenyButton: true,
        denyButtonText: `Cancel`,
        inputValidator: (value) => {
          if (!value) {
            return 'Necesitas Un Apodo!'
          }
        }
      }) || {value: "PLAYER2"};

      MY_NAME = value ? value : "PLAYER2";
    }else{
      MY_NAME = window.location.search.split("?")[2].split("%20").join(" ");
    }
    
    ROOM_NAME = code;
    socket.emit('get-code', {hasCode: true, code: code});
  
    socket.emit('user-name', {
      name: MY_NAME,
      roomName: code
    });
    
  }else{
    MY_NAME = window.location.search.split("name=")[1];
    socket.emit('get-code', {hasCode: false, code: ""});
  }
  
}

socket.on('code', ({ code }) => {
  ROOM_NAME = code;
  codeValueDiv.innerText = code;
  socket.emit('user-name', {
    name: MY_NAME,
    roomName: ROOM_NAME
  });
});

socket.on('players-info', playerInformations => {
  socket.emit("myID",{ID: socket.id});
  PLAYERS_INFORMATIONS = playerInformations;
  localStorage.PLAYERS_INFORMATIONS = JSON.stringify(PLAYERS_INFORMATIONS);
  playerInformations.forEach((player,index) => {
    playersList[index].classList.remove("none");
    let firstLetter = playersList[index].children[0];
    let name = playersList[index].children[1];
    name.innerText = player.userName;
    firstLetter.children[0].innerText = player.userName[0].toUpperCase();
  })
});

socket.on("START_GAME", (data) => {
  localStorage.ROOM_NAME = ROOM_NAME;
  localStorage.GAME_INFO = JSON.stringify(data);

  if(startGameButton.hasAttribute("disabled")){
    window.location.href = `/client?player=1`;
  }else{
    window.location.href = "/client?player=0";
  }
})

startGameButton.addEventListener("click",() => {
  PLAYERS_INFORMATIONS.forEach(a => {
    a.userName == MY_NAME ? a.num = "admin" : null;
  });

  socket.emit("START_GAME", {
    roomName: ROOM_NAME,
    informations: PLAYERS_INFORMATIONS
  });
})


closeRoomButton.addEventListener("click",()=> window.location.href= "/")