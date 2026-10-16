import React from 'react';
import { Button } from './ui/button';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info' | 'success';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Ya',
  cancelText = 'Batal',
  onConfirm,
  onCancel,
  type = 'warning',
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          iconBg: 'bg-red-100 dark:bg-red-500/20',
          iconColor: 'text-red-600 dark:text-red-400',
          icon: 'warning',
          confirmBg: 'bg-red-600 hover:bg-red-700 shadow-red-600/30',
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-100 dark:bg-amber-500/20',
          iconColor: 'text-amber-600 dark:text-amber-400',
          icon: 'error',
          confirmBg: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30',
        };
      case 'success':
        return {
          iconBg: 'bg-green-100 dark:bg-green-500/20',
          iconColor: 'text-green-600 dark:text-green-400',
          icon: 'check_circle',
          confirmBg: 'bg-green-600 hover:bg-green-700 shadow-green-600/30',
        };
      case 'info':
      default:
        return {
          iconBg: 'bg-blue-100 dark:bg-blue-500/20',
          iconColor: 'text-blue-600 dark:text-blue-400',
          icon: 'info',
          confirmBg: 'bg-primary hover:bg-blue-700 shadow-primary/30',
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-card-dark w-full max-w-md rounded-3xl shadow-2xl p-6 animate-scaleUp text-center">
        <div
          className={`w-20 h-20 ${styles.iconBg} rounded-full flex items-center justify-center mx-auto mb-4 ${styles.iconColor}`}
        >
          <span className="material-icons-round text-4xl">{styles.icon}</span>
        </div>

        <h3 className="text-2xl font-bold text-text-primary-light dark:text-white mb-2">{title}</h3>

        <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">{message}</p>

        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="flex-1 py-6 text-text-secondary-light font-bold hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors h-auto"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className={`flex-1 py-6 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 h-auto ${styles.confirmBg}`}
          >
            <span className="material-icons-round text-lg">check_circle</span>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
