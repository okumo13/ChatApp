const socket= io()
//Elements
const $messageForm= document.querySelector('#message-form')
const $messageFormInput= $messageForm.querySelector('input')
const $messageFormButton= $messageForm.querySelector('button')
const $sendLocationButton= document.querySelector('#send-location')
const $messages= document.querySelector('#messages')
const $locationMessages= document.querySelector('#locationMessages')


//Templates
const messageTemplate= document.querySelector('#message-template').innerHTML
const locationTemplate= document.querySelector('#location-template').innerHTML
const sidebarTemplate= document.querySelector('#sidebar-template').innerHTML

//Options
const {username, room}= Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll= ()=>{
    //New message elemtn
    const $newMessage= $messages.lastElementChild

    //Height of the new message
    const newMessageStyles= getComputedStyle($newMessage)
    const newMessageMargin= parseInt(newMessageStyles.marginBottom)
    const newMessageHeight=    $newMessage.offsetHeight + newMessageMargin
    
    //Visible height
    const visibleHeight= $messages.offsetHeight

    //Height of message container
    const containerHeight= $messages.scrollHeight

    //How far have I scrolled?

    const scrollOffset= $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight<=scrollOffset){
         $messages.scrollTop= $messages.scrollHeight
    }
}

socket.on('message', (msg)=>{
    console.log(msg)
    const html= Mustache.render(messageTemplate, {
        username: msg.username,
        msg: msg.text,
        createdAt: moment(msg.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({room, users})=>{
    const html= Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML= html
})

socket.on('locationMessage', (message)=>{
    console.log(message)
    const html=Mustache.render(locationTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
})

$messageForm.addEventListener('submit', (e)=>{
    e.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')

    const message= e.target.elements.message.value

    socket.emit('sendMessage', message, (error)=>{
       $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value=''
        $messageFormInput.focus()
        if(error){
            return console.log(error)
        }

        console.log('Message was delivered!')
    })
})



$sendLocationButton.addEventListener('click', ()=>{
    if(!navigator.geolocation){
        return alert('Geolocation is not compatible with your browser')
    }
    $sendLocationButton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position)=>{
        $sendLocationButton.removeAttribute('disabled')
        socket.emit('sendLocation', {
            
            latitude: position.coords.latitude, 
            longitude: position.coords.longitude

        }, (error)=>{
            
            if(error){
                return console.log(error)}

            console.log('Location was delivered!')
        })
        /* const sendLatitude= position.coords.latitude
        const sendLongitude= position.coords.longitude
        socket.emit('sendLatitude', sendLatitude)
        socket.emit('sendLongitude', sendLongitude) */
    })
})
socket.emit('join', {username, room}, (error)=>{
    if(error){
        alert(error)
        location.href= '/'
    }

})

