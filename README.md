# Sistema de Gestión de Condominios

## Descripción
Sistema web para la gestión integral de condominios, incluyendo manejo de propiedades, usuarios, pagos y recibos.

## Estado Actual del Proyecto
El proyecto se encuentra en desarrollo activo, con las siguientes funcionalidades implementadas:

### Módulos Implementados

#### 1. Gestión de Usuarios
- Registro y autenticación de usuarios
- Roles: administrador, superadministrador, propietario
- Gestión de perfiles y permisos

#### 2. Gestión de Propiedades
- Registro de propiedades
- Asignación de propietarios
- Tipos de propiedades (apartamentos, locales, etc.)

#### 3. Sistema de Recibos
- Generación automática de recibos mensuales
- Visualización y gestión de recibos
- Estados de recibos: pendiente, pagado, vencido
- Filtrado y búsqueda avanzada de recibos

#### 4. Sistema de Pagos
- Registro de pagos
- Métodos de pago: transferencia bancaria, tarjeta de crédito, pago móvil, crédito
- Sistema de créditos para usuarios
- Aplicación automática de créditos disponibles

## Tecnologías Utilizadas

### Frontend
- Next.js 14
- React
- TypeScript
- Tailwind CSS
- Shadcn UI

### Backend
- Node.js
- Express
- Sequelize ORM
- PostgreSQL

## Características Principales

### Sistema de Créditos
- Los usuarios pueden acumular créditos
- Aplicación automática de créditos en nuevos recibos
- Gestión transparente de saldos

### Automatización de Pagos
- Detección automática de créditos disponibles
- Aplicación automática de pagos
- Actualización de saldos en tiempo real

## Estructura del Proyecto

### Frontend (/condominiofront)
```
/app
  /components      # Componentes reutilizables
  /receipt        # Módulo de recibos
  /payment        # Módulo de pagos
  /property       # Módulo de propiedades
  /user           # Módulo de usuarios
  /utils          # Utilidades y helpers
  /hooks          # Custom hooks
```

### Backend (/backend)
```
/controllers      # Controladores de la aplicación
/models          # Modelos de datos
/routes          # Rutas de la API
/middlewares     # Middlewares personalizados
/utils           # Utilidades
/config          # Configuraciones
```

## Guía de Instalación

1. Clonar el repositorio
```bash
git clone [URL_DEL_REPOSITORIO]
```

2. Instalar dependencias del frontend
```bash
cd condominiofront
npm install
```

3. Instalar dependencias del backend
```bash
cd backend
npm install
```

4. Configurar variables de entorno
- Crear archivo `.env` en el directorio backend
- Crear archivo `.env.local` en el directorio frontend

5. Iniciar la base de datos
```bash
# Ejecutar migraciones
npx sequelize-cli db:migrate

# (Opcional) Ejecutar seeders
npx sequelize-cli db:seed:all
```

6. Iniciar el proyecto
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd condominiofront
npm run dev
```

## Flujos de Trabajo Principales

### 1. Generación de Recibos
1. Administrador selecciona mes y año
2. Sistema verifica propiedades activas
3. Genera recibos para cada propiedad
4. Aplica automáticamente créditos disponibles
5. Actualiza estados y saldos

### 2. Proceso de Pago Automático
1. Sistema detecta crédito disponible
2. Verifica monto suficiente
3. Aplica pago automático
4. Actualiza saldo de crédito
5. Marca recibo como pagado

## Próximas Funcionalidades
- [ ] Reportes y estadísticas
- [ ] Notificaciones automáticas
- [ ] Panel de control personalizado
- [ ] Integración con pasarelas de pago
- [ ] App móvil

## Contribución
[Instrucciones para contribuir al proyecto]

## Licencia
[Tipo de licencia]
