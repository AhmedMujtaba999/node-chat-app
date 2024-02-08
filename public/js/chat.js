const socket = io()

//elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $locationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

//templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    //new message element
    const $newMessage = $messages.lastElementChild

    //height of the new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //visible height
    const visibleHeight = $messages.offsetHeight

    //total height of message container
    const containerHeight = $messages.scrollHeight

    //how far have i scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {

    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:m a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message) => {
    console.log(location);
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.text,
        createdAt: moment(message.createdAt).format('h:m a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html;
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    //disable 
    $messageFormButton.setAttribute('disabled', 'disabled')
    const message = document.querySelector('input').value;

    socket.emit('sendMessage', message, (error) => {
        $messageFormInput.value = '';
        $messageFormInput.focus();
        //enable
        $messageFormButton.removeAttribute('disabled')
        if (error) {
            return console.log(error);
        }
    })
});

$locationButton.addEventListener('click', () => {
    $locationButton.setAttribute('disabled', 'disabled');

    if (!navigator.geolocation) {
        return alert('geolocation is not supported in your browser');
    }
    $locationButton.setAttribute('disabled', 'disabled');
    navigator.geolocation.getCurrentPosition((positon) => {

        socket.emit('sendLocation', {
            latitude: positon.coords.latitude,
            longitude: positon.coords.longitude
        }, () => {
            $locationButton.removeAttribute('disabled')
        })
    })

})

socket.emit('join', { username, room }, (error) => {

    if (error) {
        alert(error)
        location.href = '/'
    }
})