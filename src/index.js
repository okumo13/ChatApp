 const path= require('path')
const http= require('http')
const express= require('express')
const socketio= require('socket.io')
const Filter= require('bad-words')
const {generateMessage, generateLocationMessage}= require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom}= require('./utils/users')

const app= express()
const server= http.createServer(app)
/* const io= socketio(server) */
const io= require('socket.io')(server)


const port= process.env.PORT || 3000
const publicDirectoryPath= path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

/* let count= 0 */
let msg= 'Welcome!'

io.on('connection', (socket)=>{
    console.log('New Websocket connection!')

    socket.on('join', (options, callback)=>{
        const {error, user}= addUser({id: socket.id, ...options})
        if(error){
            return callback(error)
        }
        socket.join(user.room)
        socket.emit('message', generateMessage('Admin Oscar', 'Bienvenido(a)!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin Oscar' , `${user.username} se ha conectado`))
    io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
    })    
    })

    socket.on('sendMessage', (message, callback)=>{
        const user= getUser(socket.id)
        const filter= new Filter()
        if(user !== undefined){
            if(filter.isProfane(message)){
                return callback('Profanity is not allowed')
            }
            io.to(user.room).emit('message', generateMessage(user.username, message))
        } else {
            io.emit('message', {
                username: 'Admin',
                text: 'Tu sesión a expirado, vuelve a iniciar sesión por favor'
            })
        }

        callback()
    })

    socket.on('disconnect', ()=>{
        const user= removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message', generateMessage('Admin Oscar', `${user.username} se ha desconectado`)) 
        io.to(user.room).emit('roomData',{
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        }
        
    })

    socket.on('sendLocation', (coords, callback)=>{
        const user= getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://www.google.com.pe/maps?q=${coords.latitude},${coords.longitude}`))
        /* io.emit('locationMessage', `https://www.google.com.pe/maps?q=${coords.latitude},${coords.longitude}`) */
        callback()
    }, )

    /* socket.on('sendLatitude', (sendLatitude)=>{
        io.emit('message', sendLatitude)
    })
    socket.on('sendLongitude', (sendLongitude)=>{
        io.emit('message', sendLongitude)
    }) */
})

server.listen(port, ()=>{
    console.log('Server is up running in port: '+port)
})  