import React, { useRef, useEffect } from 'react';
import SimplePeer from 'simple-peer';

const Sender = ({ peer }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    navigator.mediaDevices.getDisplayMedia({ video: true }).then(stream => {
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = function(e) {
        const chunk = e.data;

        const reader = new FileReader();
        reader.onloadend = function() {
          const arrayBuffer = reader.result;

          // Send the ArrayBuffer as part of a message object
          peer.send(JSON.stringify({
            type: 'video',
            data: arrayBuffer
          }));
        }

        reader.readAsArrayBuffer(chunk);
      }

      mediaRecorder.start(1000);
    }).catch(err => {
      console.error("Error capturing screen: " + err);
    });

    // Clean up when component unmounts
    return () => {
      peer.destroy();
    }
  }, [peer]);

  const handlePlay = () => {
    peer.send(JSON.stringify({ type: 'state', value: 'play' }));
  }

  const handlePause = () => {
    peer.send(JSON.stringify({ type: 'state', value: 'pause' }));
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      peer.send(JSON.stringify({ type: 'seek', value: videoRef.current.currentTime }));
    }
  }

  return (
    <video ref={videoRef} controls onPlay={handlePlay} onPause={handlePause} onTimeUpdate={handleTimeUpdate} />
  );
};

export default Sender;
