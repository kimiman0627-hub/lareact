import { Link } from "@inertiajs/react";

export default function Pagination({ links }) {
    if (!links || links.length <= 3) return null;

    return (
        <div className="flex flex-wrap justify-center mt-6 gap-1">
            {links.map((link, key) =>
                link.url === null ? (
                    // 연결된 링크가 없는 경우 (예: 이전/다음 버튼 비활성)
                    <div
                        key={key}
                        className="px-4 py-2 text-sm text-gray-400 border border-gray-200 rounded-lg bg-gray-50"
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ) : (
                    // 클릭 가능한 페이지 번호
                    <Link
                        key={key}
                        href={link.url}
                        className={`px-4 py-2 text-sm border rounded-lg transition duration-150 ${
                            link.active
                                ? "bg-blue-600 text-white border-blue-600 font-bold"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                        // 검색 조건(쿼리 스트링) 유지를 위해 preserveState 옵션 활용 가능
                        preserveState
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ),
            )}
        </div>
    );
}
