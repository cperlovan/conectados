import { NextResponse } from 'next/server';
import jwtDecode from 'jwt-decode';

interface TokenPayload {
  id: number;
  email: string;
  role: string;
  condominiumId: number;
  authorized: boolean;
}

export async function GET(req: Request) {
  try {
    const token = req.headers.get('Authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const response = await fetch('http://localhost:3040/api/economic-activities', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
} 