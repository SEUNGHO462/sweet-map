import React from 'react'

interface Props {
  open: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}

const ConfirmModal: React.FC<Props> = ({ open, title = '확인', message, confirmText = '확인', cancelText = '취소', onConfirm, onCancel }) => {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <div className="auth-header" style={{ marginBottom: 6 }}>
          <h2 className="auth-title">{title}</h2>
        </div>
        <div style={{ color:'#e9e9ec', padding:'6px 0 10px', lineHeight:1.5 }}>{message}</div>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button className="btn-ghost" onClick={onCancel}>{cancelText}</button>
          <button className="auth-submit" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal

