const express = require("express");

const router = express.Router();

const ScheduledMessage =
require("../models/ScheduledMessage");

/* Schedule Message */

router.post(
"/schedule",
async(req,res)=>{

try{

const{

chatId,
senderId,
text,
visibilityType,
visibleTo,
scheduledFor

}=req.body;

if(!chatId ||
!senderId ||
!text ||
!scheduledFor){

return res.status(400).json({

message:"Missing required fields."

});

}

const scheduledMessage =
new ScheduledMessage({

chatId,

senderId,

text,

visibilityType:
visibilityType || "everyone",

visibleTo:
visibleTo || [],

scheduledFor,

status:"scheduled"

});

await scheduledMessage.save();

res.status(201).json({

message:"Message scheduled successfully.",

scheduledMessage

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

/* Get My Scheduled Messages */

router.get(
"/:userId",
async(req,res)=>{

try{

const messages =
await ScheduledMessage.find({

senderId:req.params.userId,

status:"scheduled"

})

.sort({

scheduledFor:1

})

.populate(

"chatId",

"name"

);

res.json(messages);

}
catch(error){

console.log(error);

res.status(500).json({

error:error.message

});

}

}
);


/* Cancel Scheduled Message */

router.delete(
"/:id",
async(req,res)=>{

try{

await ScheduledMessage.findByIdAndUpdate(

req.params.id,

{

status:"cancelled"

}

);

res.json({

message:"Cancelled"

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
/* Get Scheduled Messages of a Chat */

router.get(
"/chat/:chatId/:userId",
async(req,res)=>{

try{

const messages =
await ScheduledMessage.find({

chatId:req.params.chatId,

senderId:req.params.userId,

status:"scheduled"

});

res.json(messages);

}
catch(error){

console.log(error);

res.status(500).json({

error:error.message

});

}

}
);
/* Get Scheduled Messages of Current Chat */

router.get(
"/chat/:chatId/:userId",
async(req,res)=>{

try{

const messages =
await ScheduledMessage.find({

chatId:req.params.chatId,

senderId:req.params.userId,

status:"scheduled"

})
.sort({
scheduledFor:1
});

res.json(messages);

}
catch(error){

res.status(500).json({

message:error.message

});

}

}
);
/* Update Scheduled Message */

router.put(
"/:id",
async(req,res)=>{

try{

const {

text,

scheduledFor,

visibilityType,

visibleTo

}=req.body;

const updated =
await ScheduledMessage.findByIdAndUpdate(

req.params.id,

{

text,

scheduledFor,

visibilityType,

visibleTo

},

{

new:true

}

);

res.json(updated);

}
catch(error){

res.status(500).json({

message:error.message

});

}

}
);
/* Delete Scheduled Message */

router.delete(
"/:id",
async(req,res)=>{

try{

await ScheduledMessage.findByIdAndDelete(
req.params.id
);

res.json({

message:"Scheduled message deleted."

});

}
catch(error){

res.status(500).json({

message:error.message

});

}

}
);

module.exports = router;