import io from 'socket.io-client';

import * as random from 'lib0/random';


//const ENDPOINT = process.env.production === 'BUILD' ? 'localhost:5000' : 'https://tech-interview-server.herokuapp.com/' 


const socket = io('https://tech-interview-server.herokuapp.com/');
//const socket = io('localhost:5000');



export const usercolors = [
    { color: '#212f45', light: '#212f4533' },
    { color: '#006466', light: '#00646633' },
    { color: '#4d194d', light: '#4d194d33' },
    { color: '#3a5311', light: '#3a531133' },
    { color: '#43291f', light: '#43291f33' },
]

// select a random color for this user
export const userColor = usercolors[random.uint32() % usercolors.length]


export default socket;