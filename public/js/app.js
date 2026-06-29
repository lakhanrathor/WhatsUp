let memberSelectorMode = "add";
let selectedPermissionMembers = new Set();
let scheduledMessage = null;
let editingScheduledId = null;

// Mobile Section 
const mobileBackBtn =
document.getElementById(
"mobileBackBtn"
);
mobileBackBtn.onclick = ()=>{

document.querySelector(".sidebar")
.style.display = "block";

document.querySelector(".chat-section")
.classList.remove("active");

};


document
.getElementById("continuePermissionBtn")
.onclick = async () => {

const mode = document.querySelector(
'input[name="messagePermission"]:checked'
).value;

messagePermissionModal.style.display = "none";

if(mode === "everyone"){

await fetch("/api/chat/update-message-permission",{
method:"PUT",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
chatId:activeChatId,
adminId:USER_ID,
mode:"everyone",
members:[]
})
});

messagePermissionModal.style.display="none";
alert("Everyone can now send messages.");

return;

}

if(mode === "admins"){

await fetch("/api/chat/update-message-permission",{
method:"PUT",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
chatId:activeChatId,
adminId:USER_ID,
mode:"admins",
members:[]
})
});

messagePermissionModal.style.display="none";
alert("Only admins can now send messages.");

return;

}

if(mode === "only"){

memberSelectorMode = "permission-only";

groupInfoModal.style.display = "none";

addMemberModal.style.display = "flex";

addMemberSearch.value = "";

addMemberResults.innerHTML = "";

return;

}

if(mode === "except"){

memberSelectorMode = "permission-except";

groupInfoModal.style.display = "none";

addMemberModal.style.display = "flex";

addMemberSearch.value = "";

addMemberResults.innerHTML = "";

}

};
const permissionDoneBtn =
document.getElementById("permissionDoneBtn");
permissionDoneBtn.onclick = async()=>{

const mode =
document.querySelector(
'input[name="messagePermission"]:checked'
).value;

const response =
await fetch(

"/api/chat/update-message-permission",

{

method:"PUT",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

chatId:activeChatId,

adminId:USER_ID,

mode,

members:Array.from(selectedPermissionMembers)

})

}

);

if(response.ok){

activeChat = await response.json();

selectedPermissionMembers.clear();

addMemberModal.style.display = "none";

alert("Messaging permission updated successfully.");

}
else{

const error = await response.json();

alert(error.message);

}

};

const scheduledPanel =
document.getElementById(
"scheduledPanel"
);

const scheduledMessagesList =
document.getElementById(
"scheduledMessagesList"
);



const closeScheduledPanel =
document.getElementById(
"closeScheduledPanel"
);
closeScheduledPanel.onclick = () => {

    scheduledPanel.style.display = "none";

};

const messagePermissionModal =
document.getElementById(
"messagePermissionModal"
);

document
.getElementById(
"closePermissionBtn"
)
.onclick=()=>{

messagePermissionModal.style.display="none";

};

document
.getElementById("messagePermissionBtn")
.onclick = () => {

messagePermissionModal.style.display="flex";

};

const removeMemberBtn =
document.getElementById(
"removeMemberBtn"
);
removeMemberBtn.onclick = () => {

    groupInfoModal.style.display = "none";

    removeMemberModal.style.display = "flex";

    removeMemberSearch.value = "";

    removeMemberResults.innerHTML = "";

    removeMemberSearch.dispatchEvent(
        new Event("input")
    );

};

const removeMemberModal =
document.getElementById(
"removeMemberModal"
);

const removeMemberSearch =
document.getElementById(
"removeMemberSearch"
);

const removeMemberResults =
document.getElementById(
"removeMemberResults"
);

