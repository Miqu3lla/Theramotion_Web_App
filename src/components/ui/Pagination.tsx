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
    <div className="tm-pagination">
      <span className="tm-pagination-info">
        Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} {itemName}
      </span>
      <div className="tm-pagination-controls">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="tm-page-btn"
        >
          Previous
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`tm-page-num${currentPage === page ? ' active' : ''}`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="tm-page-btn"
        >
          Next
        </button>
      </div>
    </div>
  );
}
