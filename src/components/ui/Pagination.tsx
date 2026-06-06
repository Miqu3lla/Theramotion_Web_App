interface PaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  itemName?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  itemName = 'items'
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between border-t border-outline-variant pt-6 mt-2 gap-4">
      <span className="text-body-sm text-on-surface-variant font-medium">
        Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} {itemName}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 border border-outline-variant rounded-md text-label-md font-medium text-on-surface hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        
        <div className="flex items-center gap-1 hidden sm:flex">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 flex items-center justify-center rounded-md text-label-md font-medium transition-colors ${
                currentPage === page 
                  ? 'bg-primary text-on-primary' 
                  : 'text-on-surface hover:bg-surface-container'
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 border border-outline-variant rounded-md text-label-md font-medium text-on-surface hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