const closeRemoveMember =
document.getElementById(
"closeRemoveMember"
);
closeRemoveMember.onclick = () => {

    removeMemberModal.style.display = "none";

};
removeMemberSearch
.addEventListener(
"input",
()=>{

const text=
removeMemberSearch.value
.toLowerCase();

removeMemberResults.innerHTML="";

activeChat.activeMembers
.filter(member =>

member._id.toString() !== USER_ID.toString()

&&

member.username
.toLowerCase()
.includes(text)

)

.forEach(member=>{

const div=
document.createElement("div");

div.className=
"member-item";

div.innerHTML=
`
<b>${member.username}</b>

<button>
Remove
</button>
`;

div.querySelector("button").onclick = async () => {

    const response = await fetch(

        "/api/chat/remove-member",

        {

            method: "PUT",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                chatId: activeChat._id,

                memberId: member._id,

                adminId: USER_ID

            })

        }

    );

    if(response.ok){

        activeChat = await response.json();

        await loadChats();
        await refreshActiveChat();

        chatName.textContent = activeChat.name;

        const otherMembers = activeChat.activeMembers.filter(
            member => member._id.toString() !== USER_ID.toString()
        );

        chatStatus.textContent =
        `${activeChat.activeMembers.length} members • ${
            otherMembers
                .slice(0,3)
                .map(m => m.username)
                .join(", ")
        }`;

        loadMessages();

        removeMemberModal.style.display = "none";

        groupMenuBtn.click();

    }
    else{

        const error = await response.json();

        alert(error.message);

    }

};

removeMemberResults
.appendChild(div);

});

});
async function loadScheduledMessages(){

try{

const response =
await fetch(

`/api/scheduled/chat/${activeChatId}/${USER_ID}`

);

const messages =
await response.json();

scheduledMessagesList.innerHTML="";

if(messages.length===0){

scheduledMessagesList.innerHTML=`

<p style="text-align:center;color:#9ca3af;">

No scheduled messages

</p>

`;

return;

}

messages.forEach(message=>{

const card =
document.createElement("div");

card.className="scheduled-card";

card.innerHTML=`

<h4>${message.text}</h4>

<p>

📅 ${
new Date(message.scheduledFor)
.toLocaleDateString()
}

</p>

<p>

🕒 ${
new Date(message.scheduledFor)
.toLocaleTimeString([],{

hour:"2-digit",

minute:"2-digit"

})

}

</p>

<div class="scheduled-actions">

<button
class="editScheduleBtn"
data-id="${message._id}"
>

✏ Edit

</button>

<button
class="deleteScheduleBtn"
data-id="${message._id}"
>

🗑 Delete

</button>

</div>

`;

scheduledMessagesList.appendChild(card);

/* DELETE */

card.querySelector(".deleteScheduleBtn").onclick =
async()=>{

if(
!confirm(
"Delete this scheduled message?"
)
){

return;

}

const response =
await fetch(

`/api/scheduled/${message._id}`,

{

method:"DELETE"

}

);

if(response.ok){

loadScheduledMessages();

}

};

/* EDIT */

card.querySelector(".editScheduleBtn").onclick = ()=>{

editingScheduledId =
message._id;

/* Fill Message */

messageInput.value =
message.text;

/* Fill Date */

const date =
new Date(
message.scheduledFor
);

scheduleDate.value =
date.toISOString().split("T")[0];

/* Fill Time */

scheduleTime.value =
`${String(date.getHours()).padStart(2,"0")}:${String(date.getMinutes()).padStart(2,"0")}`;

/* Close Panel */

scheduledPanel.style.display =
"none";

/* Open Schedule Modal */

scheduleModal.style.display =
"flex";

};

});

}
catch(error){

console.log(error);

}

}


const scheduleBtn =
document.getElementById(
"scheduleBtn"
);

const scheduleModal =
document.getElementById(
"scheduleModal"
);

const scheduleDate =
document.getElementById(
"scheduleDate"
);

const scheduleTime =
document.getElementById(
"scheduleTime"
);

const confirmScheduleBtn =
document.getElementById(
"confirmScheduleBtn"
);
confirmScheduleBtn.onclick = () => {

    if(
        scheduleDate.value === "" ||
        scheduleTime.value === ""
    ){

        alert("Select date and time.");

        return;

    }

    scheduledMessage = {

        date: scheduleDate.value,

        time: scheduleTime.value

    };

    scheduleBtn.textContent = "🕒";

    scheduleBtn.classList.add(
        "scheduled"
    );

    scheduleModal.style.display = "none";

};

const closeScheduleBtn =
document.getElementById(
"closeScheduleBtn"
);
scheduleBtn.onclick = async () => {

    await loadScheduledMessages();

    const cards =
    scheduledMessagesList.children.length;

    if(cards > 0){

        scheduledPanel.style.display = "block";

        return;

    }

    const message =
    messageInput.value.trim();

    if(message === ""){

        alert(
        "Type a message before scheduling."
        );

        return;

    }

    const now = new Date();

    now.setMinutes(
    now.getMinutes()+1
    );

    scheduleDate.value =
    now.toISOString().split("T")[0];

    scheduleTime.value =
    `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;

    scheduleModal.style.display =
    "flex";

};
closeScheduleBtn.onclick = () => {

scheduleModal.style.display =
"none";

};
scheduleAnotherBtn.onclick = () => {

    scheduledPanel.style.display = "none";

    const message =
    messageInput.value.trim();

    if(message === ""){

        alert(
        "Type a message before scheduling."
        );

        return;

    }

    const now =
    new Date();

    now.setMinutes(
    now.getMinutes()+1
    );

    scheduleDate.value =
    now.toISOString().split("T")[0];

    scheduleTime.value =
    `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;

    scheduleModal.style.display =
    "flex";

};

