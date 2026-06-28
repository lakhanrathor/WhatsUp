const ScheduledMessage =
require("../models/ScheduledMessage");

const Message =
require("../models/Message");

async function processScheduledMessages(io){

try{

const now = new Date();

const messages =
await ScheduledMessage.find({

status:"scheduled",

scheduledFor:{
$lte:now
}

});

for(const scheduled of messages){

const message =
new Message({

chatId:scheduled.chatId,

senderId:scheduled.senderId,

text:scheduled.text,

visibilityType:scheduled.visibilityType,

visibleTo:scheduled.visibleTo,

createdAt:new Date()

});

await message.save();

scheduled.status="sent";

await scheduled.save();

/* Notify Users */

io.to(
scheduled.chatId.toString()
).emit(

"receive-message",

{

chatId:
scheduled.chatId.toString(),

senderId:
scheduled.senderId,

text:
scheduled.text

}

);

}

}
catch(error){

console.log(

"Scheduled Worker Error:",

error

);

}

}

module.exports =
processScheduledMessages;