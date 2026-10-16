import React from 'react';
import { Button } from '@/components/ui/button';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isPlaceholderData?: boolean;
}

const PAGE_BUTTON_CLASS =
  'h-auto px-4 py-2 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold text-text-secondary-light hover:bg-white dark:hover:bg-white/5 hover:text-primary hover:border-primary transition-all shadow-sm';

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  isPlaceholderData = false,
}) => {
  return (
    <div className="flex justify-between items-center mt-6 py-4 border-t border-gray-100 dark:border-gray-800">
      <span className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
        Hal.{' '}
        <span className="font-bold text-text-primary-light dark:text-white">{currentPage}</span>{' '}
        dari <span className="font-bold text-text-primary-light dark:text-white">{totalPages}</span>
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1 || isPlaceholderData}
          className={PAGE_BUTTON_CLASS}
        >
          Sebelumnya
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            if (!isPlaceholderData && currentPage < totalPages && totalPages > 0) {
              onPageChange(currentPage + 1);
            }
          }}
          disabled={currentPage === totalPages || totalPages === 0 || isPlaceholderData}
          className={PAGE_BUTTON_CLASS}
        >
          Berikutnya
        </Button>
      </div>
    </div>
  );
};

export default PaginationControls;
