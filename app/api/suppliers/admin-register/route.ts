import { NextResponse } from 'next/server';
import jwtDecode from 'jwt-decode';

interface TokenPayload {
  id: number;
  email: string;
  role: string;
  condominiumId: number;
  authorized: boolean;
}

export async function POST(req: Request) {
  try {
    const token = req.headers.get('Authorization')?.split(' ')[1];
    
    if (!token) {
      console.log('No se encontró token en la solicitud');
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const decoded = jwtDecode<TokenPayload>(token);
    //console.log('Token decodificado:', decoded);
    
    if (!decoded.authorized || !['admin', 'superadmin'].includes(decoded.role)) {
      console.log('Usuario no autorizado o sin rol adecuado:', decoded);
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const data = await req.json();
    const { email, ...supplierData } = data;
    console.log('Datos recibidos:', { email, supplierData });

    // Primero buscar el usuario por correo electrónico
    const userUrl = `http://localhost:3040/api/users/email/${encodeURIComponent(email)}`;
    console.log('URL de búsqueda de usuario:', userUrl);
    
    const userResponse = await fetch(userUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
    });

    console.log('Estado de la respuesta de búsqueda de usuario:', userResponse.status);
    console.log('Headers de la respuesta:', Object.fromEntries(userResponse.headers.entries()));
    
    const responseText = await userResponse.text();
    console.log('Respuesta completa:', responseText);

    // Verificar si la respuesta es HTML
    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
      console.error('El servidor devolvió HTML en lugar de JSON');
      console.error('Contenido de la respuesta:', responseText);
      return NextResponse.json(
        { message: 'Error en el servidor: Respuesta inválida. El servidor devolvió HTML en lugar de JSON.' },
        { status: 500 }
      );
    }

    let userData;
    try {
      userData = JSON.parse(responseText);
    } catch (e: any) {
      console.log('Error al parsear respuesta:', e);
      console.log('Respuesta que causó el error:', responseText);
      return NextResponse.json(
        { message: 'Error al procesar la respuesta del servidor. Detalles: ' + (e.message || 'Error desconocido') },
        { status: 500 }
      );
    }

    if (!userResponse.ok) {
      if (userResponse.status === 404) {
        console.log('Usuario no encontrado con email:', email);
        return NextResponse.json(
          { message: 'El usuario no existe. Debe registrarse primero en el sistema.' },
          { status: 404 }
        );
      }
      console.error('Error al buscar usuario:', userResponse.status, userResponse.statusText);
      return NextResponse.json(
        { message: `Error al buscar el usuario: ${userResponse.statusText}` },
        { status: userResponse.status }
      );
    }

    console.log('Usuario encontrado:', userData);

    // Verificar que el usuario pertenezca al mismo condominio
    if (userData.condominiumId !== decoded.condominiumId) {
      console.log('El usuario pertenece a otro condominio:', { 
        userCondominiumId: userData.condominiumId, 
        adminCondominiumId: decoded.condominiumId 
      });
      return NextResponse.json(
        { message: 'El usuario pertenece a otro condominio' },
        { status: 403 }
      );
    }

    // Actualizar los datos del usuario
    const userUpdateData = {
      name: supplierData.contactInfo.name,
      lastname: supplierData.contactInfo.lastname,
      address: supplierData.contactInfo.address,
      telephone: supplierData.contactInfo.phone,
      movil: supplierData.contactInfo.phone
    };
    console.log('Datos a actualizar del usuario:', userUpdateData);

    const userUpdateUrl = `http://localhost:3040/api/users/${userData.id}`;
    console.log('URL de actualización de usuario:', userUpdateUrl);

    const userUpdateResponse = await fetch(userUpdateUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(userUpdateData)
    });

    if (!userUpdateResponse.ok) {
      const errorText = await userUpdateResponse.text();
      console.error('Error al actualizar usuario:', errorText);
      return NextResponse.json(
        { message: 'Error al actualizar los datos del usuario' },
        { status: userUpdateResponse.status }
      );
    }

    console.log('Usuario actualizado exitosamente');

    // Crear el proveedor con el ID del usuario encontrado
    const supplierPayload = {
      ...supplierData,
      userId: userData.id,
      condominiumId: userData.condominiumId,
    };
    console.log('Datos a enviar al backend para crear proveedor:', supplierPayload);

    const supplierUrl = 'http://localhost:3040/api/suppliers';
    console.log('URL de creación de proveedor:', supplierUrl);

    const response = await fetch(supplierUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(supplierPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error al crear proveedor:', errorText);
      return NextResponse.json(
        { message: 'Error al registrar el proveedor' },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('Proveedor creado exitosamente:', result);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error en el proceso:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor: ' + (error.message || 'Error desconocido') },
      { status: 500 }
    );
  }
} 