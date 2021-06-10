const socket = io('/');

let announcementPart = document.getElementById('announ');




socket.on('soldEvent', (event) => {
    let para = document.createElement('p');
    para.innerHTML = `${event.name} sold with price ${event.price} on our website recently`
    announcementPart.append(para);
});