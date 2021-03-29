const PlayButton = document.querySelector(".play__button");
const createRoomButton = document.querySelector(".create-room__button");
const codeInput = document.querySelector(".join__room");
const nameInput = document.querySelector(".user__name");

const socket = io();

PlayButton.addEventListener("click",()=>{
    if(codeInput.value.trim() === ""){
        Swal.fire({
            title: 'Necesitas Un Codigo!',
            text: '',
            icon: 'warning',
            confirmButtonText: 'Ok'
        })
    }else if( nameInput.value.trim() === ""){
        Swal.fire({
            title: 'Necesitas Un Nombre!',
            text: '',
            icon: 'warning',
            confirmButtonText: 'Ok'
        })
    }else{
        window.open(`/room?${codeInput.value}?${nameInput.value}`,"_parent");
    }
})

createRoomButton.addEventListener("click", () => {
    if( nameInput.value.trim() === ""){
        Swal.fire({
            title: 'Necesitas Un Nombre!',
            text: '',
            icon: 'warning',
            confirmButtonText: 'Ok'
        })
    }else{
        window.location.href = `/room?name=${nameInput.value}`; 
    }
})