const addMemberBtn =
document.getElementById(
"addMemberBtn"
);
addMemberBtn.onclick = () => {

    memberSelectorMode = "add";
    selectedPermissionMembers.clear();

    groupInfoModal.style.display = "none";

    addMemberModal.style.display = "flex";

    addMemberSearch.value = "";

    addMemberResults.innerHTML = "";

};


const addMemberModal =
document.getElementById(
"addMemberModal"
);

const addMemberSearch =
document.getElementById(
"addMemberSearch"
);

const addMemberResults =
document.getElementById(
"addMemberResults"
);

const closeAddMember =
document.getElementById("closeAddMember");
closeAddMember.onclick = () => {
    addMemberModal.style.display = "none";
};

addMemberSearch.addEventListener(
"input",
async()=>{

    const text =
    addMemberSearch.value.trim();

if(text.length < 2){

addMemberResults.innerHTML = "";

return;

}

const response =
await fetch(
`/api/auth/search/${text}`
);

const users =
await response.json();
console.log("Users:", users);

let availableUsers;

if(memberSelectorMode === "add"){

    // Show only users who are NOT already in the group
    availableUsers = users.filter(user =>

        !activeChat.activeMembers.some(member =>

            member._id.toString() === user._id.toString()

        )

    );

}
else{

    // For permissions, show only current group members
    availableUsers = activeChat.activeMembers.filter(member =>

        member._id.toString() !== USER_ID.toString() &&

        member.username
        .toLowerCase()
        .includes(text.toLowerCase())

    );

}
console.log("Available Users:", availableUsers);

addMemberResults.innerHTML = "";
console.log("Rendering users...");

availableUsers.forEach(user=>{
console.log("Creating div for:", user.username);
const div =
document.createElement("div");

div.className =
"search-user";

div.innerHTML = `
<strong>${user.username}</strong>
<br>
<small>${user.email}</small>
`;

div.onclick = async()=>{

/* ADD MEMBER */

if(memberSelectorMode==="add"){

await fetch(

"/api/chat/add-member",

{

method:"PUT",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

chatId:activeChatId,

memberId:user._id,

adminId:USER_ID

})

}

);

await loadChats();

loadMessages();

groupInfoModal.style.display="flex";

addMemberModal.style.display="none";

groupMenuBtn.click();

return;

}

/* PERMISSION : ONLY */

if(memberSelectorMode==="permission-only"){

if(selectedPermissionMembers.has(user._id)){

selectedPermissionMembers.delete(user._id);

div.classList.remove("selected-user");

}

else{

selectedPermissionMembers.add(user._id);

div.classList.add("selected-user");

}

return;

}

/* PERMISSION : EXCEPT */

if(memberSelectorMode==="permission-except"){

if(selectedPermissionMembers.has(user._id)){

selectedPermissionMembers.delete(user._id);

div.classList.remove("selected-user");

}

else{

selectedPermissionMembers.add(user._id);

div.classList.add("selected-user");

}

return;

}

};
console.log("Appending:", user.username);

addMemberResults.appendChild(div);

});

}
);

const renameGroupBtn =
document.getElementById(
"renameGroupBtn"
);
renameGroupBtn.addEventListener(
"click",
async()=>{

const newName =
prompt(
"Enter new group name"
);

if(
!newName ||
!newName.trim()
)
return;

const response =
await fetch(

"/api/chat/rename-group",

{

method:"PUT",

headers:{
"Content-Type":
"application/json"
},

body:JSON.stringify({

chatId:
activeChatId,

name:
newName.trim()

})

}

);

const updated =
await response.json();

activeChat.name =
updated.name;

chatName.textContent =
updated.name;

groupInfoName.textContent =
updated.name;

loadChats();

});

const groupInfoModal =
document.getElementById(
"groupInfoModal"
);

const groupInfoName =
document.getElementById(
"groupInfoName"
);

const groupInfoAdmin =
document.getElementById(
"groupInfoAdmin"
);

const groupMembersList =
document.getElementById(
"groupMembersList"
);

const groupAdminOptions =
document.getElementById(
"groupAdminOptions"
);

const closeGroupInfo =
document.getElementById(
"closeGroupInfo"
);

const groupMenuBtn =
document.getElementById(
"groupMenuBtn"
);

