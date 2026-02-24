import { db, auth } from "./firebase.js";
import { collection, addDoc, onSnapshot, setDoc, doc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const roomList = document.getElementById("roomList");
const newRoomInput = document.getElementById("newRoomName");
const createRoomBtn = document.getElementById("createRoom");

const memberListDiv = document.getElementById("memberList"); // new div in index.html for members
let currentRoom = "";
let currentUserUid = "";

auth.onAuthStateChanged(user => { if(user) currentUserUid = user.uid; });

// Load rooms
const roomsRef = collection(db, "rooms");
onSnapshot(roomsRef, snapshot => {
  roomList.innerHTML = "";
  snapshot.forEach(docSnap => {
    const li = document.createElement("li");
    li.textContent = docSnap.data().ownerUid === currentUserUid ? docSnap.id + " 👑" : docSnap.id;
    li.onclick = () => selectRoom(docSnap.id, docSnap.data().ownerUid);
    roomList.appendChild(li);
  });
});

// Create room
createRoomBtn.onclick = async () => {
  const name = newRoomInput.value.trim();
  if(!name) return;
  const newRoomRef = doc(roomsRef, name);
  await setDoc(newRoomRef, { ownerUid: currentUserUid });
  newRoomInput.value = "";
};

// Select room
export function selectRoom(name, ownerUid){
  currentRoom = name;
  document.getElementById("roomTitle").textContent = name;
  addCurrentUserToMembers(name);
  loadMembers(name);
  onRoomSelected(name);
}

// Add current user to members
async function addCurrentUserToMembers(roomName){
  const memberRef = doc(db, "rooms", roomName, "members", currentUserUid);
  await setDoc(memberRef, { username: "Anon", uid: currentUserUid });
}

// Load members
function loadMembers(roomName){
  const membersRef = collection(db, "rooms", roomName, "members");
  onSnapshot(membersRef, snapshot => {
    memberListDiv.innerHTML = "";
    snapshot.forEach(docSnap => {
      const member = docSnap.data();
      const div = document.createElement("div");
      div.textContent = member.username;
      memberListDiv.appendChild(div);
    });
  });
}

// Placeholder for chat.js to hook into
export let onRoomSelected = () => {};
