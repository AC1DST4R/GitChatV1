// scripts/rooms.js
import { db } from "./firebase.js";
import { collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const roomList = document.getElementById("roomList");
const newRoomInput = document.getElementById("newRoomName");
const createRoomBtn = document.getElementById("createRoom");

let currentRoom = "";

// Load rooms
const roomsRef = collection(db, "rooms");
onSnapshot(roomsRef, snapshot => {
  roomList.innerHTML = "";
  snapshot.forEach(doc => {
    const li = document.createElement("li");
    li.textContent = doc.id;
    if (doc.id === currentRoom) li.classList.add("active");
    if (doc.data().owner) li.textContent += " 👑"; // Crown for owner
    li.onclick = () => selectRoom(doc.id);
    roomList.appendChild(li);
  });
});

// Create room
createRoomBtn.onclick = async () => {
  const name = newRoomInput.value.trim();
  if (!name) return;
  await addDoc(roomsRef, { name, owner: true });
  newRoomInput.value = "";
};

// Select room
export function selectRoom(name) {
  currentRoom = name;
  document.getElementById("roomTitle").textContent = `Room: ${name}`;
  onRoomSelected(name);
}

export let onRoomSelected = () => {}; // placeholder, chat.js sets it
