import { db, auth } from "./firebase.js";
import { collection, doc, setDoc, onSnapshot, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const roomList = document.getElementById("roomList");
const newRoomInput = document.getElementById("newRoomName");
const createRoomBtn = document.getElementById("createRoom");
const memberListDiv = document.getElementById("memberList");
const clearChatBtn = document.getElementById("clearChatBtn");
const disbandBtn = document.getElementById("disbandBtn");

let currentRoom = "";
let currentUserUid = "";
let isOwner = false;
let profile = { username:"Anon", avatar:"" };

auth.onAuthStateChanged(user => { if(user) currentUserUid = user.uid; });

// Profile creator
const overlay = document.getElementById("profileOverlay");
document.getElementById("startChat").onclick = () => {
  profile.username = document.getElementById("usernameInput").value || "Anon";
  profile.avatar = document.getElementById("avatarInput").value || "";
  overlay.style.display = "none";
};

// Load rooms
const roomsRef = collection(db, "rooms");
onSnapshot(roomsRef, snapshot => {
  roomList.innerHTML = "";
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const li = document.createElement("li");
    li.textContent = docSnap.id + (data.ownerUid===currentUserUid?" 👑":"");
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
  isOwner = ownerUid === currentUserUid;
  document.getElementById("roomTitle").textContent = name;
  addCurrentUserToMembers();
  loadMembers();
  clearChatBtn.style.display = isOwner?"block":"none";
  disbandBtn.style.display = isOwner?"block":"none";
  onRoomSelected(currentRoom, isOwner);
}

// Add user to members
async function addCurrentUserToMembers(){
  if(!currentRoom) return;
  const memberRef = doc(db, "rooms", currentRoom, "members", currentUserUid);
  await setDoc(memberRef, { username: profile.username, uid: currentUserUid, avatar: profile.avatar });
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

// Clear chat logs (owner)
clearChatBtn.onclick = async () => {
  if(!currentRoom) return;
  const messagesRef = collection(db, "rooms", currentRoom, "messages");
  onSnapshot(messagesRef, snapshot => {
    snapshot.forEach(docSnap => deleteDoc(doc(messagesRef, docSnap.id)));
  });
};

// Disband server
disbandBtn.onclick = async () => {
  if(!currentRoom) return;
  const roomRef = doc(db, "rooms", currentRoom);
  await deleteDoc(roomRef);
  currentRoom="";
  document.getElementById("roomTitle").textContent="Select a room";
};

export let onRoomSelected = () => {};
export let getProfile = () => profile;
