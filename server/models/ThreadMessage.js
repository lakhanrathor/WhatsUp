const mongoose =
require("mongoose");

const threadMessageSchema =
new mongoose.Schema({

threadId:{
type:
mongoose.Schema.Types.ObjectId,
ref:"Thread",
required:true
},

senderId:{
type:
mongoose.Schema.Types.ObjectId,
ref:"User",
required:true
},

text:{
type:String,
required:true
},

createdAt:{
type:Date,
default:Date.now
}

});

module.exports =
mongoose.model(
"ThreadMessage",
threadMessageSchema
);