const emptyChat =
document.getElementById(
"emptyChat"
);

const chatContent =
document.getElementById(
"chatContent"
);

const chatName =
document.getElementById("chatName");

const chatStatus =
document.getElementById("chatStatus");

const groupBtn =
document.getElementById(
"groupBtn"
);

const groupModal =
document.getElementById(
"groupModal"
);

const closeGroupModal =
document.getElementById(
"closeGroupModal"
);

const groupSearch =
document.getElementById(
"groupSearch"
);

const groupSearchResults =
document.getElementById(
"groupSearchResults"
);

const groupName =
document.getElementById(
"groupName"
);
closeGroupInfo.addEventListener(
"click",
()=>{

groupInfoModal.style.display = "none";

}
);

const createGroupBtn =
document.getElementById(
"createGroupBtn"
);

let selectedMembers =
[];

const privateBtn =
document.getElementById(
"privateBtn"
);

const createPrivate =
document.getElementById(
"createPrivate"
);

const audienceModal =
document.getElementById(
"audienceModal"
);

const closeModal =
document.getElementById(
"closeModal"
);

const logoutBtn =
document.getElementById(
  "logoutBtn"
);

const chatSearch =
document.getElementById(
  "chatSearch"
);

const searchResults =
document.getElementById(
  "searchResults"
);

const newChatBtn =
document.getElementById(
  "newChatBtn"
);

const chatModal =
document.getElementById(
  "chatModal"
);

const closeChatModal =
document.getElementById(
  "closeChatModal"
);

const sendBtn =
document.getElementById(
  "sendBtn"
);

const chatWindow =
document.getElementById(
  "chatWindow"
);
groupMenuBtn.onclick = ()=>{

if(!activeChat)
return;

if(activeChat.type!=="group")
return;

groupInfoModal.style.display =
"flex";

groupInfoName.textContent =
activeChat.name;

groupInfoAdmin.textContent =
"Admin : " +
activeChat.admin.username;

groupMembersList.innerHTML =
"";

activeChat.activeMembers.forEach(
member=>{

const div =
document.createElement(
"div"
);

div.className =
"search-user";

div.innerHTML=`

${member.username}

${
member._id.toString() === activeChat.admin._id.toString()
?
"<strong>(Admin)</strong>"
:
""
}

`;

groupMembersList.appendChild(
div
);

});

if(
activeChat.admin._id===USER_ID
){

groupAdminOptions.style.display=
"block";

}
else{

groupAdminOptions.style.display=
"none";

}

};

document
.getElementById(
"createPrivate"
)

.addEventListener(
"click",
()=>{

const audience =
document.querySelector(
'input[name="audience"]:checked'
);

if(!audience){

alert(
"Select audience type"
);

return;

}

visibilityType =
audience.value;

visibleTo = [];

document
.querySelectorAll(
"#memberList input:checked"
)
.forEach(
(cb)=>{

visibleTo.push(
cb.value
);

}
);

window.visibilityType =
visibilityType;

window.visibleTo =
visibleTo;

document
.getElementById(
"audienceModal"
)
.style.display =
"none";

}
);

const messageInput =
document.querySelector(
  ".message-input input"
);

const token =
localStorage.getItem(
  "token"
);
const socket =
io();
socket.on(
"receive-message",
(data)=>{

if(
data.chatId === activeChatId
){

loadMessages();

}

loadChats();

}
);

if(!token){

  window.location =
  "login.html";

}

let currentUser =
localStorage.getItem(
  "username"
);
document.getElementById(
  "profileName"
).textContent =
currentUser;

createGroupBtn.addEventListener(
"click",
async()=>{

if(
!groupName.value.trim()
){

alert(
"Enter Group Name"
);

return;

}

const memberIds =
selectedMembers.map(
user=>user._id
);

memberIds.push(
USER_ID
);

const response =
await fetch(

"/api/chat/group-chat",

{

method:"POST",

headers:{
"Content-Type":
"application/json"
},

body:JSON.stringify({

name:groupName.value.trim(),

members:memberIds,

admin:USER_ID

})

}

);

if(response.ok){

groupModal.style.display =
"none";

selectedMembers =
[];

groupName.value =
"";



loadChats();

alert(
"Group Created"
);

}

}
);

groupBtn.addEventListener(
"click",
()=>{

groupModal.style.display =
"flex";

}
);

