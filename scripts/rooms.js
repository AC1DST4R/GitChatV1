import { db, auth } from "./firebase.js";
import { collection, doc, setDoc, onSnapshot, getDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const roomList = document.getElementById("roomList");
const newRoomInput = document.getElementById("newRoomName");
const createRoomBtn = document.getElementById("createRoom");
const memberListDiv = document.getElementById("memberList");

let currentRoom = "";
let currentUserUid = "";

auth.onAuthStateChanged(user => { if(user) currentUserUid = user.uid; });

// Load rooms
const roomsRef = collection(db, "rooms");
onSnapshot(roomsRef, snapshot => {
  roomList.innerHTML = "";
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const li = document.createElement("li");
    li.textContent = docSnap.id;
    if(data.ownerUid === currentUserUid) li.textContent += " 👑";
    li.onclick = () => selectRoom(docSnap.id, data.ownerUid);
    roomList.appendChild(li);
  });
});

// Create room
createRoomBtn.onclick = async () => {
  const name = newRoomInput.value.trim();
  if(!name) return;
  const roomRef = doc(db, "rooms", name);
  const roomSnap = await getDoc(roomRef);
  if(!roomSnap.exists()){
    await setDoc(roomRef, { ownerUid: currentUserUid });
  }
  selectRoom(name, currentUserUid);
  newRoomInput.value = "";
};

// Select room
export function selectRoom(name, ownerUid){
  currentRoom = name;
  document.getElementById("roomTitle").textContent = name;
  addCurrentUserToMembers();
  loadMembers();
  onRoomSelected(name, ownerUid === currentUserUid);
}

// Add user to members
async function addCurrentUserToMembers(){
  if(!currentRoom) return;
  const memberRef = doc(db, "rooms", currentRoom, "members", currentUserUid);
  await setDoc(memberRef, { username:"Anon", uid: currentUserUid });
}

// Load members
function loadMembers(){
  if(!currentRoom) return;
  const membersRef = collection(db, "rooms", currentRoom, "members");
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

// Placeholder for chat.js hook
export let onRoomSelected = () => {};
