import React from 'react';
import AdminLayout from '../../Layouts/AdminLayout'; // 경로 주의

export default function Index(props) {
    return (
        <AdminLayout user={props.auth?.user}>
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">대시보드 홈</h2>
                <p className="text-gray-600">관리자님, 현재 시스템은 정상 운영 중입니다.</p>
                
                {/* 통계 카드 예시 */}
                <div className="grid grid-cols-3 gap-6 mt-6">
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded">
                        <div className="text-sm text-blue-600">신규 가입</div>
                        <div className="text-2xl font-bold">12명</div>
                    </div>
                    <div className="p-4 bg-green-50 border border-green-100 rounded">
                        <div className="text-sm text-green-600">오늘 방문자</div>
                        <div className="text-2xl font-bold">450명</div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
