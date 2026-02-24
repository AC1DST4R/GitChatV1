// scripts/chat.js
import { db, storage, auth } from "./firebase.js";
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-storage.js";
import { selectRoom, onRoomSelected } from "./rooms.js";

const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendMsg");
const fileInput = document.getElementById("fileInput");

let currentRoom = "";
let userId = "";

// Capture user ID
auth.onAuthStateChanged(user => { if(user) userId = user.uid; });

// Hook to room selection
onRoomSelected = (roomName) => {
  currentRoom = roomName;
  loadMessages();
};

// Load messages
async function loadMessages() {
  if(!currentRoom) return;
  const messagesRef = collection(db, "rooms", currentRoom, "messages");
  const q = query(messagesRef, orderBy("timestamp"));
  onSnapshot(q, snapshot => {
    messagesDiv.innerHTML = "";
    snapshot.forEach(docSnap => {
      const msg = docSnap.data();
      const div = document.createElement("div");
      div.innerHTML = `<strong>${msg.username || "Anon"}:</strong> ${msg.text || ""} ${msg.fileUrl ? `<br><a href="${msg.fileUrl}" target="_blank">📎 File</a>` : ""}`;
      // Delete button
      if(msg.uid === userId || msg.owner) {
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
  const text = messageInput.value.trim();
  let fileUrl = "";
  const file = fileInput.files[0];
  if(file) {
    if(file.size > 5*1024*1024){ alert("Max 5MB for Spark plan"); return; }
    const fileRef = ref(storage, `files/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    fileUrl = await getDownloadURL(fileRef);
  }
  const messagesRef = collection(db, "rooms", currentRoom, "messages");
  await addDoc(messagesRef, { username:"Anon", text, fileUrl, uid:userId, timestamp:Date.now(), owner:false });
  messageInput.value = "";
  fileInput.value = "";
};

// Send on Enter key
messageInput.addEventListener("keydown", e => { if(e.key==="Enter") sendBtn.click(); });
