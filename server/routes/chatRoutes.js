const express =
require("express");

const router =
express.Router();

const Chat =
require("../models/Chat");

const Message =
require("../models/Message");
/* Create Chat */

router.post(
"/create-chat",
async(req,res)=>{

try{

const{
type,
name,
members
}=req.body;

const chat=
new Chat({

type,

name,

members,

activeMembers:members

});

await chat.save();

const createdChat=
await Chat.findById(chat._id)
.populate(
"members",
"username email"
)
.populate(
"activeMembers",
"username email"
)
.populate(
"admin",
"username"
);

res.status(201)
.json(createdChat);

}
catch(error){

console.log(error);

res.status(500)
.json({
error:error.message
});

}

}
);
/* Create Private Chat */

router.post(
"/private-chat",
async(req,res)=>{

try{

const{
user1,
user2
}=req.body;

/* Check Existing Chat */

let chat=
await Chat.findOne({

type:"private",

members:{
$all:[
user1,
user2
]
}

})
.populate(
"members",
"username email"
)
.populate(
"activeMembers",
"username email"
)
.populate(
"admin",
"username"
);

if(chat){

chat.hiddenFor=
(chat.hiddenFor||[]).filter(

id=>

id.toString()!==user1.toString()

&&

id.toString()!==user2.toString()

);

await chat.save();

const updatedChat=
await Chat.findById(chat._id)
.populate(
"members",
"username email"
)
.populate(
"activeMembers",
"username email"
)
.populate(
"admin",
"username"
);

return res.json(updatedChat);

}

/* Create New Chat */

chat=
new Chat({

type:"private",

name:"Private Chat",

members:[
user1,
user2
],

activeMembers:[
user1,
user2
]

});

await chat.save();

const createdChat=
await Chat.findById(chat._id)
.populate(
"members",
"username email"
)
.populate(
"activeMembers",
"username email"
)
.populate(
"admin",
"username"
);

res.status(201)
.json(createdChat);

}
catch(error){

console.log(error);

res.status(500).json({
error:error.message
});

}

}
);
/* Send Message */

router.post(
"/send-message",
async(req,res)=>{

try{

const{
chatId,
senderId,
text,
visibilityType,
visibleTo
}=req.body;
/* Check Messaging Permission */

const currentChat =
await Chat.findById(chatId);

if(!currentChat){

return res.status(404).json({

message:"Group not found"

});

}

if(currentChat.type==="group"){

const permission =
currentChat.messagingPermission || {

mode:"everyone",

allowedMembers:[],

blockedMembers:[]

};

/* Everyone */

if(permission.mode==="everyone"){

// Allow

}

/* Only Admins */

else if(permission.mode==="admins"){

if(currentChat.admin.toString()!==senderId.toString()){

return res.status(403).json({

message:"Only admins can send messages."

});

}

}

/* Only Selected Members */

else if(permission.mode==="only"){

const allowed =

permission.allowedMembers.some(

id=>id.toString()===senderId.toString()

);

const isAdmin =

currentChat.admin.toString()===senderId.toString();

if(!allowed && !isAdmin){

return res.status(403).json({

message:"You are not allowed to send messages."

});

}

}

/* Everyone Except */

else if(permission.mode==="except"){

const blocked =

permission.blockedMembers.some(

id=>id.toString()===senderId.toString()

);

const isAdmin =

currentChat.admin.toString()===senderId.toString();

if(blocked && !isAdmin){

return res.status(403).json({

message:"You are blocked from sending messages."

});

}

}

}

const chat=
await Chat.findById(chatId);

if(!chat){

return res.status(404).json({
message:"Chat not found"
});

}

/* Check if sender is still an active member */

if(chat.type==="group"){

const allowed=
chat.activeMembers.some(

id=>

id.toString()===senderId.toString()

);

if(!allowed){

return res.status(403).json({

message:"You are no longer a participant in this group."

});

}

}

/* Create Message */

const message=
new Message({

chatId,

senderId,

text,

visibilityType,

visibleTo,

status: "sent"

});

await message.save();
chat.lastMessage = message._id;
await chat.save();

// Increase unread count for everyone except the sender
chat.members.forEach(member => {

    if(member.toString() !== senderId){

        const current =
        chat.unreadCounts.get(member.toString()) || 0;

        chat.unreadCounts.set(
            member.toString(),
            current + 1
        );

    }

});

chat.lastMessage = message._id;

chat.updatedAt = new Date();

await chat.save();

/* Restore hidden chat when new message arrives */

await Chat.updateOne(

{_id:chatId},

{

$set:{

hiddenFor:[]

}

}

);


/* Return populated message */

const createdMessage=
await Message.findById(message._id)
.populate(
"senderId",
"username"
);

return res.status(201)
.json(createdMessage);

}
catch(error){

console.log(error);

res.status(500).json({
error:error.message
});

}

}
);
/* Update Message Status */

