const express =
require("express");

const Thread =
require("../models/Thread");

const ThreadMessage =
require("../models/ThreadMessage");

const router =
express.Router();

/* Create Thread */

router.post(
"/create",
async(req,res)=>{

try{

const {
parentMessage,
parentChat,
participants
} = req.body;

const thread =
new Thread({

parentMessage,
parentChat,
participants

});

await thread.save();

res.status(201)
.json(thread);

}
catch(error){

res.status(500)
.json({
error:error.message
});

}

}
);

/* Send Thread Message */

router.post(
"/send-message",
async(req,res)=>{

try{

const {
threadId,
senderId,
text
} = req.body;

const message =
new ThreadMessage({

threadId,
senderId,
text

});

await message.save();

res.status(201)
.json(message);

}
catch(error){

res.status(500)
.json({
error:error.message
});

}

}
);

/* Get Thread Messages */

router.get(
"/message/:messageId",
async(req,res)=>{

try{

const thread =
await Thread.findOne({

parentMessage:
req.params.messageId

});

res.json(
thread
);

}
catch(error){

res.status(500)
.json({
error:error.message
});

}

}
);

router.get(
"/messages/:threadId",
async(req,res)=>{

try{

const messages =
await ThreadMessage.find({

threadId:
req.params.threadId

})
.populate(
"senderId",
"username"
)
.sort({
createdAt:1
});

res.json(
messages
);

}
catch(error){

res.status(500)
.json({
error:error.message
});

}

}
);
router.get(
"/message/:messageId",
async(req,res)=>{

try{

const thread =
await Thread.findOne({

parentMessage:
req.params.messageId

});

res.json(
thread
);

}
catch(error){

res.status(500)
.json({
error:error.message
});

}

}
);

module.exports =
router;