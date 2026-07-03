console.log("Auth routes loaded");

const upload = require("../middleware/upload");

const express =
require("express");

const bcrypt =
require("bcryptjs");

const jwt =
require("jsonwebtoken");

const User =
require("../models/User");

const router =
express.Router();

/* Signup */

router.post(
"/signup",
async(req,res)=>{

try{

    const {
        username,
        email,
        password
    } = req.body;

    const userExists =
    await User.findOne({
        email
    });

    if(userExists){

        return res.status(400)
        .json({
            message:
            "User already exists"
        });

    }

    const hashedPassword =
    await bcrypt.hash(
        password,
        10
    );

    const user =
    new User({

        username,

        email,

        password:
        hashedPassword

    });

    await user.save();

    res.status(201)
    .json({
        message:
        "User Registered"
    });

}
catch(error){

    res.status(500)
    .json({
        error:error.message
    });

}

});

/* Login */

router.post(
"/login",
async(req,res)=>{

try{

    const {
        email,
        password
    } = req.body;

    const user =
    await User.findOne({
        email
    });

    if(!user){

        return res.status(400)
        .json({
            message:
            "User not found"
        });

    }

    const isMatch =
    await bcrypt.compare(
        password,
        user.password
    );

    if(!isMatch){

        return res.status(400)
        .json({
            message:
            "Wrong password"
        });

    }

    const token =
    jwt.sign(

        {
            id:user._id
        },

        process.env.JWT_SECRET,

        {
            expiresIn:"7d"
        }

    );

res.json({
    token,
    userId: user._id,
    username: user.username,
    email: user.email,
    profilePic: user.profilePic
});
}
catch(error){

    res.status(500)
    .json({
        error:error.message
    });

}

});
router.get(
"/users",
async(req,res)=>{

try{

const users =
await User.find();

res.json(users);

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
"/search/:name",
async(req,res)=>{

try{

const users =
await User.find({

username:{
$regex:req.params.name,
$options:"i"
}

})
.select(
"_id username email"
);

res.json(users);

}
catch(error){

res.status(500)
.json({
error:error.message
});

}

}
);
router.post(
    "/upload-profile",
    upload.single("profilePic"),
    async (req, res) => {

        try {

            console.log("BODY:", req.body);
            console.log("FILE:", req.file);

            const { userId } = req.body;

console.log("User ID:", userId);
console.log("Uploaded File:", req.file);

if (!req.file) {
    return res.status(400).json({
        success: false,
        error: "No file received."
    });
}

const user = await User.findByIdAndUpdate(

    userId,

    {
        profilePic: req.file.path
    },

    {
        new: true
    }

);

console.log("Updated User:", user);

            console.log("USER:", user);

            res.json({
                success: true,
                profilePic: user.profilePic
            });

        }
        catch (error) {

            console.log("UPLOAD ERROR:", error);

            res.status(500).json({
                error: error.message
            });

        }

    }
);

module.exports =
router;