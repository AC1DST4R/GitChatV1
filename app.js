const WS_URL = "wss://gitchatv1-backend.onrender.com";
const ws = new WebSocket(WS_URL);

const peers = {}; // peerId -> { pc, dc }
let myId = null;
let myRoom = null;
let isHost = false;

const chat = document.getElementById("chat");
const usersDiv = document.getElementById("users");
const debug = document.getElementById("debug");
const rooms = document.getElementById("rooms");
const pingDisplay = document.getElementById("pingDisplay");

/* ================= Utilities ================= */
function log(msg){
    const maxLines = 20;
    debug.innerHTML += msg + "<br>";
    const lines = debug.innerHTML.split("<br>");
    if(lines.length > maxLines) debug.innerHTML = lines.slice(-maxLines).join("<br>");
    debug.scrollTop = debug.scrollHeight;
}

function status(t){ document.getElementById("status").textContent = t; }
function showChat(){ 
    document.getElementById("chatBox").classList.remove("hidden"); 
    document.getElementById("leaveBtn").classList.remove("hidden"); 
}

/* ================= WebSocket ================= */
ws.onopen = () => { log("Connected to signaling server"); ws.send(JSON.stringify({ type:"list" })); };

ws.onmessage = async e => {
    const m = JSON.parse(e.data);

    if(m.type==="rooms") renderRooms(m.rooms);
    if(m.type==="hosted"){ 
        isHost = true; 
        status("Hosting "+myRoom); 
        showChat(); 
        updateUsers(); 
    }
    if(m.type==="joined"){ 
        myId = m.id; 
        status("Joined "+myRoom); 
        showChat(); 
        // create peer connections to all existing peers
        for(const pid of m.peers) createPeer(pid, true);
        updateUsers();
    }
    if(m.type==="peer-join"){ 
        // existing peers create connection to new joiner
        createPeer(m.id, false); 
        updateUsers();
    }
    if(m.type==="signal") await handleSignal(m);
    if(m.type==="kicked"){ alert("You were kicked"); leaveRoom(true); }
    if(m.type==="room-closed"){ alert("Room closed"); leaveRoom(true); }
    if(m.type==="error") alert(m.msg);
    if(m.type==="pong"){ pingDisplay.textContent = "Ping: "+Math.round(performance.now()-m.t)+"ms"; }
};

/* ================= Signal Handling ================= */
async function handleSignal(msg){
    let peer = peers[msg.from] || createPeer(msg.from, false);
    if(msg.data.desc){
        await peer.pc.setRemoteDescription(msg.data.desc);
        if(msg.data.desc.type === "offer"){
            const answer = await peer.pc.createAnswer();
            await peer.pc.setLocalDescription(answer);
            ws.send(JSON.stringify({ type:"signal", to: msg.from, data:{ desc: answer } }));
        }
    }
    if(msg.data.ice) peer.pc.addIceCandidate(msg.data.ice);
}

/* ================= WebRTC Peer ================= */
function createPeer(id, initiator){
    if(peers[id]) return peers[id];

    const pc = new RTCPeerConnection({
        iceServers:[
            { urls: "stun:stun.l.google.com:19302" }, // public STUN
            { 
                urls: "turn:turn.anyfirewall.com:443?transport=tcp", // public TURN
                username: "webrtc",
                credential: "webrtc"
            }
        ]
    });

    let dc;

    if(initiator){
        dc = pc.createDataChannel("chat");
        setupDC(dc);
    } else {
        pc.ondatachannel = e => { dc = e.channel; setupDC(dc); };
    }

    pc.onicecandidate = e => {
        if(e.candidate) ws.send(JSON.stringify({ type:"signal", to:id, data:{ ice: e.candidate } }));
    };

    if(initiator){
        pc.createOffer().then(o=>{
            pc.setLocalDescription(o);
            ws.send(JSON.stringify({ type:"signal", to:id, data:{ desc: o } }));
        });
    }

    peers[id] = { pc, dc };
    return peers[id];
}

function setupDC(dc){
    dc.onopen = updateUsers;
    dc.onmessage = e => { chat.innerHTML += e.data+"<br>"; chat.scrollTop = chat.scrollHeight; };
}

/* ================= Chat ================= */
function sendMsg(){
    const text = `${username.value || "Anon"}: ${msg.value}`;
    Object.values(peers).forEach(p => { if(p.dc?.readyState === "open") p.dc.send(text); });
    chat.innerHTML += text+"<br>";
    msg.value = "";
}

/* ================= Host / Join ================= */
function hostRoom(){
    if(myRoom) return alert("Already in a room");
    myRoom = room.value.trim(); if(!myRoom) return alert("Room required");
    if(privateChk.checked && password.value.length < 3) return alert("Password too short");
    ws.send(JSON.stringify({ type:"host", room: myRoom, password: privateChk.checked ? password.value : null }));
}

function joinRoom(name, isPrivate){
    if(myRoom) return alert("Already in a room");
    let pass = "";
    if(isPrivate){ pass = prompt("Password:"); if(!pass) return; }
    myRoom = name;
    ws.send(JSON.stringify({ type:"join", room: name, password: pass }));
}

/* ================= Rooms ================= */
function renderRooms(list){
    rooms.innerHTML = "";
    list.forEach(r => {
        const div = document.createElement("div");
        div.textContent = `${r.name} (${r.users}) ${r.private ? "🔒" : ""}`;
        div.onclick = () => joinRoom(r.name, r.private);
        rooms.appendChild(div);
    });
}

/* ================= Users ================= */
function updateUsers(){
    usersDiv.innerHTML = "<b>Users</b><br>";
    Object.keys(peers).forEach(id => {
        const div = document.createElement("div");
        div.className = "user";
        div.textContent = id;
        if(isHost){
            const btn = document.createElement("button");
            btn.textContent = "Kick";
            btn.onclick = () => kick(id);
            div.appendChild(btn);
        }
        usersDiv.appendChild(div);
    });
}

/* ================= Kick ================= */
function kick(id){ if(!isHost) return; ws.send(JSON.stringify({ type:"kick", target: id })); }

/* ================= Leave ================= */
function leaveRoom(forced){ 
    Object.values(peers).forEach(p => p.pc.close()); 
    if(!forced) ws.close(); 
    location.reload(); 
}

/* ================= Ping ================= */
setInterval(()=>ws.send(JSON.stringify({ type:"ping", t: performance.now() })), 3000);
