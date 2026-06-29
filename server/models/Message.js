const mongoose =
require("mongoose");

const messageSchema =
new mongoose.Schema({

chatId:{
type:
mongoose.Schema.Types.ObjectId,
ref:"Chat",
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
status:{

    type:String,

    enum:["sent","delivered","read"],

    default:"sent"

},

visibilityType:{
type:String,
default:"all"
},

visibleTo:[
{
type:
mongoose.Schema.Types.ObjectId,
ref:"User"
}
],
hiddenFor:[
{
type:
mongoose.Schema.Types.ObjectId,
ref:"User"
}
],

createdAt:{
type:Date,
default:Date.now
}

});

module.exports =
mongoose.model(
"Message",
messageSchema
);