export default function Pagination({ curPage, lastPage, onPageChange }) {
    if (lastPage <= 1) return null;

    const pages = Array.from({ length: lastPage }, (_, i) => i + 1)
        .filter(p => Math.abs(p - curPage) <= 4);

    return (
        <div className="flex justify-center items-center gap-1 px-4 py-3 border-t border-gray-100">
            <button
                onClick={() => onPageChange(curPage - 1)}
                disabled={curPage === 1}
                className="px-2.5 py-1 text-xs rounded border border-gray-200 text-slate-500 disabled:opacity-30 hover:border-blue-400 hover:text-blue-500 transition"
            >
                ‹
            </button>

            {pages.map(p => (
                <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    className={`px-2.5 py-1 text-xs rounded border transition ${
                        p === curPage
                            ? "border-blue-600 bg-blue-600 text-white font-semibold"
                            : "border-gray-200 text-slate-600 hover:border-blue-400 hover:text-blue-500 bg-white"
                    }`}
                >
                    {p}
                </button>
            ))}

            <button
                onClick={() => onPageChange(curPage + 1)}
                disabled={curPage === lastPage}
                className="px-2.5 py-1 text-xs rounded border border-gray-200 text-slate-500 disabled:opacity-30 hover:border-blue-400 hover:text-blue-500 transition"
            >
                ›
            </button>
        </div>
    );
}
