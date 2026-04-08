import React from "react";
import Header from "@/Service/Components/Layout/Header";
import Footer from "@/Service/Components/Layout/Footer";
import Sidebar from "@/Service/Components/Layout/Sidebar";

export default function ServiceLayout({ children, theme = "dark", sidebar = true }) {
    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <Header theme={theme} />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
                {sidebar ? (
                    <div className="flex flex-col lg:flex-row gap-5">
                        <div className="flex-1 min-w-0">
                            {children}
                        </div>
                        <Sidebar />
                    </div>
                ) : (
                    children
                )}
            </main>
            <Footer theme={theme} />
        </div>
    );
}
