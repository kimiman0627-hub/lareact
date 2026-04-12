import React from "react";
import TopBar from "@/Service/Components/Layout/TopBar";
import NavBar from "@/Service/Components/Layout/NavBar";
import Footer from "@/Service/Components/Layout/Footer";
import Sidebar from "@/Service/Components/Layout/Sidebar";

export default function ServiceLayout({ children, sidebar = true }) {
    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <header className="sticky top-0 z-40">
                <TopBar />
                <NavBar />
            </header>
            <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
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
            <Footer />
        </div>
    );
}