closeGroupModal.addEventListener(
"click",
()=>{

groupModal.style.display =
"none";

}
);
groupSearch.addEventListener(
"input",
async()=>{

const text =
groupSearch.value.trim();

if(text.length < 2){

groupSearchResults.innerHTML =
"";

return;

}

const response =
await fetch(

`/api/auth/search/${text}`

);

const users =
await response.json();

groupSearchResults.innerHTML =
"";

users.forEach(
user=>{

const div =
document.createElement(
"div"
);

div.className =
"search-user";

div.innerHTML =
`
<strong>
${user.username}
</strong>

<br>

<small>
${user.email}
</small>
`;

div.addEventListener(
"click",
()=>{

if(
!selectedMembers.some(
m=>m._id === user._id
)
){

selectedMembers.push(
user
);

renderMembers();

}

}
);

groupSearchResults
.appendChild(div);

}
);

}
);

newChatBtn.addEventListener(
  "click",
  ()=>{

    chatModal.style.display =
    "flex";

  }
);
privateBtn.addEventListener(
"click",
()=>{

if(
!activeChat
||
activeChat.type !==
"group"
){
  console.log(activeChat);
  console.log(activeChat?.type);

alert(
"Selective Visibility works only in groups"
);

return;

}

loadAudienceMembers();

audienceModal.style.display =
"flex";

}
);

closeModal.addEventListener(
"click",
()=>{

audienceModal.style.display =
"none";

}
);
createPrivate.addEventListener(
"click",
()=>{

const selectedAudience =
document.querySelector(
'input[name="audience"]:checked'
);

if(!selectedAudience){

alert(
"Select Audience Type"
);

return;

}

visibilityType =
selectedAudience.value;

visibleTo = [];

document
.querySelectorAll(
".member-list input[type='checkbox']:checked"
)
.forEach(

checkbox=>{

visibleTo.push(
checkbox.value
);

}

);

audienceModal.style.display =
"none";


}
);

closeChatModal
.addEventListener(

  "click",

  ()=>{

    chatModal.style.display =
    "none";

  }

);

/* IMPORTANT */

const USER_ID =
localStorage.getItem(
"userId"
);

/* Dynamic Chats */

let chats = [];

let activeChatId =
null;
let selectedUserId = null;
let selectedMessages =
[];
let selectedChats = [];
let chatSelectionMode = false;
let selectionMode =
false;

let activeChat =
null;
let activeThread =
null;

let visibilityType =
"all";

async function
loadThreadMessages(){

if(!activeThread)
return;

const response =
await fetch(

`/api/thread/messages/${activeThread}`

);

const messages =
await response.json();

const container =
document.getElementById(
"threadMessages"
);

container.innerHTML =
"";

messages.forEach(
(msg)=>{

const isMine =
msg.senderId.username ===
currentUser;

threadMessages.innerHTML +=
`
<div class="
thread-msg
${isMine ? "my-thread-msg" : "other-thread-msg"}
">

<strong>
${msg.senderId.username}
</strong>

<p>
${msg.text}
</p>

</div>
`;

}
);

}

async function
sendThreadMessage(){

const input =
document.getElementById(
"threadInput"
);

const text =
input.value.trim();

if(!text)
return;
console.log(
"Sending Thread Message"
);

console.log(
activeThread
);

console.log(
text
);

await fetch(

"/api/thread/send-message",

{

method:"POST",

headers:{
"Content-Type":
"application/json"
},

body:JSON.stringify({

threadId:
activeThread,

senderId:
USER_ID,

text

})

}

);

input.value =
"";

loadThreadMessages();

}

document
.getElementById(
"threadSend"
)
.addEventListener(
"click",
sendThreadMessage
);

let visibleTo =
[];

async function
createThread(
participants
){

const response =
await fetch(

"/api/thread/create",

{

method:"POST",

headers:{
"Content-Type":
"application/json"
},

body:JSON.stringify({

participants,

parentChat:
activeChatId

})

}

);

const thread =
await response.json();

openThread(
thread
);

}
document
.getElementById(
"deleteMessagesBtn"
)
.addEventListener(
"click",
async()=>{

if(
selectedMessages.length
=== 0
) return;

await fetch(

"/api/chat/messages",

{

method:"DELETE",

headers:{
"Content-Type":
"application/json"
},

body:JSON.stringify({

messageIds:
selectedMessages

})

}

);

selectedMessages =
[];

loadMessages();

}
);

/* Load Chats */
function renderMembers(){

const container =
document.getElementById(
"selectedMembers"
);

container.innerHTML =
"";

selectedMembers.forEach(
user=>{

const div =
document.createElement(
"div"
);

div.textContent =
user.username;

container.appendChild(
div
);

}
);

}

