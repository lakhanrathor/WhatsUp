const processScheduledMessages =
require(
"./workers/scheduledMessageWorker"
);

const http =
require("http");

const { Server } =
require("socket.io");

const express =
require("express");

const mongoose =
require("mongoose");

const cors =
require("cors");

const dotenv =
require("dotenv");

const path =
require("path");

const scheduledMessageRoutes =
require("./routes/scheduledMessageRoutes");

const authRoutes =
require("./routes/authRoutes");

const chatRoutes =
require("./routes/chatRoutes");

const threadRoutes =
require("./routes/threadRoutes");

dotenv.config();

const app =
express();

app.use(cors());

app.use(
express.json()
);
app.use(

"/api/scheduled",

scheduledMessageRoutes

);

app.use(
express.static(
path.join(
__dirname,
"../public"
)
)
);

app.use(
"/api/auth",
authRoutes
);

app.use(
"/api/chat",
chatRoutes
);

app.use(
"/api/thread",
threadRoutes
);

mongoose
.connect(
process.env.MONGO_URI
)
.then(
()=>{

console.log(
"MongoDB Connected"
);

}
)
.catch(
(err)=>{

console.log(
err
);

}
);

app.get(
"/",
(req,res)=>{

res.send(
"WhatsUp Backend Running"
);

}
);

const PORT =
process.env.PORT || 5000;

const server =
http.createServer(
app
);

const io =
new Server(
server,
{

cors:{
origin:"*"
}

}
);
setInterval(() => {

    processScheduledMessages(io);

}, 5000);

io.on(
"connection",
(socket)=>{
    socket.on(
"typing",
(data)=>{

socket.to(
data.chatId
).emit(
"user-typing",
{

username:data.username

}
);

});

socket.on(
"stop-typing",
(chatId)=>{

socket.to(chatId)
.emit(
"user-stop-typing"
);

});
socket.on(
"user-typing",
(data)=>{

typingIndicator.textContent =
`${data.username} is typing...`;

});

socket.on(
"user-stop-typing",
()=>{

typingIndicator.textContent =
"";

});

console.log(
"User Connected:",
socket.id
);

socket.on(
"join-chat",
(chatId)=>{

socket.join(
chatId
);

}
);

socket.on(
"send-message",
(data)=>{

io.to(
data.chatId
).emit(
"receive-message",
data
);

}
);

socket.on(
"disconnect",
()=>{

console.log(
"User Disconnected"
);

}
);

}
);

server.listen(
PORT,
()=>{

console.log(
`Server Running On Port ${PORT}`
);

}
);