import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useSelector, useDispatch } from 'react-redux';
import { setName } from '../redux/features/pcs/userSlice';
import socket from "../webrtc/socket";

export default function JoinRoomView (props) {
  const [inputRoom, setInputRoom] = useState('');
  const username = useSelector(state => state.user.value);
  const dispatch = useDispatch();

  const handleRoomInput = (e) => {
    e.preventDefault();
    setInputRoom(e.target.value)
  }

  const handleUserInput = (e) => {
    e.preventDefault();
    dispatch(setName(e.target.value));
  }

  const handleRoom = () => {
    let roomId = inputRoom.trim();
    if (roomId.length === 0){
      roomId = uuidv4();
      console.log(roomId);
    }
    socket.emit("joinRoom", roomId);

    socket.on("roomAvailable", (roomId) => {
      navigate('/room/'+roomId);
    })
  }

  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col items-center justify-center space-y-8">
      <div className="flex flex-col items-center justify-center w-full px-5 lg:px-0 md:px-9 space-y-2">
        <input 
          id="roomId" 
          type="text" 
          value={inputRoom} 
          onChange={handleRoomInput} 
          className="
            h-9 
            px-1.5 
            rounded-none
            border-vt-burnt-orange 
            border-2
            focus:outline-none 
            focus:border-vt-burnt-orange-web 
            lg:w-1/3 
            w-full
          "
          placeholder="room-id here, we will generate a random string if empty"
        />
        <input 
          id="roomId" 
          type="text" 
          value={username} 
          onChange={handleUserInput} 
          className="
            h-9 
            px-1.5 
            rounded-none
            border-vt-burnt-orange 
            border-2
            focus:outline-none 
            focus:border-vt-burnt-orange-web 
            lg:w-1/3 
            w-full
          "
          placeholder="Username here, required"
        />
      </div>
      <div className="flex flex-row justify-center w-auto">
        <button 
          className="bg-vt-maroon enabled:hover:brightness-125 disabled:bg-vt-grey p-2.5 text-vt-white font-medium"
          disabled={username.trim() === ''}
          onClick={handleRoom}
        >
          Join or Create Room
        </button>
      </div>
    </div>
  )
}

//833 shrinked