function loadAudienceMembers(){

const memberList =
document.getElementById(
"memberList"
);

memberList.innerHTML =
"";

if(
!activeChat
||
activeChat.type !==
"group"
){
return;
}

activeChat.activeMembers.forEach(
member=>{

if(
member._id === USER_ID
){
return;
}

const label =
document.createElement(
"label"
);

label.innerHTML =
`
<input
type="checkbox"
value="${member._id}"
>

${member.username}
`;

memberList.appendChild(
label
);

}
);

}
async function refreshActiveChat(){

    const response =
    await fetch(
        `/api/chat/user/${USER_ID}`
    );

    const chats =
    await response.json();

    activeChat =
    chats.find(
        chat => chat._id === activeChatId
    );

}

async function
loadChats(){

  try{

    const response =
    await fetch(
    `/api/chat/user/${USER_ID}`
    );
    chats =
    await response.json();

    const chatList =
    document.getElementById(
      "chatList"
    );

    chatList.innerHTML =
    "";

    chats.forEach(
      (chat)=>{

        const div =
        document.createElement(
          "div"
        );

        div.className =
        "chat-item";
        div.addEventListener(
        "contextmenu",
        (e)=>{

        e.preventDefault();

        chatSelectionMode =
        true;

        toggleChatSelection(
        div,
        chat._id
        );

        }
        );

        let displayName =
        chat.name;

        if(
        chat.type === "private"
        && chat.members
        ){

        const otherUser =
        chat.members.find(
        member =>
        member._id != USER_ID
        );

        if(otherUser){

        displayName =
        otherUser.username;

        }

}

        div.innerHTML =
        `
        <div class="chat-left">

          <div class="chat-avatar">

            ${chat.name
            .charAt(0)
            .toUpperCase()}

          </div>

          <div class="chat-info">

            <h4>
              ${displayName}
            </h4>

            <p>
              ${chat.type}
            </p>

          </div>

        </div>
        `;

        div.addEventListener(
          "click",
          ()=>{

            activeChatId =
            chat._id;
            activeChat = chat;
            activeChat.admin
            emptyChat.style.display = "none";
            chatContent.style.display = "flex";
            chatName.textContent = displayName;
            if(chat.type === "group"){

    const otherMembers = chat.members.filter(
        member => member._id.toString() !== USER_ID.toString()
    );

    const names = otherMembers
        .slice(0,3)
        .map(member => member.username)
        .join(", ");

    chatStatus.textContent =
        `${otherMembers.length + 1} members • ${names}`;

}
          else{

              chatStatus.textContent = "Online";

          }

            const privateBtn =
            document.getElementById(
            "privateBtn"
            );
            console.log(chat);
            if(
            chat.type === "group"
            ){

            privateBtn.style.display =
            "flex";

            }
            else{

            privateBtn.style.display =
            "none";

}
            socket.emit(
            "join-chat",
            activeChatId
            );

            let headerName =
            displayName;

            document
            .querySelector(
            ".chat-header h2"
            )
            .textContent =
            headerName;

            loadMessages();
            /* Mobile */

            if(window.innerWidth <= 768){

            document.querySelector(".sidebar")
            .style.display = "none";

            document.querySelector(".chat-section")
            .style.display = "flex";  

            document.querySelector(".chat-section")
            .classList.add("active");

}

          }
        );
        if(chat._id === activeChatId){

        div.classList.add(
        "active-chat"
        );

        }

        chatList.appendChild(
div
);

});

if(activeChatId){

    const updatedChat = chats.find(
        chat => chat._id.toString() === activeChatId.toString()
    );

    if(updatedChat){

        activeChat = updatedChat;

        chatName.textContent = activeChat.name;

        const otherMembers = activeChat.members.filter(
            member => member._id.toString() !== USER_ID.toString()
        );

        if(activeChat.type === "group"){

            chatStatus.textContent =
            `${activeChat.members.length} members • ${
                otherMembers
                .slice(0,3)
                .map(m => m.username)
                .join(", ")
            }`;

        }else{

            chatStatus.textContent = "Online";

        }

        emptyChat.style.display = "none";
        chatContent.style.display = "flex";

    }

}else{

    emptyChat.style.display = "flex";
    chatContent.style.display = "none";

}
  }
catch(error){

console.log(error);

}}
async function updateScheduleIcon(){

    if(!activeChatId){

        scheduleBtn.textContent = "⏰";

        return;

    }

    const response =
    await fetch(

        `/api/scheduled/chat/${activeChatId}/${USER_ID}`

    );

    const scheduled =
    await response.json();

    if(scheduled.length > 0){

        scheduleBtn.textContent = "🕒";

        scheduleBtn.classList.add("scheduled");

    }
    else{

   scheduleBtn.textContent = "⏰";

    scheduleBtn.classList.remove(
        "scheduled"
    );

    }

}

