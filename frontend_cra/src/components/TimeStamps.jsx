import React from "react";

const convertTime = (time) => {
  var hours   = Math.floor(time / 3600);
  //console.log(hours)
  var minutes = Math.floor((time - (hours * 3600)) / 60);
  var seconds = Math.round(time - (hours * 3600) - (minutes * 60));
  //return hours.toString().padStart(2, "0") + ":" + minutes.toString().padStart(2, "0") + ":" + seconds.toString().padStart(2, "0");
  return hours.toString().padStart(2, "0") + ":" + minutes.toString().padStart(2, "0") + ":" + seconds.toString().padStart(2, "0");

}

export default function TimeStamps(props)  {
  return (
    props.recordedBlob.map((blob, _) => {
      return(
        <div key={blob.time}>
          <button onClick={()=>props.handlePlay(blob)}>Timestamp: {convertTime(blob.time/1000)}</button>
        </div>
      )
    })
  )
}