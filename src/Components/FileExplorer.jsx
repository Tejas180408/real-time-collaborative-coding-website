import React, { useState } from 'react'
import { FaTimes } from 'react-icons/fa';
import Folder from './Folder';

const FileExplorer = () => {

    const [ createFolderPopup, setCreateFolderPopup ] = useState(false);
    const [folders, setFolders] = useState([]);

    const CreateFolderPopup = () => {
        setCreateFolderPopup(!createFolderPopup);
    }

    const AddFolder = (name) => {
        setFolders([...folders, { name, subFolders: [] }]);
        setCreateFolderPopup(false);
    };

  return (
    <>

    <h5 className="text-slate-200 font-semibold m-4">FILE EXPLORER</h5>
    {folders.length === 0 
    ? (
        <div className='flex flex-col justify-center items-center mt-[-15px] p-5'>
            <hr className='border-zinc-400 w-64'/>
            <h6 className='text-white mt-3 mb-3'>You can open your existing folder...!</h6>
            <button className='text-white text-[16px] font-serif border border-zinc-400 hover:border-blue-300 rounded-lg p-1 px-5 mb-6'>Open Folder</button>
            <hr className='border-zinc-400 w-64'/>
            <h6 className='text-white mt-3 mb-3'>You can create a new folder...!</h6>
            <button onClick={CreateFolderPopup} className='text-white text-[16px] font-serif border border-zinc-400 hover:border-blue-300 rounded-lg p-1 px-5 mb-6'>Create Folder</button>
            <hr className='border-zinc-400 w-64'/>
        </div>
    ) : (
        <div className="mt-6">
            {folders.map((folder, index) => (
            <Folder key={index} folder={folder} />
            ))}
        </div>
    )}
    
    {createFolderPopup && <MakeFolder onAddFolder={AddFolder} ClosePopup={CreateFolderPopup}/>}
    </> 
  )
}

const MakeFolder = ({ClosePopup, onAddFolder}) => {

    const [folderName, setFolderName ] = useState([]);

    const handleInputEnter = (e) => {
        console.log(e.code);
        if (e.code === 'Enter' && folderName.trim()) {
          onAddFolder(folderName);
        }
    };

    return (
        <div className='fixed inset-0 bg-black bg-opacity-50 z-50'>
            <div className='absolute bg-black top-1/3 left-1/3 p-5 border border-1 border-zinc-400 rounded-sm'>
                <FaTimes onClick={ClosePopup} className="relative left-48 bottom-3 text-slate-200 hover:text-blue-300 cursor-pointer"/>
                <h5 className='handle cursor-move text-slate-50 font-serif text-[19px] mb-2 mt-[-17px]'>Create Folder</h5>
                <input
                    type='text'
                    placeholder='New Folder Name'
                    onChange={(e) => setFolderName(e.target.value)}
                    onKeyUp={handleInputEnter}
                    className='text-white bg-black border border-zinc-400 hover:border-blue-300 rounded-sm focus:outline-none focus:ring-blue-300 focus:border-blue-300 p-1 pl-2'
                />
            </div>
        </div>
    )
}

export default FileExplorer;