/* Load Messages */

async function
loadMessages(){

  if(
    !activeChatId
  ) return;

  try{

    const response =
    await fetch(

      `/api/chat/messages/${activeChatId}?userId=${USER_ID}`

    );

    const messages =
    await response.json();

    chatWindow.innerHTML =
    "";

    messages.forEach(
      (msg)=>{

        const div =
        document.createElement(
          "div"
        );

        const sender =
        msg.senderId
        ? msg.senderId.username
        : "Unknown";

        const isMine =
        sender ===
        currentUser;

        div.className =
        isMine
        ? "message sent"
        : "message received";
        div.addEventListener(
        "contextmenu",
        (e)=>{

        e.preventDefault();

        selectionMode =
        true;

        toggleMessageSelection(
        div,
        msg._id
        );

        }
        );

        div.innerHTML =
        `
        <div class="sender-name">
        ${sender}
        </div>

        <div class="message-text">
        ${msg.text}
        </div>

        ${
        msg.visibilityType === "only" ||
        msg.visibilityType === "except"
        ?
        `
        <button
        class="continue-btn"
        data-message="${msg._id}"
        >
        Continue Chat
        </button>
        `
        :
        ""
        }

        <span>
        ${new Date(
        msg.createdAt
        ).toLocaleTimeString()}
        </span>
        `;

        chatWindow.appendChild(
          div
        );
        const btn =
      div.querySelector(
      ".continue-btn"
      );

      if(btn){

      btn.addEventListener(
"click",
async()=>{

let response =
await fetch(

`/api/thread/message/${btn.dataset.message}`

);

let thread =
await response.json();

/* Thread Already Exists */

if(thread){

activeThread =
thread._id;

}
else{

/* Create New Thread */

response =
await fetch(

"/api/thread/create",

{

method:"POST",

headers:{
"Content-Type":
"application/json"
},

body:JSON.stringify({

parentMessage:
btn.dataset.message,

parentChat:
activeChatId,

participants:
activeChat.members.map(
m=>m._id
)

})

}

);

thread =
await response.json();

activeThread =
thread._id;

}

document
.getElementById(
"threadPanel"
)
.style.right =
"0";

loadThreadMessages();

}
);

      }

      }
    );

    chatWindow.scrollTop =
    chatWindow.scrollHeight;

  }
  catch(error){

    console.log(error);

  }

}

/* Send Message */

async function sendMessage(){

const text =
messageInput.value.trim();

if(text===""){

return;

}

if(
!activeChatId &&
selectedUserId
){

const response =
await fetch(

"/api/chat/private-chat",

{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

user1:USER_ID,

user2:selectedUserId

})

}

);

const chat =
await response.json();

activeChatId =
chat._id;

activeChat =
chat;

await loadChats();

loadMessages();

selectedUserId =
null;

}

if(!activeChatId){

alert("Select Chat");

return;

}

try{

console.log(
"visibilityType:",
window.visibilityType
);

console.log(
"visibleTo:",
window.visibleTo
);

/* ===========================
   SCHEDULED MESSAGE
=========================== */

if(scheduledMessage){

const scheduledFor =
new Date(

`${scheduledMessage.date}T${scheduledMessage.time}`

);

let response;

if(editingScheduledId){

response =
await fetch(

`/api/scheduled/${editingScheduledId}`,

{

method:"PUT",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

text,

scheduledFor,

visibilityType:
window.visibilityType || "all",

visibleTo:
window.visibleTo || []

})

}

);

}
else{

response =
await fetch(

"/api/scheduled/schedule",

{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

chatId:activeChatId,

senderId:USER_ID,

text,

visibilityType:
window.visibilityType || "all",

visibleTo:
window.visibleTo || [],

scheduledFor

})

}

);

}

if(response.ok){

messageInput.value="";

scheduledMessage=null;

editingScheduledId=null;

scheduleDate.value="";

scheduleTime.value="";

scheduleBtn.textContent="⏰";

scheduleBtn.classList.remove("scheduled");

updateScheduleIcon();

loadScheduledMessages();

}

return;

}

/* ===========================
   NORMAL MESSAGE
=========================== */

const response =
await fetch(

"/api/chat/send-message",

{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

chatId:activeChatId,

senderId:USER_ID,

text,

visibilityType:
window.visibilityType || "all",

visibleTo:
window.visibleTo || []

})

}

);

