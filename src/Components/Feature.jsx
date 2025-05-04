import React from 'react'
import { Navigate, useNavigate } from 'react-router-dom';
import Navbar from '../Pages/Navbar';

const collaborationWebsites = [
  {
    id: 1,
    name: "Codeshare",
    description: "An online code editor for real-time collaboration, used for interviews, troubleshooting, and teaching.",
    features: ["Real-time code sharing", "Pair programming", "Interview support"],
    imageurl: "https://codeshare.io/-/img/codeshare-logo.svg?v=v3.34.6"
  },
  {
    id: 2,
    name: "Replit",
    description: "A collaborative coding platform that allows users to write, review, and debug code together in real-time.",
    features: ["Synchronous collaboration", "Frictionless sharing", "Secure environment"],
    imageurl: "https://images.prismic.io/contrary-research/56e4af3b-4e2f-41d7-a579-1ff97be751b5_Replit+%281%29.png?auto=compress,format"
  },
  {
    id: 3,
    name: "Visual Studio Live Share",
    description: "A tool for remote pair programming with real-time editing, debugging, and communication features.",
    features: ["Multiplayer editing", "Audio and video chat", "Group debugging"],
    imageurl: "https://code.visualstudio.com/opengraphimg/opengraph-blog.png"
  }
];






const Feature = () => {
  // const navigate = useNavigate(); // Keep if needed for future navigation
  // const back =() =>{
  //   navigate('/');
  // }
  return (<>
  <Navbar/>

<div className="bg-black min-h-screen py-12"> {/* Changed background to light gray, added padding */}
    <div className="container mx-auto px-4"> {/* Added a container for better centering and padding */}
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-10">Collaboration Tools</h1> {/* Added a title */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"> {/* Adjusted grid for responsiveness */}
        {collaborationWebsites.map((data) => (
          <div key={data.id} className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col"> {/* Card styling: white bg, shadow, rounded corners */}
            <img src={data.imageurl} alt={`${data.name} logo`} className='w-full h-48 object-contain p-4 border-b border-gray-200' /> {/* Adjusted image styling */}

            <div className="p-6 flex flex-col flex-grow"> {/* Padding for content, flex-grow to push content down */}
              <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">{data.name}</h2> {/* Changed h to h2, adjusted styling */}
              <h3 className='text-sm font-medium text-gray-600 mb-1'>Description:</h3> {/* Changed h to h3, adjusted styling */}
              <p className='text-gray-700 text-sm mb-4 flex-grow'>{data.description}</p> {/* Adjusted styling, flex-grow */}
              <h3 className='text-sm font-medium text-gray-600 mb-2'>Features:</h3> {/* Changed h to h3 */}
              <ul className='list-disc list-inside text-sm text-gray-700 space-y-1'> {/* Used ul/li for features */}
                {data.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
    </div>
  </>
  )
}

export default Feature