router.put(
"/message-status",
async (req,res)=>{

try{

const { messageId, status } = req.body;

const message =
await Message.findByIdAndUpdate(

messageId,

{ status },

{ new:true }

).populate("senderId","username");

res.json(message);

}

catch(error){

console.log(error);

res.status(500).json({

error:error.message

});

}

});
/* Get Messages */

router.get(
"/messages/:chatId",
async(req,res)=>{

try{

const userId=
req.query.userId;

const chat=
await Chat.findById(
req.params.chatId
);

if(!chat){

return res.status(404).json({
message:"Chat not found"
});

}

const removed=
chat.removedMembers.find(

member=>

member.user.toString()===userId.toString()

);

const messages=
await Message.find({

chatId:req.params.chatId

})
.populate(
"senderId",
"username"
)
.sort({

updatedAt:-1

});

const filtered=
messages.filter(msg=>{

/* Hidden Message */

if(

msg.hiddenFor &&

msg.hiddenFor.some(

id=>

id.toString()===userId.toString()

)

){

return false;

}

/* Removed Member */

if(

removed &&

msg.createdAt>removed.removedAt

){

return false;

}

/* Public Message */

if(

!msg.visibilityType ||

msg.visibilityType==="all"

){

return true;

}

/* Sender Always Sees */

if(

msg.senderId &&

msg.senderId._id.toString()===userId.toString()

){

return true;

}

const visibleTo=
(msg.visibleTo||[]).map(
id=>id.toString()
);

/* Only Share With */

if(

msg.visibilityType==="only"

){

return visibleTo.includes(
userId.toString()
);

}

/* Everyone Except */

if(

msg.visibilityType==="except"

){

return !visibleTo.includes(
userId.toString()
);

}

return true;

});

res.json(filtered);

}
catch(error){

console.log(error);

res.status(500).json({
error:error.message
});

}

}
);
/* Get All Chats */

router.get(
"/all",
async(req,res)=>{

try{

const chats=
await Chat.find()

.populate(
"members",
"username email"
)

.populate(
"activeMembers",
"username email"
)

.populate(
"removedMembers.user",
"username email"
)

.populate(
"admin",
"username"

)

.sort({

updatedAt:-1

});

res.json(chats);

}
catch(error){

console.log(error);

res.status(500).json({

error:error.message

});

}

}
);
/* Get User Chats */

