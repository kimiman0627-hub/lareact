import React from "react";
import ServiceLayout from "../../Layouts/ServiceLayout"; // 경로 주의

export default function Index(props) {
    return (
        <ServiceLayout>
            <div className="bg-white p-6 rounded shadow">
                <h2 className="text-2xl font-bold ">환영합니다!</h2>
                <p className="text-red-500 font-bold">
                    여기는 메인 본문 영역입니다.
                </p>
            </div>
        </ServiceLayout>
    );
}
