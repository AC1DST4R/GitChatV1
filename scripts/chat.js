import { db, storage, auth } from "./firebase.js";
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-storage.js";
import { onRoomSelected, getProfile } from "./rooms.js";

const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendMsg");
const fileInput = document.getElementById("fileInput");

let currentRoom = "";
let currentUserUid = "";
let isOwner = false;

auth.onAuthStateChanged(user => { if(user) currentUserUid = user.uid; });

onRoomSelected = (roomName, ownerFlag) => {
  currentRoom = roomName;
  isOwner = ownerFlag;
  loadMessages();
};

async function loadMessages(){
  if(!currentRoom) return;
  const messagesRef = collection(db, "rooms", currentRoom, "messages");
  const q = query(messagesRef, orderBy("timestamp"));
  onSnapshot(q, snapshot => {
    messagesDiv.innerHTML = "";
    snapshot.forEach(docSnap => {
      const msg = docSnap.data();
      const div = document.createElement("div");
      div.innerHTML = `<strong>${msg.username}</strong>: ${msg.text||""} ${msg.fileUrl?`<br><a href="${msg.fileUrl}" target="_blank">📎 File</a>`:""}`;
      if(msg.uid===currentUserUid||isOwner){
        const delBtn = document.createElement("button");
        delBtn.textContent = "X";
        delBtn.onclick = async () => await deleteDoc(doc(messagesRef, docSnap.id));
        div.appendChild(delBtn);
      }
      messagesDiv.appendChild(div);
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}

// Send message
sendBtn.onclick = async () => {
  if(!currentRoom) return;
  const profile = getProfile();
  const text = messageInput.value.trim();
  const file = fileInput.files[0];
  let fileUrl = "";

  if(file){
    if(file.size > 5*1024*1024){ alert("Max file size 5MB"); return; }
    const storageRef = ref(storage, `rooms/${currentRoom}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    fileUrl = await getDownloadURL(storageRef);
  }

  if(!text && !fileUrl) return;

  const messagesRef = collection(db, "rooms", currentRoom, "messages");
  await addDoc(messagesRef, {
    username: profile.username,
    uid: currentUserUid,
    text,
    fileUrl,
    timestamp: Date.now()
  });

  messageInput.value = "";
  fileInput.value = "";
};
