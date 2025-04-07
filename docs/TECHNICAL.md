# Documentación Técnica

## Modelos de Datos

### User
```typescript
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'superadmin' | 'owner';
  credit: number;
  condominiumId: number;
  status: 'active' | 'inactive';
}
```

### Property
```typescript
interface Property {
  id: number;
  number: string;
  type: string;
  status: 'active' | 'inactive';
  condominiumId: number;
  ownerId: number;
}
```

### Receipt
```typescript
interface Receipt {
  id: number;
  amount: number;
  status: 'pending' | 'paid' | 'partial' | 'overdue';
  dueDate: Date;
  month: number;
  year: number;
  visible: boolean;
  propertyId: number;
  userId: number;
  condominiumId: number;
}
```

### Payment
```typescript
interface Payment {
  id: number;
  amount: number;
  method: 'bank_transfer' | 'credit_card' | 'mobile_payment' | 'credit';
  status: 'pending' | 'verified' | 'approved' | 'rejected';
  payment_details: {
    automatic?: boolean;
    credit_applied?: number;
    date?: Date;
    notes?: string;
  };
  userId: number;
  receiptId: number;
  condominiumId: number;
}
```

## Flujos de Datos

### Generación de Recibos
```mermaid
sequenceDiagram
    Admin->>+Sistema: Selecciona mes/año
    Sistema->>+DB: Consulta propiedades activas
    DB-->>-Sistema: Lista de propiedades
    Sistema->>+DB: Consulta configuración de montos
    DB-->>-Sistema: Montos configurados
    loop Para cada propiedad
        Sistema->>Sistema: Genera recibo
        Sistema->>Sistema: Verifica crédito disponible
        opt Si hay crédito suficiente
            Sistema->>Sistema: Crea pago automático
            Sistema->>Sistema: Actualiza saldo de crédito
        end
    end
    Sistema->>DB: Guarda recibos y pagos
    Sistema-->>-Admin: Confirma generación
```

### Proceso de Pago Automático
```mermaid
sequenceDiagram
    Sistema->>+DB: Verifica crédito usuario
    DB-->>-Sistema: Saldo disponible
    opt Si crédito >= monto recibo
        Sistema->>Sistema: Crea pago con método 'credit'
        Sistema->>DB: Actualiza saldo crédito
        Sistema->>DB: Actualiza estado recibo
    end
```

## APIs

### Endpoints de Recibos

#### GET /api/receipts
Obtiene lista de recibos con filtros
```typescript
interface QueryParams {
  status?: string;
  month?: number;
  year?: number;
  propertyId?: number;
  userId?: number;
}
```

#### POST /api/receipts
Genera nuevos recibos
```typescript
interface CreateReceiptBody {
  month: number;
  year: number;
  dueDate: string;
  condominiumId: number;
}
```

### Endpoints de Pagos

#### POST /api/payments
Registra un nuevo pago
```typescript
interface CreatePaymentBody {
  amount: number;
  method: string;
  receiptId: number;
  userId: number;
  payment_details?: object;
}
```

## Seguridad

### Autenticación
- JWT para manejo de sesiones
- Tokens almacenados en cookies httpOnly
- Refresh tokens para renovación automática

### Autorización
- Middleware de verificación de roles
- Validación de permisos por ruta
- Sanitización de datos de entrada

## Configuración del Entorno

### Variables de Entorno Backend
```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
JWT_SECRET=your-secret-key
PORT=3040
```

### Variables de Entorno Frontend
```env
NEXT_PUBLIC_API_URL=http://localhost:3040
```

## Manejo de Errores

### Códigos de Error Personalizados
- E001: Error de autenticación
- E002: Error de autorización
- E003: Recurso no encontrado
- E004: Error de validación
- E005: Error en la base de datos

### Estructura de Respuesta de Error
```typescript
interface ErrorResponse {
  status: number;
  message: string;
  error: string;
  code?: string;
  details?: object;
}
```

## Pruebas

### Pruebas Unitarias
- Jest para backend
- React Testing Library para frontend

### Pruebas de Integración
- Supertest para API endpoints
- Cypress para pruebas E2E

## Despliegue

### Requisitos del Servidor
- Node.js >= 18
- PostgreSQL >= 14
- PM2 para gestión de procesos

### Proceso de Despliegue
1. Build del frontend
2. Migraciones de base de datos
3. Reinicio de servicios
4. Verificación de salud

## Mantenimiento

### Logs
- Winston para logging en backend
- Rotación de logs configurada
- Monitoreo de errores

### Backups
- Respaldo diario de base de datos
- Retención de 30 días
- Verificación automática de integridad 