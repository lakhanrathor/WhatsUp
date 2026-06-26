const mongoose =
require("mongoose");

const threadSchema =
new mongoose.Schema({

parentMessage:{
type:
mongoose.Schema.Types.ObjectId,
ref:"Message"
},

parentChat:{
type:
mongoose.Schema.Types.ObjectId,
ref:"Chat"
},

participants:[
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
"Thread",
threadSchema
);