if(response.ok){

socket.emit(

"send-message",

{

chatId:activeChatId,

sender:currentUser,

text

}

);

messageInput.value="";

loadMessages();

}

}
catch(error){

console.log(error);

}

}

/* Send Button */

sendBtn.addEventListener(

  "click",

  sendMessage

);

/* Enter Key */

messageInput
.addEventListener(

  "keydown",

  (e)=>{

    if(
      e.key ===
      "Enter"
    ){

      sendMessage();

    }

  }

);
document
.getElementById(
"deleteChatsBtn"
)
.addEventListener(
"click",
async()=>{

if(
selectedChats.length === 0
) return;

const confirmDelete =
confirm(
`Delete ${selectedChats.length} chats?`
);

if(
!confirmDelete
) return;

await fetch(

"/api/chat/hide-chats",

{

method:"PUT",

headers:{
"Content-Type":
"application/json"
},

body:JSON.stringify({

chatIds:
selectedChats,

userId:
USER_ID

})

}

);

selectedChats = [];
updateChatDeleteButton();
document
.querySelectorAll(
".selected-chat"
)
.forEach(
(chat)=>{

chat.classList.remove(
"selected-chat"
);

}
);
await loadChats();

loadChats();

}
);

/* Start */

loadChats();
if(window.innerWidth <= 768){

document.querySelector(".sidebar")
.style.display = "block";

document.querySelector(".chat-section")
.classList.remove("active");

}

chatSearch.addEventListener(
  "input",
  async ()=>{

    const text =
    chatSearch.value.trim();

    if(text.length < 2){

      searchResults.innerHTML =
      "";

      return;

    }

    try{

      const response =
      await fetch(

        `/api/auth/search/${text}`

      );

      const users =
      await response.json();

      searchResults.innerHTML =
      "";

      users.forEach(
        (user)=>{

          const div =
          document.createElement(
            "div"
          );

          div.className =
          "search-user";

          div.innerHTML =
          `
          <strong>
            ${user.username}
          </strong>

          <br>

          <small>
            ${user.email}
          </small>
          `;

          div.addEventListener(
            "click",
            ()=>{

              startPrivateChat(
                user
              );

            }
          );

          searchResults
          .appendChild(
            div
          );

        }
      );

    }
    catch(error){

      console.log(error);

    }

  }
);
async function startPrivateChat(user){

try{

selectedUserId = user._id;

activeChatId = null;

activeChat = null;

chatModal.style.display = "none";

chatName.textContent = user.username;
chatStatus.textContent = "Online";

chatWindow.innerHTML = "";

/* Hide Welcome Screen */
emptyChat.style.display = "none";
chatContent.style.display = "flex";
if(window.innerWidth <= 768){

document.querySelector(".sidebar")
.style.display = "none";

document.querySelector(".chat-section")
.classList.add("active");

}

}
catch(error){

console.log(error);

}

}
logoutBtn.addEventListener(
  "click",
  ()=>{

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "userId"
    );

    localStorage.removeItem(
      "username"
    );

    localStorage.removeItem(
      "email"
    );

    window.location =
    "login.html";

  }
);
document
.getElementById(
"closeThread"
)
.addEventListener(
"click",
()=>{

document
.getElementById(
"threadPanel"
)
.style.right =
"-400px";

}
);

function
toggleMessageSelection(
element,
messageId
){

if(
selectedMessages.includes(
messageId
)
){

selectedMessages =
selectedMessages.filter(
id =>
id !== messageId
);

element.classList.remove(
"selected-message"
);

}
else{

selectedMessages.push(
messageId
);

element.classList.add(
"selected-message"
);

}

updateDeleteButton();

}
function
updateDeleteButton(){

const btn =
document.getElementById(
"deleteMessagesBtn"
);

if(
selectedMessages.length
> 0
){

btn.style.display =
"block";

btn.textContent =
`Delete (${selectedMessages.length})`;

}
else{

btn.style.display =
"none";

selectionMode =
false;

}

}
function toggleChatSelection(
element,
chatId
){

if(
selectedChats.includes(
chatId
)
){

selectedChats =
selectedChats.filter(
id => id !== chatId
);

element.classList.remove(
"selected-chat"
);

}
else{

selectedChats.push(
chatId
);

element.classList.add(
"selected-chat"
);

}

updateChatDeleteButton();

}
function updateChatDeleteButton(){

const btn =
document.getElementById(
"deleteChatsBtn"
);

if(
selectedChats.length > 0
){

btn.style.display =
"block";

btn.textContent =
`🗑 Delete (${selectedChats.length})`;

}
else{

btn.style.display =
"none";

chatSelectionMode =
false;

}

}