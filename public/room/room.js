
const startGameButton = document.querySelector(".start-game__button");
const shareLinkButton = document.querySelector(".share-link__button");
const closeRoomButton = document.querySelector(".close-room__button");
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

shareLinkButton.addEventListener('click',  () => shareCode(ROOM_NAME))

if(window.location.search.indexOf("name") !== 1){
  disabledButton(startGameButton)
  let code = window.location.search.split("?")[1];
  MY_NAME = window.location.search.split("?")[2].split("%20").join(" ");
  console.log(MY_NAME,code);
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

socket.on('code', ({ code }) => {
  ROOM_NAME = code;
  socket.emit('user-name', {
    name: MY_NAME,
    roomName: ROOM_NAME
  });
});

socket.on('players-info', playerInformations => {
  socket.emit("myID",{ID: socket.id});
  console.log("playerInformations",playerInformations)
  console.log(ROOM_NAME)
  PLAYERS_INFORMATIONS = playerInformations;
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