import React, { useRef, useEffect } from "react";
import * as Y from 'yjs';
// @ts-ignore
import { yCollab } from 'y-codemirror.next';
import { WebsocketProvider } from 'y-websocket';

import {EditorView, basicSetup} from "codemirror"
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript'
import { oneDarkTheme } from "@codemirror/theme-one-dark";

import { useDispatch, useSelector } from "react-redux";
import { setName } from "../redux/features/pcs/userSlice";

let myTheme = EditorView.theme({
  
  "&": {height: "100%"},
  ".cm-scroller": {overflow: "auto"},
  ".cm-content, .cm-gutter": {minHeight: "100%", height: "100%"},
}, {dark: true})


export default function CodeEditor (props) {
  const viewRef = useRef(null);
  const editor = useRef();
  const dispatch = useDispatch();
  const color = useSelector(state => state.user.color);
  const lightColor = useSelector(state => state.user.lightColor);
  const user = useSelector(state => state.user.value);

  useEffect(() => {
    const ydoc = new Y.Doc();
    // const provider = new WebrtcProvider('codemirror6-demo-room', ydoc)
    const provider = new WebsocketProvider(
      'wss://demos.yjs.dev',
      props.roomId,
      ydoc
    )

    const ytext = ydoc.getText('codemirror');
    const undoManager = new Y.UndoManager(ytext);
    let username = user;
    console.log(username)
    if (username === 'user'){
      console.log('awo')
      username = 'user ' + Math.floor(Math.random() * 100);
    }
    dispatch(setName(username));

    provider.awareness.setLocalStateField('user', {
      name: username,
      color: color,
      colorLight: lightColor
    })



    provider.awareness.on("update", () => {
      const partyNum = Array.from(provider.awareness.getStates().keys()).length;

      if (partyNum === 0) {
        ytext.delete(0, ytext.length);
      }
    });

    
    const extensions = [basicSetup, javascript(), yCollab(ytext, provider.awareness, { undoManager }), oneDarkTheme, myTheme];
    const startState = EditorState.create({
      doc: ytext.toString(),
      extensions: extensions
    });

    const view = new EditorView({ state: startState, parent: editor.current });
    viewRef.current = view;

  
    return () => {
      provider.disconnect();
      provider.destroy();
      view.destroy();
    };
  }, []);


  return (
    <React.Fragment>
      <div className="flex flex-1 flex-col w-full shadow-lg overflow-hidden h-full" ref={editor}>    </div>
    </React.Fragment>
  )
}