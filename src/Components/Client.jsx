import React from 'react'
import Avatar from 'react-avatar'

const Client = ({userName}) => {
  return (
    <div className='flex items-center flex-col text-slate-200 font-medium gap-3 w-[77px]'>
      <Avatar name={userName} size={50} round="14px"/>
      <span style={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        width: '100%',
        display: 'block'
        }}>
        {userName}
      </span>
    </div>
  )
}

export default Client
