const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = express();

app.use(express.json());

// define schemas
const userSchema = new mongoose.Schema({
    username : String,
    password : String
})

const todoSchema = new mongoose.Schema({
    title : String,
    description : String
})

// define models
const Todo = mongoose.model('Todo',todoSchema);
const User = mongoose.model('Users',userSchema);

// connect to database

mongoose.connect("mongodb+srv://alkeshnikalje:nrRjp3okv4Q0od16@cluster0.md9wzl6.mongodb.net/Todos",{useNewUrlParser: true,useUnifiedTopology: true});


// secret and fucntion for authentication 
const secret = "ThisIsASecret";
const userAuth = (req,res,next)=>{
    const authHeader = req.headers.authorization;
    if(authHeader){
        const token = authHeader.split(' ')[1];
        jwt.verify(token,secret,(err,user)=>{
            if(err){
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        })
    }else{
        res.sendStatus(401);
    }
};

// user routes
app.post('/users/signup',async (req,res)=>{
    const  {username, password} = req.body;
    const user = await User.findOne({username});
    if(user){
        res.status(403).json({message : "User already exists"});
    }else{
        const newUser = new User({username,password});
        await newUser.save();
        const token = jwt.sign({username,password},secret, {expiresIn : '24h'});
        res.json({message : "user created successfully", token});
    }
})

app.post('/users/login',async(req,res)=>{
    const {username,password} = req.body;
    const user = await User.findOne({username,password});
    if(user){
        const token = jwt.sign({username,password},secret,{expiresIn : '24h'});
        res.json({message: "logged in successfully",token});
    }else{
        res.status(403).json({message: 'Invalid username or password'});
    }
})

app.post('/users/todos',userAuth, async(req,res)=>{
    const todo = new Todo(req.body);
    await todo.save();
    res.json({title : todo.title,description: todo.description,id: todo.id});
});


app.put('/users/todos/:todoId',userAuth,async(req,res)=>{
    const todo = await Todo.findByIdAndUpdate(req.params.todoId,req.body,{new : true});
    if(todo){
        res.json({message: "todo updated successfully"});
    }else{
        res.status(404).json({message: "todo not found"});
    }
});

app.get('/users/todos',userAuth, async(req,res)=>{
    const todos = await Todo.find({});
    res.json({todos});
})

app.delete('/users/todos/:todoId',userAuth,async(req,res)=>{
    const todoToBeDeleted = await Todo.findById(req.params.todoId);
    if(todoToBeDeleted){
        await todoToBeDeleted.deleteOne();
        res.json({message: "successfully deleted"});
    }else{
        res.status(404).json({message: "todo not found"});
    }
})


app.listen(3000,()=>{
    console.log('now listening on 3000');
})