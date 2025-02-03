import React from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <header>
                <meta name="viewport" content="initial-scale=1, width=device-width" />
            </header>
            <body>{children}</body>
        </html>
    );
}
