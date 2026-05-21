import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const response = await fetch('http://impulse.yadro.msk.ru/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch topology' },
            { status: 500 }
        );
    }
}