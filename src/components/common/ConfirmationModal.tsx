import React from 'react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          iconBg: 'bg-red-100 dark:bg-red-500/20',
          iconColor: 'text-red-600 dark:text-red-400',
          icon: TriangleAlert,
          confirmBg: 'bg-red-600 hover:bg-red-700 shadow-red-600/30',
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-100 dark:bg-amber-500/20',
          iconColor: 'text-amber-600 dark:text-amber-400',
          icon: CircleAlert,
          confirmBg: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30',
        };
      case 'success':
        return {
          iconBg: 'bg-green-100 dark:bg-green-500/20',
          iconColor: 'text-green-600 dark:text-green-400',
          icon: CircleCheck,
          confirmBg: 'bg-green-600 hover:bg-green-700 shadow-green-600/30',
        };
      case 'info':
      default:
        return {
          iconBg: 'bg-blue-100 dark:bg-blue-500/20',
          iconColor: 'text-blue-600 dark:text-blue-400',
          icon: Info,
          confirmBg: 'bg-primary hover:bg-blue-700 shadow-primary/30',
        };
    }
  };

  const styles = getTypeStyles();
  const TypeIcon = styles.icon;

  // Buka/tutup dikendalikan pemanggil lewat isOpen. Tombol batal dan Escape
  // sama-sama sampai ke onOpenChange(false), jadi onCancel dipanggil di sana.
  // Tombol konfirmasi mencegah penutupan otomatis supaya pemanggil yang
  // memutuskan (misalnya tetap terbuka sampai proses selesai).
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogPortal>
        {/* z-[80] supaya tetap di atas modal lain (z-[60]/z-[70]) */}
        <AlertDialogOverlay className="z-[80] bg-black/60 backdrop-blur-sm animate-fadeIn" />
        <AlertDialogPrimitive.Content className="fixed inset-0 z-[80] flex items-center justify-center p-4 focus:outline-none">
          <div className="bg-white dark:bg-card-dark w-full max-w-md rounded-3xl shadow-2xl p-6 animate-scaleUp text-center">
            <div
              className={`w-20 h-20 ${styles.iconBg} rounded-full flex items-center justify-center mx-auto mb-4 ${styles.iconColor}`}
            >
              <TypeIcon className="size-10" aria-hidden />
            </div>

            <AlertDialogTitle className="text-2xl font-bold text-text-primary-light dark:text-white mb-2">
              {title}
            </AlertDialogTitle>

            <AlertDialogDescription className="text-base text-text-secondary-light dark:text-text-secondary-dark mb-6">
              {message}
            </AlertDialogDescription>

            <div className="flex gap-3">
              {/* AlertDialogCancel memakai gaya outline; ditimpa ke ghost seperti sebelumnya */}
              <AlertDialogCancel
                className={cn(
                  'mt-0 sm:mt-0 border-0 bg-transparent shadow-none',
                  buttonVariants({ variant: 'ghost' }),
                  'flex-1 py-6 text-text-secondary-light font-bold hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors h-auto',
                )}
              >
                {cancelText}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  onConfirm();
                }}
                className={`flex-1 py-6 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 h-auto [&_svg]:size-5 ${styles.confirmBg}`}
              >
                <CircleCheck aria-hidden />
                {confirmText}
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPortal>
    </AlertDialog>
  );
};

export default ConfirmationModal;