router.get(
"/user/:userId",
async(req,res)=>{

try{

const userId=req.params.userId;

const chats = await Chat.find({

$or:[

{
type:"private",
members:userId
},

{
type:"group",
$or:[
    {activeMembers:userId},
    {"removedMembers.user":userId}
]
}

],

hiddenFor:{
$ne:userId
}

})

.populate(
"members",
"username email"
)

.populate(
"activeMembers",
"username email"
)

.populate(
"removedMembers.user",
"username email"
)

.populate(
"admin",
"username"
)
.populate("lastMessage","text createdAt")

.sort({

createdAt:-1

});

const updatedChats = [];

for (const chatDoc of chats) {

    const chat = chatDoc.toObject();

    chat.unreadCounts =
    Object.fromEntries(
        chat.unreadCounts || []
    );
    const messages =
await Message.find({

    chatId: chat._id,

    hiddenFor:{
        $ne:userId
    }

})
.sort({

    createdAt:-1

});

chat.lastMessage = null;

for(const msg of messages){

    let visible = true;

    if(msg.visibilityType === "only"){

        const allowed =
        (msg.visibleTo || [])
        .map(id => id.toString());

        if(
            msg.senderId.toString() !== userId &&
            !allowed.includes(userId.toString())
        ){

            visible = false;

        }

    }

    else if(msg.visibilityType === "except"){

        const blocked =
        (msg.visibleTo || [])
        .map(id => id.toString());

        if(
            blocked.includes(userId.toString()) &&
            msg.senderId.toString() !== userId
        ){

            visible = false;

        }

    }

    if(visible){

        chat.lastMessage = msg;

        break;

    }

}
    updatedChats.push(chat);

}
res.json(updatedChats);

}
catch(error){

console.log(error);

res.status(500).json({

error:error.message

});

}

}
);
router.put(
"/read/:chatId/:userId",
async(req,res)=>{

try{

const { chatId, userId } = req.params;

const chat =
await Chat.findById(chatId);

if(!chat){

return res.status(404).json({
message:"Chat not found"
});

}

chat.unreadCounts.set(userId,0);

await chat.save();

res.json({
success:true
});

}
catch(error){

console.log(error);

res.status(500).json({
error:error.message
});

}

});
/* Create Group */

router.post(
"/group-chat",
async(req,res)=>{

try{

const{
name,
members,
admin
}=req.body;

const chat=
new Chat({

type:"group",

name,

members,

activeMembers:members,

removedMembers:[],

admin

});

await chat.save();

const createdChat=
await Chat.findById(chat._id)

.populate(
"members",
"username email"
)

.populate(
"activeMembers",
"username email"
)

.populate(
"removedMembers.user",
"username email"
)

.populate(
"admin",
"username"
);

res.status(201)
.json(createdChat);

}
catch(error){

console.log(error);

res.status(500).json({

error:error.message

});

}

}
);
/* Delete Messages */

router.delete(
"/messages",
async(req,res)=>{

try{

const{
messageIds
}=req.body;

await Message.deleteMany({

_id:{
$in:messageIds
}

});

res.json({
success:true
});

}
catch(error){

console.log(error);

res.status(500).json({
error:error.message
});

}

}
);
/* Delete Chats */

router.delete(
"/chats",
async(req,res)=>{

try{

const{
chatIds
}=req.body;

await Chat.deleteMany({

_id:{
$in:chatIds
}

});

await Message.deleteMany({

chatId:{
$in:chatIds
}

});

res.json({
success:true
});

}
catch(error){

console.log(error);

res.status(500).json({
error:error.message
});

}

}
);
/* Hide Chats */

router.put(
"/hide-chats",
async(req,res)=>{

try{

const{
chatIds,
userId
}=req.body;

await Chat.updateMany(

{

_id:{
$in:chatIds
}

},

{

$addToSet:{
hiddenFor:userId
}

}

);

await Message.updateMany(

{

chatId:{
$in:chatIds
}

},

{

$addToSet:{
hiddenFor:userId
}

}

);

res.json({
success:true
});

}
catch(error){

console.log(error);

res.status(500).json({
error:error.message
});

}

}
);
/* Hide Single Chat */

router.put(
"/hide-chat-for-user",
async(req,res)=>{

try{

const{
chatId,
userId
}=req.body;

await Chat.updateOne(

{

_id:chatId

},

{

$addToSet:{
hiddenFor:userId
}

}

);

await Message.updateMany(

{

chatId

},

{

$addToSet:{
hiddenFor:userId
}

}

);

res.json({
success:true
});

}
catch(error){

console.log(error);

res.status(500).json({
error:error.message
});

}

}
);
/* Rename Group */

