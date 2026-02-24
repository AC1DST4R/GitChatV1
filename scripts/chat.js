// scripts/chat.js
import { db, auth, storage } from './firebase.js';
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-storage.js";

const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const fileInput = document.getElementById("fileInput");
const sendBtn = document.getElementById("sendMsg");

let currentRoom = null;
let currentRoomData = null;

// Listen to room changes
document.addEventListener("roomChanged", async (e) => {
  currentRoomData = e.detail;
  currentRoom = currentRoomData.name;
  loadMessages(currentRoomData.id);
});

async function loadMessages(roomId) {
  messagesDiv.innerHTML = "";
  const messagesRef = collection(db, "rooms", roomId, "messages");
  const q = query(messagesRef, orderBy("timestamp"));
  onSnapshot(q, snapshot => {
    messagesDiv.innerHTML = "";
    snapshot.forEach(docSnap => {
      const msg = docSnap.data();
      const div = document.createElement("div");
      div.innerHTML = `<strong>${msg.username}</strong>: ${msg.text || ''}`;
      if (msg.fileUrl) div.innerHTML += `<br><a href="${msg.fileUrl}" target="_blank">${msg.fileName}</a>`;
      
      // Delete button
      if (msg.senderUid === auth.currentUser.uid || currentRoomData.owner === auth.currentUser.uid) {
        const delBtn = document.createElement("button");
        delBtn.textContent = "Delete";
        delBtn.onclick = () => deleteDoc(doc(db, "rooms", roomId, "messages", docSnap.id));
        div.appendChild(delBtn);
      }

      messagesDiv.appendChild(div);
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}

sendBtn.onclick = async () => {
  if (!currentRoom) return alert("Select a room first!");
  let fileUrl = null, fileName = null;
  const file = fileInput.files[0];
  if (file) {
    fileName = file.name;
    const storageRef = ref(storage, `files/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    fileUrl = await getDownloadURL(storageRef);
  }
  const messagesRef = collection(db, "rooms", currentRoomData.id, "messages");
  await addDoc(messagesRef, {
    text: messageInput.value,
    fileUrl,
    fileName,
    username: "Anonymous",
    senderUid: auth.currentUser.uid,
    timestamp: Date.now()
  });
  messageInput.value = "";
  fileInput.value = "";
};
