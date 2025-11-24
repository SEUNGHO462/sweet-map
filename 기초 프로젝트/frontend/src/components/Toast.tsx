import React from 'react'

interface Props {
  message?: string | null
}

const Toast: React.FC<Props> = ({ message }) => {
  if (!message) return null
  return (
    <div className="toast-container">
      <div className="toast">{message}</div>
    </div>
  )
}

export default Toast

