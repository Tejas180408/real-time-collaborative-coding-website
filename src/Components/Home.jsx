import React, { useContext, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {v4 as uuidV4} from 'uuid';
import { UserContext } from './UserContext';
import toast from 'react-hot-toast';

const Home = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState();
  const { userData } = useContext(UserContext);
  const createNewRoom =  (e) => {
    e.preventDefault();
    let id = uuidV4();
    setRoomId(id);
    toast.success('SuccessFully Created !')
  };

  const joinRoom = () => {
    if (!roomId || !userName) {
      toast.error('ROOM ID & USERNAME is required');
      return;
    }

    navigate(`/Editor/${roomId}`, {
        state: {
          userName,
        },
    });
  };

  const handleInputEnter = (e) => {
    console.log(e.code);
    if (e.code === 'Enter') {
      joinRoom();
    }
  };

  useEffect(() => {
    if(userData.firstName && userData.lastName) {
      setUserName(`${userData.firstName} ${userData.lastName}`)
    }
  }, [userData])

  return (
    <>
    <div>
      <Link to='/UserProfile'>
        <button className='m-2 p-2 bg-black text-white rounded-sm'>Profile</button>
      </Link>
    </div>

    <div className='m-3 bg-gray-900 p-5 rounded-lg w-[400px] max-w-[90%]'>
      <div className='text-slate-100 text-4xl p-1 mb-4'>LOGO</div>
      <h4 className='text-slate-100 text-sm mb-3'>Paste invitation ROOM ID</h4>
      <div className='grid'>
        <input type='text'  placeholder='ROOM ID' value={roomId} onChange={(e) => setRoomId(e.target.value)} onKeyUp={handleInputEnter} className='p-[10px] font-bold rounded-sm border-none outline-none mb-3'/>
        <input type='text' placeholder='USERNAME' value={userName} onChange={(e) => setUserName(e.target.value)} onKeyUp={handleInputEnter} className='p-[10px] font-bold rounded-sm border-none outline-none mb-3'/>
      </div>
      <div className='flex items-end justify-end'>
        
        <button onClick={joinRoom} className='p-2 mb-3 font-bold bg-green-400 hover:bg-green-500 transition-all 0.3 ease-in-out rounded-md'>JOIN</button>
        
      </div>
      <span className='text-slate-100 text-sm flex items-center justify-center'>
        If you don't have an invite then create &nbsp;
        <a onClick={createNewRoom} href='' className='text-green-400 border-b border-green-400 hover:text-green-500'>new room</a>
      </span>
    </div>
    </>
  )
}

export default Home
