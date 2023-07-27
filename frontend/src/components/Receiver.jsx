import React, { useRef, useEffect, useState } from 'react';
import SimplePeer from 'simple-peer';

const Receiver = ({ peer }) => {
  const videoRef = useRef(null);
  const [videoData, setVideoData] = useState(null);

  useEffect(() => {
    peer.on('data', function(data) {
      const message = JSON.parse(data);
      
      switch(message.type) {
        case 'video':
          const blob = new Blob([message.data], { type: 'video/webm' });

          if (videoRef.current) {
            videoRef.current.src = URL.createObjectURL(blob);
          }
          break;
        
        case 'state':
          if (videoRef.current) {
            if (message.value === 'play') {
              videoRef.current.play();
            } else if (message.value === 'pause') {
              videoRef.current.pause();
            }
          }
          break;
        
        case 'seek':
          if (videoRef.current) {
            videoRef.current.currentTime = message.value;
          }
          break;

        default:
          break;
      }
    });

    // Clean up when component unmounts
    return () => {
      peer.destroy();
    }
  }, [peer]);

  return (
    <video ref={videoRef} />
  )
};

export default Receiver;
