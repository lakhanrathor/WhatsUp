const mongoose =
require("mongoose");

const chatSchema =
new mongoose.Schema({

  type:{
    type:String,
    enum:[
      "private",
      "group"
    ],
    required:true
  },

  name:{
    type:String,
    required:true
  },

  members:[
{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
}
],
activeMembers:[
{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
}
],
removedMembers:[
{
user:{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
},

removedAt:{
type:Date,
default:Date.now
}
}
],

admin:{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
},

hiddenFor:[
{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
}
],

/* Messaging Permission */

messagingPermission:{

mode:{
type:String,
enum:[
"everyone",
"admins",
"only",
"except"
],
default:"everyone"
},

allowedMembers:[
{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
}
],

blockedMembers:[
{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
}
]

},

createdAt:{
type:Date,
default:Date.now
}
});

module.exports =
mongoose.model(
  "Chat",
  chatSchema
);