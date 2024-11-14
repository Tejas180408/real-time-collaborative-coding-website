import React, { useState } from "react";
import { FaBars, FaFolderOpen, FaPen, FaUser, FaMicrophone, FaTimes } from "react-icons/fa";
import { FaFolder } from "react-icons/fa6";
import { AiFillMessage } from "react-icons/ai";
import Draggable from "react-draggable";
import Client from "./Client";
import FileExplorer from "./FileExplorer";
import '../app.css';

const Editor = () => {
  const [isOpenPopup, setIsOpenPopup] = useState(false);
  const [isOpenFolder, setIsOpenFolder] = useState(false);
  const [activeItem, setActiveItem] = useState(null);

  const OpenPopup = () => {
    setIsOpenPopup(!isOpenPopup);
    setActiveItem('user');
  };

  const OpenFolder = () => {
    setIsOpenFolder(!isOpenFolder);
    setActiveItem('folder');
  };

  const handleClick = (item) => {
    setActiveItem(item);
  };

  return (
    <>
      <div className={`h-screen flex border-2 border-gray-900`}>

        {/* Left Sidebar */}
        <nav className="h-full w-12 bg-black text-white flex flex-col items-center p-1 pt-3 border-r-[1px] border-zinc-400">
          <ul className="space-y-4">
            <li
              className={`cursor-pointer border p-[4px] ${activeItem === 'bars' ? 'border-blue-300' : 'border-transparent hover:border-dashed hover:border-blue-300'}`}
              onClick={() => handleClick('bars')}
            >
              <FaBars size={24} />
            </li>
            <li
              className={`cursor-pointer border p-[4px] ${activeItem === 'folder' ? 'border-blue-300' : 'border-transparent hover:border-dashed hover:border-blue-300'}`}
              onClick={OpenFolder}
            >
              {isOpenFolder ? <FaFolderOpen size={24}/> : <FaFolder size={24}/>}
            </li>
            <li
              className={`cursor-pointer border p-[4px] ${activeItem === 'user' ? 'border-blue-300' : 'border-transparent hover:border-dashed hover:border-blue-300'}`}
              onClick={OpenPopup}
            >
              <FaUser size={24} />
            </li>
            <li
              className={`cursor-pointer border p-[4px] ${activeItem === 'microphone' ? 'border-blue-300' : 'border-transparent hover:border-dashed hover:border-blue-300'}`}
              onClick={() => handleClick('microphone')}
            >
              <FaMicrophone size={24} />
            </li>
            <li
              className={`cursor-pointer border p-[4px] ${activeItem === 'message' ? 'border-blue-300' : 'border-transparent hover:border-dashed hover:border-blue-300'}`}
              onClick={() => handleClick('message')}
            >
              <AiFillMessage size={24} />
            </li>
            <li
              className={`cursor-pointer border p-[4px] ${activeItem === 'pen' ? 'border-blue-300' : 'border-transparent hover:border-dashed hover:border-blue-300'}`}
              onClick={() => handleClick('pen')}
            >
              <FaPen size={24} />
            </li>
          </ul>
        </nav>

        {isOpenPopup && <Popup ClosePopup={OpenPopup} />}
        
        {/* Middle Section */}
        <div
          className={`transition-all duration-300 ease-in-out bg-black border-r-[1px] border-zinc-400 ${isOpenFolder ? 'w-64 ' : 'w-0 '} overflow-hidden`}
          style={{ maxWidth: '256px' }}
        >
          <FileExplorer/>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-black lg:flex-row">
            <div className="flex-1 bg-black border-b-[1px] border-zinc-400 lg:border-b-0 lg:border-r-[1px]" style={{ flex: '6.5 1 0%' }}></div>
            <div className="flex-1 bg-black" style={{flex: '3.5 1 0%'}}></div>
        </div>

      </div>  
    </>
  );
};

const Popup = ({ ClosePopup }) => {
  const [clients, setClients] = useState([
    { socketId: 1, userName: "Tejas Wani" },
    { socketId: 2, userName: "John Doe" },
    { socketId: 3, userName: "Harshal Pardhi" },
    { socketId: 4, userName: "Harshal P" },
    { socketId: 5, userName: "Harshal D" }
  ]);

  return (
    <Draggable bounds="parent" handle=".handle">
      <div className="fixed top-24 left-14 bg-black border shadow-lg p-7 rounded-lg w-64 h-68">
        <h2 className="handle cursor-move mb-3 text-xl text-slate-200 font-semibold">Connected</h2>
        <FaTimes onClick={ClosePopup} className="relative left-48 bottom-12 text-slate-200 hover:text-slate-300 cursor-pointer"/>
        <div className="h-48 overflow-y-auto pr-4 scrollbar-hide">
          <div className="flex flex-wrap items-center gap-7">
            {clients.map((client) => (
              <Client
                key={client.socketId}
                userName={client.userName}
              />
            ))}
          </div>
        </div>
      </div>
    </Draggable>
  );
};

export default Editor;
