import React, {useEffect} from 'react';
import Room from './components/Room';
import JoinRoomView from './components/JoinRoomView';
import ErrorPage from './components/ErrorPage';
import { createBrowserRouter, RouterProvider,} from "react-router-dom";
import { roomLoader } from './components/Room';
import { Editor } from './components/Editor';

const router = createBrowserRouter([
  {
    path: "/",
    element: <JoinRoomView /> ,
    errorElement: <ErrorPage /> ,
  },
  {
    path: "room/:roomId",
    element: <Room /> ,
    loader: roomLoader,
    errorElement: <ErrorPage />,
  },
]);


function App() {

  useEffect(()=>{
    console.log('app loaded');
    //connectWithSocketServer();
  }, [])

  return (
    <div className="flex flex-col h-screen">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
