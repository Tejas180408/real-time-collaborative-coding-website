import React, { useState, useContext } from 'react';
import UserForm from './UserForm';
import { IoChevronBackCircleSharp } from "react-icons/io5";
import { FaUserCircle, FaPlus, FaCamera, FaTrashAlt, FaEdit } from 'react-icons/fa';
import { UserContext } from './UserContext'; 
import { Link } from 'react-router-dom';

const UserProfile = () => {
    const [image, setImage] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const { userData, setUserData } = useContext(UserContext); 

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImageDelete = () => {
        setImage(null);
    };

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleCloseForm = () => {
        setIsEditing(false);
    };

    const handleFormSubmit = (formData) => {
        setUserData({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            mobile: formData.mobile
        });
        handleCloseForm();
    };

    const getInitials =() => {
        const { firstName, lastName, email } = userData;
        if (firstName && lastName) {
            return `${firstName[0]}${lastName[0]}`.toUpperCase();
        } else if (email) {
            return `${email[0]}${email[1]}`.toLowerCase();
        } 
        return null;
    };

    return (
        <div className='h-screen bg-gray-900'>
            <nav className='w-full h-12 p-2 bg-gray-900'>
                <Link to='/Home'><IoChevronBackCircleSharp className='text-white text-3xl'/></Link>
            </nav>
            <div className="bg-gray-900 flex flex-col lg:flex-row justify-evenly">
                <div className="lg:-[55%]">
                    <div className='flex justify-between bg-gradient-to-r from-blue-500 to-purple-500 text-white h-28 lg:rounded-[8px] lg:w-[340px] lg:h-28 lg:m-8 lg:ml-4'>
                        <div className='relative left-4 top-12 bg-gray-900 rounded-full'>
                            {image ? (
                                <img
                                    src={image}
                                    alt="Profile"
                                    className="w-28 h-28 rounded-full object-cover border-2 border-gray-300 lg:w-28 lg:h-28"
                                />
                            ) : getInitials() ? (
                                <div className="w-28 h-28 rounded-full bg-gray-700 flex items-center justify-center text-4xl text-white font-bold">
                                    {getInitials()}
                                </div>
                            ) : (
                                <FaUserCircle className="text-white w-28 h-28" />
                            )}
                            <label className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-2 cursor-pointer hover:bg-blue-600">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />
                                {image ? <FaCamera /> : <FaPlus />}
                            </label>
                        </div>

                        <div className='relative top-[82px] right-2'>
                            {image && (
                                <button
                                    onClick={handleImageDelete}
                                    className="bg-gray-800 text-white px-2 py-1 rounded-[5px] flex items-center gap-2 text-xs">
                                    <FaTrashAlt />
                                    <span>Delete Photo</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className='flex justify-between'>
                        <div className='relative top-16 left-5 lg:top-9 lg:left-9'>
                            <div className='mb-3.5 text-slate-100 font-bold text-[22px]'>
                                {userData.firstName} {userData.lastName}
                            </div>
                            <div className='text-slate-300 text-sm'>
                                {userData.email}
                            </div>
                        </div>

                        <div className='relative right-3 top-[9px] lg:right-12 lg:top-[-25px]'>
                            <button
                                onClick={handleEditClick}
                                className='p-1 pl-2 pr-2 ml-8 text-white bg-gray-800 flex items-center gap-2 text-[16px] font-semibold rounded-sm hover:bg-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500'>
                                <FaEdit />
                                <span>Edit</span>
                            </button>
                        </div>
                    </div>
                </div>

                {isEditing && (
                    <UserForm 
                        onClose={handleCloseForm} 
                        onSubmit={handleFormSubmit}
                        initialData={userData}
                    />
                )}

                <div className="relative top-16 lg:top-1 lg:w-[55%] p-14">
                    <p className='text-slate-100 font-semibold text-lg'>
                        Lorem ipsum dolor sit, amet consectetur adipisicing elit. Aliquid accusamus expedita voluptatem exercitationem? Cupiditate deleniti doloribus, numquam enim officia saepe.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
