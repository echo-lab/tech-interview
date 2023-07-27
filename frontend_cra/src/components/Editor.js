import { Component, useRef, useEffect, useState } from "react";
import React from "react"
import CodeMirror from '@uiw/react-codemirror';
import { langs } from '@uiw/codemirror-extensions-langs';
import { basicSetup } from '@uiw/codemirror-extensions-basic-setup';
import { indentUnit } from '@codemirror/language'
import { drawSelection } from "@codemirror/view";
import { getDocument, peerExtension, showCaretEffect, showCaretField  } from "../utils/collab";
import { io } from "socket.io-client";
import { useLoaderData } from "react-router-dom";
import socket from "../webrtc/socket";
import { underlineExtenstion } from "../utils/cursor";
import { javascript } from "@codemirror/lang-javascript";
import HideButton from "./HideButton";

export const Editor = React.memo((props) => {
  const roomId = useLoaderData();
  const [doc, setDoc] = useState(null)
  const [version, setVersion] = useState(null)
  const viewRef = useRef(null)

  useEffect(() => {

    socket.once("code ready", ()=>{
        console.log("CODE READY!!")
        getDocument(socket, roomId).then(promise=>{
          setVersion(promise.version)
          setDoc(promise.doc.toString())
        })
    })
    
    
        
    
    
  }, [])

  const handleCreateEditor = (view, state) => {
    viewRef.current = view
  }

  const handleHide = () => {
    viewRef.current.dispatch({effects: showCaretEffect.of(
      {
        show: !viewRef.current.state.field(showCaretField).show,
        from: viewRef.current.state.field(showCaretField).from,
        to: viewRef.current.state.field(showCaretField).to,
      }
    )})
  }

  if (version !== null && doc !== null) {
    return (
      <React.Fragment>
        <CodeMirror 
          height="24rem"
          basicSetup={false}
          extensions={[
            indentUnit.of("\t"), 
            basicSetup(), 
            drawSelection(), 
            langs.c(),
            showCaretField,
            peerExtension(socket, version, roomId, props.id),          
            underlineExtenstion(props.id),
            
          ]}
          value={doc}
          onCreateEditor={handleCreateEditor}
        /> 
        <HideButton handleHide={handleHide}/>
      </React.Fragment>
    )
  }
  else{
    return (
      <span>loading...</span>
    )
  }

  
});
