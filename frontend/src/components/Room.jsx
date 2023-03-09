import  {useEffect, useState, useRef} from 'react';
import { useLoaderData, useNavigate } from "react-router-dom";
import { BsFillVolumeMuteFill, BsFillVolumeUpFill, BsCameraVideoFill, BsCameraVideoOffFill} from 'react-icons/bs';
import CodeEditor from './CodeEditor';
import socket from '../webrtc/socket';
import Peer from 'simple-peer';
import { useSelector, useDispatch } from 'react-redux';
import { setColor, setName } from '../redux/features/pcs/userSlice';


export function roomLoader({ params }) {
  const roomId = params.roomId;
  return roomId;
}

function PartyVideo (props) {

  return (
    <div className="w-full shadow-lg p-2 bg-vt-grey">
      { props.videoRef !== null? 
        <video autoPlay playsInline ref={props.videoRef} className="scale-x-mirror w-full aspect-video object-cover "></video>
        :
        <div className='className="scale-x-mirror w-full aspect-video object-cover'>
          Loading video
        </div>
      }
      <div>Other | <span >{props.username}</span></div>
    </div>
  )
}

export default function Room (props) {
  const roomId = useLoaderData();
  const [localStream, setLocalStream] = useState(null);
  const [mute, setMute] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const myVideo = useRef();
  const [peer, setPeer] = useState(null);
  const peerRef = useRef(null);
  const peerVideo = useRef(null);
  const [ready, setReady] = useState(false);
  const username = useSelector(state => state.user.value);
  const dispatch = useDispatch();
  const userColor = useSelector(state => state.user.color);

  const navigate = useNavigate();

  useEffect(()=>{
    if (username === ''){
      dispatch(setName('user'))
    }
    navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: true })
      .then((currentStream) => {
        dispatch(setColor([userColor.color, userColor.lightColor]))

        setLocalStream(currentStream);
        myVideo.current.srcObject = currentStream;

        socket.emit("request room", roomId);

        socket.on("room full", () => {
          console.log('full');
          navigate("/");
        })

        socket.on("created", (data) => {
          console.log("created room " + data.roomId);
          setReady(true);
        });
      
        socket.on("joined", (data) => {
          const peer = call(data.partner, socket.id, currentStream);
          peerRef.current = peer;
          setPeer(peer);
        });

        socket.on('received a call', (data) => {
          console.log("received a call from "+ data.callerId);
          const peer = answer(data.callerId, data.callerSig, currentStream);
          peerRef.current = peer;
          setPeer(peer);
        });

        socket.on("call answered", (data) => {
          const peerObj = peerRef.current; 
          peerObj.signal(data.receiverSig);
          socket.emit("request code", roomId);
          setReady(true);
        });

        socket.on("stream end", (data) => {
          peerRef.current = null; 
          peerVideo.current = null;
          setPeer(null);
          console.log('hang up');
        });
      })
      .catch((e) => {
        console.log(e);
      });
  }, [roomId]);

  const call = (receiverId, fromId, s) => {
    const caller = new Peer({
      initiator: true,
      trickle: false,
      stream: s,
    });

    caller.on('signal', (data) => {
      socket.emit('made a call', {receiverId: receiverId, callerSig: data, fromId: fromId});
    });

    caller.on('stream', (stream) => {
      peerVideo.current.srcObject = stream;
    })

    return caller;
  }

  const answer = (callerId, callerSig, s, codeInput) => {
    const receiver = new Peer({
      initiator: false, 
      trickle: false,
      stream: s,
    });

    receiver.on('signal', (data) => {
      console.log('Signaled from ' + callerId);
      socket.emit('answered a call', {callerId: callerId, receiverSig: data, code: codeInput});
    });

    receiver.on('stream', (stream) => {
      peerVideo.current.srcObject = stream;
    })

    receiver.signal(callerSig);
    return receiver;
  }

  const clickedMute = () => {
    if (mute) {
      localStream.getAudioTracks()[0].enabled = true;

    }
    else {
      localStream.getAudioTracks()[0].enabled = false;
    }
    setMute(!mute);
  }

  const clickedVideoOff = () => {
    if (videoOff) {
      localStream.getVideoTracks()[0].enabled = true;
      console.log('video on');
    }
    else {
      localStream.getVideoTracks()[0].enabled = false;
      console.log('video off');
    }
    
    setVideoOff(!videoOff);
  }

  return (
    <div className='flex flex-col h-full'>
      <div className='flex flex-row items-center justify-between h-auto p-4 text-5xl border-b-2 border-vt-burnt-orange'>Room: {roomId}</div>
      <div className="flex space-x-0 flex-row flex-1 min-w-full h-full overflow-hidden">
        <div className="w-1/5 p-4 border-r-2">
          <div className="w-full flex flex-col space-y-9">
            <div className="w-full flex flex-col shadow-lg p-2 bg-vt-grey space-y-2.5">
              <video autoPlay playsInline ref={myVideo} muted className="scale-x-mirror w-full aspect-video object-cover "></video>
              <div className="flex flex-row justify-between">
                <div className='overflow-hidden'>Me | <span>{username}</span></div>
                <div className='flex flex-row items-center space-x-1'>
                  <button onClick={clickedVideoOff} className="text-md">
                    {videoOff ? 
                      <BsCameraVideoOffFill /> : 
                      <BsCameraVideoFill />
                    }
                  </button>
                  <button onClick={clickedMute} className="text-lg">
                    {mute ? 
                      <BsFillVolumeMuteFill /> : 
                      <BsFillVolumeUpFill />
                    }
                  </button>
                </div>
              </div>
            </div>
            {peer !== null && <PartyVideo videoRef={peerVideo} username={username}/>}
          </div>
        </div>
        <div className="bg-vt-white w-4/5 flex flex-row h-full overflow-hidden" >
          <div className="w-1/2" >
            {ready? <CodeEditor roomId={roomId} /> : <div>Getting connection</div>}
          </div>
          <div className='w-1/2 flex flex-row items-center justify-center'>
            {socket.id}
          </div>
        </div>
      </div>
    </div>
    
  );
}