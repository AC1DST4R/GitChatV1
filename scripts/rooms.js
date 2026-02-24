// scripts/rooms.js
import { db, auth } from './firebase.js';
import { collection, onSnapshot, addDoc, doc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const roomList = document.getElementById("roomList");
const createRoomBtn = document.getElementById("createRoom");
const newRoomInput = document.getElementById("newRoomName");

let currentRoomId = null;

function renderRooms(rooms) {
  roomList.innerHTML = "";
  rooms.forEach(room => {
    const li = document.createElement("li");
    li.textContent = `${room.data().name} (${room.data().ownerName})`;
    if (room.data().owner === auth.currentUser.uid) li.textContent += " 👑";
    li.onclick = () => loadRoom(room.id, room.data());
    roomList.appendChild(li);
  });
}

// Listen to rooms
onSnapshot(collection(db, "rooms"), snapshot => {
  renderRooms(snapshot.docs);
});

// Create room
createRoomBtn.onclick = async () => {
  const name = newRoomInput.value.trim();
  if (!name) return alert("Enter a room name");
  const roomRef = await addDoc(collection(db, "rooms"), {
    name,
    owner: auth.currentUser.uid,
    ownerName: "Owner",
    createdAt: serverTimestamp()
  });
  newRoomInput.value = "";
  currentRoomId = roomRef.id;
};

// Load room function (sets current room, loads messages)
function loadRoom(roomId, roomData) {
  currentRoomId = roomId;
  document.getElementById("roomTitle").textContent = roomData.name;
  // Trigger chat.js to load messages for this room
  document.dispatchEvent(new CustomEvent("roomChanged", { detail: roomData }));
}
