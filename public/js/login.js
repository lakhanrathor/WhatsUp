const loginBtn =
document.getElementById(
"loginBtn"
);

loginBtn.addEventListener(
"click",
async()=>{

const email =
document.getElementById(
"email"
).value;

const password =
document.getElementById(
"password"
).value;

const response =
await fetch(
"/api/auth/login",
{

method:"POST",

headers:{
"Content-Type":
"application/json"
},

body:JSON.stringify({

email,
password

})

}

);

const data =
await response.json();

if(
response.ok
){

localStorage.setItem(
"token",
data.token
);

localStorage.setItem(
"userId",
data.userId
);

localStorage.setItem(
"username",
data.username
);

localStorage.setItem(
"email",
data.email
);

window.location =
"index.html";

}
else{

alert(
data.message
);

}

}
);