router.put(
"/rename-group",
async(req,res)=>{

try{

const{
chatId,
name
}=req.body;

await Chat.findByIdAndUpdate(

chatId,

{
name
}

);

const chat=
await Chat.findById(chatId)

.populate(
"members",
"username email"
)

.populate(
"activeMembers",
"username email"
)

.populate(
"removedMembers.user",
"username email"
)

.populate(
"admin",
"username"
);

res.json(chat);

}
catch(error){

console.log(error);

res.status(500).json({
error:error.message
});

}

}
);

/* Update Messaging Permission */

router.put(
"/update-message-permission",
async(req,res)=>{

try{
    console.log("UPDATE MESSAGE PERMISSION");
console.log(req.body);

const{

chatId,
adminId,
mode,
members=[]

}=req.body;

/* Find Chat */

const chat=
await Chat.findById(chatId);

if(!chat){

return res.status(404).json({

message:"Group not found"

});

}

/* Verify Admin */

if(chat.admin.toString()!==adminId.toString()){

return res.status(403).json({

message:"Only admin can change messaging permissions."

});

}

/* Save Permission */

chat.messagingPermission.mode=mode;

if(mode==="only"){

chat.messagingPermission.allowedMembers=members;

chat.messagingPermission.blockedMembers=[];

}

else if(mode==="except"){

chat.messagingPermission.blockedMembers=members;

chat.messagingPermission.allowedMembers=[];

}

else{

chat.messagingPermission.allowedMembers=[];

chat.messagingPermission.blockedMembers=[];

}

await chat.save();

/* Return Updated Chat */

const updatedChat=
await Chat.findById(chatId)

.populate(
"members",
"username email"
)

.populate(
"admin",
"username email"
)

.populate(
"messagingPermission.allowedMembers",
"username email"
)

.populate(
"messagingPermission.blockedMembers",
"username email"
);

res.json(updatedChat);

}
catch(error){

console.log(error);

res.status(500).json({

error:error.message

});

}

}
);

/* Add Member */

router.put(
"/add-member",
async(req,res)=>{

try{

const{
chatId,
memberId,
adminId
}=req.body;

await Chat.updateOne(

{
_id:chatId
},

{

$addToSet:{

members:memberId,

activeMembers:memberId

},

$pull:{

removedMembers:{

user:memberId

}

}

}

);

const chat=
await Chat.findById(chatId)

.populate(
"members",
"username email"
)

.populate(
"activeMembers",
"username email"
)

.populate(
"removedMembers.user",
"username email"
)

.populate(
"admin",
"username"
);

res.json(chat);

}
catch(error){

console.log(error);

res.status(500).json({
error:error.message
});

}

}
);
/* Remove Member */

router.put(
"/remove-member",
async(req,res)=>{

try{

const{
chatId,
memberId,
adminId
}=req.body;


/* Find Group */

const chat=
await Chat.findById(chatId);


if(!chat){

return res.status(404).json({
message:"Group not found"
});

}

/* Check Admin */

if(chat.admin.toString()!==adminId.toString()){

return res.status(403).json({
message:"Only admin can remove members."
});

}

/* Admin cannot remove themselves */

if(chat.admin.toString()===memberId.toString()){

return res.status(400).json({
message:"Admin cannot remove themselves."
});

}

/* Already removed? */

const alreadyRemoved = chat.removedMembers.find(
    member => String(member.user) === String(memberId)
);

if(!alreadyRemoved){

chat.removedMembers.push({

user:memberId,

removedAt:new Date()

});

}

/* Remove from active members only */

chat.activeMembers=
chat.activeMembers.filter(

member=>

member.toString()!==memberId.toString()

);

await chat.save();

/* Return updated group */

const updatedChat=
await Chat.findById(chatId)

.populate(
"members",
"username email"
)

.populate(
"activeMembers",
"username email"
)

.populate(
"removedMembers.user",
"username email"
)

.populate(
"admin",
"username email"
);

res.status(200).json(updatedChat);

}
catch(error){

console.log(error);

res.status(500).json({
error:error.message
});

}

}
);
module.exports = router;