const mongoose = require("mongoose");

const scheduledMessageSchema =
new mongoose.Schema({

chatId:{
type:mongoose.Schema.Types.ObjectId,
ref:"Chat",
required:true
},

senderId:{
type:mongoose.Schema.Types.ObjectId,
ref:"User",
required:true
},

text:{
type:String,
required:true
},

visibilityType:{
type:String,
enum:[
"all",
"only",
"except"
],
default:"all"
},

visibleTo:[
{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
}
],

scheduledFor:{
type:Date,
required:true
},

status:{
type:String,
enum:[
"scheduled",
"sent",
"cancelled"
],
default:"scheduled"
},

createdAt:{
type:Date,
default:Date.now
}

});

module.exports =
mongoose.model(
"ScheduledMessage",
scheduledMessageSchema
);