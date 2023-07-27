import  {useEffect, useState, useRef} from 'react';
import { useLoaderData, useNavigate } from "react-router-dom";
import { BsFillVolumeMuteFill, BsFillVolumeUpFill, BsCameraVideoFill, BsCameraVideoOffFill} from 'react-icons/bs';
import socket from '../webrtc/socket';
//import Peer from 'simple-peer';
import { useSelector, useDispatch } from 'react-redux';
import { setColor, setName } from '../redux/features/pcs/userSlice';
import Peer from "simple-peer"
import { Editor } from './Editor';
import TimeStamps from './TimeStamps';


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
  const [started, setStarted] = useState(false);

  const mediaRecorderRef = useRef(null);
  const [replay, setReplay] = useState(false);
  const [recording, setRecording] = useState(false);

  const [recordedBlob, setRecordedBlob] = useState([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [recorder, setRecorder] = useState(false);
  const timerRef = useRef(null);
  const idRef = useRef(null)


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

				//Interviewer created room
        socket.on("created", (data) => {
          console.log("created room " + data.roomId);
          idRef.current = data.role;
          setReady(true);
          setRecorder(true);
        });

				//Interviewee joined room
        socket.on("joined", (data) => {
          const peer = call(data.partner, socket.id, currentStream);
          peerRef.current = peer;
          idRef.current = data.role;
          setPeer(peer);

          setReady(true);
        });

				//Interviewer received a call
        socket.on('received a call', (data) => {
          console.log("received a call from "+ data.callerId);
          const peer = answer(data.callerId, data.callerSig, currentStream);
          peerRef.current = peer;
					//COPY THIS TO CONNECTION  SET!
          setPeer(peer);
          socket.emit("request editor")
        });

				//Interviewee's call answered
        socket.on("call answered", (data) => {
          const peerObj = peerRef.current; 
          peerObj.signal(data.receiverSig);
          socket.emit("request code", roomId);
					socket.emit("request replay", roomId);
          socket.emit("request editor")
					console.log("call answered")
					peerRef.current.on('error', (err) => console.error('Peer error:', err));
					//console.log('what up')
          let chunks = []

					peerRef.current.on('data', async (d)=>{
            console.log(d)
            if (new TextDecoder().decode(d) === "END_OF_DATA") {
              console.log('end');
              let b = new Blob(chunks, { type: 'video/webm;codecs=vp8' }); 
              let sizeInBytes = b.size;
              const ab = await b.arrayBuffer();
              console.log(ab);
              console.log('Blob type: ' + b.type)
              console.log('Blob size: ' + sizeInBytes + ' bytes');
              const url = (window.URL||window.webkitURL).createObjectURL(b);
              setVideoUrl(url);
              //saveAs(b, 'recording.mp4');
              setReplay(true);
            } else {
                chunks.push(d);
            }

					})

          socket.on("replay ended", ()=>{
            setReplay(false)
          })

          
        });

				//Stream ended hang up
        socket.on("stream end", (data) => {
          peerRef.current = null; 
          peerVideo.current = null;
          setPeer(null);
          console.log('hang up');
        });

				//replay event start 
				socket.on('ready for replay', (data) => {
          /*
          const mediaRecorder = new MediaRecorder(currentStream);
          mediaRecorderRef.current = mediaRecorder;
          

          let chunk = []
          mediaRecorder.onstart = () => {
            setRecording(true);
          }

          console.log(peerRef.current)
          peerRef.current.on('error', (d)=>{
            console.log(d);
          })
          
          mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              chunk.push(e.data);
            }
          };

          mediaRecorder.onstop = (e) => {
            const blob = new Blob(chunk, {type: 'video/webm;codecs=vp8'});
            let sizeInBytes = blob.size;
            console.log('Blob size: ' + sizeInBytes + ' bytes');
            console.log(blob);
            //const url = window.URL.createObjectURL(blob);
            //setVideoUrl(url);

            const newRecordedBlob = recordedBlob;
            newRecordedBlob.push({time:Date.now()-timeOpened, blob:blob});
            setRecordedBlob(newRecordedBlob);
            setRecording(false);
            
            chunk = [];

          }*/
          
          //setRecorder(true);
          
          
					navigator.mediaDevices.getDisplayMedia({video:{width:640, height:480}, audio: true, preferCurrentTab:true, mimeType: "video/webm;codecs=vp8", })
            .then((screenStream) => {
              //notes for myself
              //Create new audio context
              const audioCtx = new AudioContext();
              //Add sources of audios
              const source1 = audioCtx.createMediaStreamSource(screenStream);
              const source2 = audioCtx.createMediaStreamSource(currentStream);
              const destination = audioCtx.createMediaStreamDestination();
              //Connect sources to the new combined context
              source1.connect(destination);
              source2.connect(destination);
              //Create combined stream
              const outputStream= new MediaStream();
              outputStream.addTrack(screenStream.getVideoTracks()[0]);
              outputStream.addTrack(destination.stream.getAudioTracks()[0]);  
              //let combined = new MediaStream([...screenStream.getTracks(), userMediaStream.getTracks().find(x => x.kind === 'audio')]);

              const mediaRecorder = new MediaRecorder(outputStream);
              mediaRecorderRef.current = mediaRecorder;
              

              let chunk = []
              mediaRecorder.onstart = () => {
                setRecording(true);
              }

							console.log(peerRef.current)
							peerRef.current.on('error', (d)=>{
								console.log(d);
							})
							
              mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                  chunk.push(e.data);
                }
              };

              mediaRecorder.onstop = (e) => {
                const blob = new Blob(chunk, {type: 'video/webm;codecs=vp8'});
                let sizeInBytes = blob.size;
                console.log('Blob size: ' + sizeInBytes + ' bytes');
                console.log(blob);
                //const url = window.URL.createObjectURL(blob);
                //setVideoUrl(url);

                const newRecordedBlob = recordedBlob;
                newRecordedBlob.push({time:Date.now()-timerRef.current, blob:blob});
                setRecordedBlob(newRecordedBlob);
                setRecording(false);
                
                chunk = [];

              }
							
              setRecorder(true);
            })
            .catch(e => {
              console.log(e)
            })
          
				})
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

	const handleStop = () => {
    mediaRecorderRef.current.stop();
  }

  const handleRecord = () => {
    setReplay(false);
    mediaRecorderRef.current.start();
    if (!started){
      timerRef.current = Date.now();
      setStarted(true);
    }
  }
  /*
  const handleReplay = (blob) => {
    setReplay(true);
    setVideoUrl(blob.url);
    console.log(blob)
		socket.emit("hit replay", blob);
  }
  */

  const handlePlay = async (blob) => {
    setReplay(true);
    const url = (window.URL||window.webkitURL).createObjectURL(blob.blob);
    setVideoUrl(url);
    const bf = await blob.blob.arrayBuffer()
    console.log(bf)
    console.log('Blob type: ' + blob.blob.type)
    //saveAs(blob.blob, 'recorder_recording.mp4');
    
    let reader = new FileReader();

    reader.onloadend = function () {
      let arrayBuffer = this.result;
      let chunkSize = 16 * 1024; // 16 KiB
      let start = 0;

      function sendNextChunk() {
        console.log(arrayBuffer.byteLength)
          if (start < arrayBuffer.byteLength) {

              console.log(start)
              let end = Math.min(start + chunkSize, arrayBuffer.byteLength);
              let chunk = arrayBuffer.slice(start, end);

              peerRef.current.send(chunk); // `peer` is your SimplePeer instance
              start = end;

              console.log(end)
              // Give the browser a chance to handle other events
              setTimeout(sendNextChunk, 0);
          } else {
              // All chunks have been sent
              console.log("EOD SENT? ")
              peerRef.current.send("END_OF_DATA"); // Send a special "end of data" message
          }
      }

      sendNextChunk(); // Start sending chunks
    }
    /*
    reader.onloadend = function() {
        let arrayBuffer = this.result;
        peerRef.current.send(arrayBuffer);
    };
    */
    console.log(blob.blob.size)
    reader.readAsArrayBuffer(blob.blob);
  }

  const handleTimeStamp = () => {
    handleStop();

    handleRecord();
  }

	const handleStopReplay = () => {
		setReplay(false);
		setVideoUrl(null)
		socket.emit("end replay");
	}

  const handleTerminate = () => {
    setStarted(false);
    mediaRecorderRef.current.stop();
  }

  return (
    <div className='flex flex-col h-full'>
      <div className='flex flex-row items-center justify-between h-auto p-4 text-5xl border-b-2 border-vt-burnt-orange z-0'>Room: {roomId}</div>
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
            <TimeStamps recordedBlob={recordedBlob} handlePlay={handlePlay}/>
						
          </div>
        </div>
        <div className="bg-vt-white w-4/5 flex flex-row h-full overflow-hidden" >
          <div className="w-1/2" >
            {ready? <Editor id={idRef.current}/>: <div>Getting connection</div>}
          </div>
          <div className='w-1/2 flex flex-col gap-5 p-5'>
            <div className='flex flex-col items-start gap-3'> 

              {recorder &&
                <div className='flex flex-wrap flex-row items-start gap-2'>
                  <button 
                    className='bg-vt-maroon text-vt-white p-1 enabled:hover:brightness-125 disabled:bg-vt-grey '
                    disabled={recording}
                    onClick={()=>handleRecord()}
                  >
                    Record
                  </button>
                  <button 
                    className='bg-vt-maroon text-vt-white p-1 enabled:hover:brightness-125 disabled:bg-vt-grey ' 
                    disabled={!started}
                    onClick={()=>handleTimeStamp()}
                  >
                    Add stamp
                  </button>
                  <button 
                    className='bg-vt-maroon text-vt-white p-1 enabled:hover:brightness-125 disabled:bg-vt-grey ' 
                    disabled={!replay}
                    onClick={()=>handleStopReplay()}
                  >
                    Stop Replaying
                  </button>
                  <button 
                    className='bg-vt-maroon text-vt-white p-1 enabled:hover:brightness-125 disabled:bg-vt-grey ' 
                    disabled={!started}
                    onClick={()=>handleTerminate()}
                  >
                    Stop Recording
                  </button>
                </div>
              }
							{!replay ? <div>no</div> : <video autoPlay controls src={videoUrl}></video> }
            </div>

          </div>
          
        </div>
      </div>
    </div>
    
  );
}

//{ready? <CodeEditor roomId={roomId} /> : <div>Getting connection</div>}