"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import Header from "../components/Header"
import Footer from '../components/Footer';

interface Proveedor {
  id: number;
  nombre: string;
  apellido: string;
  cedula: string;
  direccion?: string;
  telefonos?: string;
  celular?: string;
  email?: string;
  status?: string;
  tipo: 'Proveedor';
}

const Page = () => {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [formulario, setFormulario] = useState<Proveedor>({
    id: 0,
    nombre: '',
    apellido: '',
    cedula: '',
    direccion: '',
    telefonos: '',
    celular: '',
    email: '',
    tipo: 'Proveedor',
  });
  const [modoEdicion, setModoEdicion] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const [proveedoresPorPagina, setProveedoresPorPagina] = useState(5);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [totalFilas, setTotalFilas] = useState<number>(0);

  useEffect(() => {
    cargarProveedores();
  }, [paginaActual, proveedoresPorPagina, terminoBusqueda]);

  const cargarProveedores = async () => {
    try {
        const url = `http://localhost:3040/person?page=${paginaActual}&limit=${proveedoresPorPagina}&search=${encodeURIComponent(terminoBusqueda)}&tipo=Proveedor`;
        console.log('URL de carga de proveedores:', url); // Depuración

        const respuesta = await axios.get(url);
        console.log('Respuesta de la API:', respuesta.data); // Depuración

        setProveedores(respuesta.data.rows); // Actualiza el estado con los datos recibidos
        setTotalFilas(respuesta.data.count); // Actualiza el total de filas
    } catch (error) {
        console.error('Error al cargar proveedores:', error);
        if (axios.isAxiosError(error)) {
            console.error('Detalles del error:', error.response?.data);
        }
    }
};

  const manejarCambioPagina = (nuevaPagina: number) => {
    setPaginaActual(nuevaPagina);
  };

  const manejarCambioPorPagina = (nuevaCantidad: number) => {
    setProveedoresPorPagina(nuevaCantidad);
    setPaginaActual(1);
  };

  const manejarCambioBusqueda = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTerminoBusqueda(e.target.value);
    setPaginaActual(1);
  };

  const manejarCambioFormulario = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormulario({
      ...formulario,
      [name]: value, // Actualiza el campo correspondiente en el estado
    });
  };

  const manejarEditarProveedor = (proveedor: Proveedor) => {
    setFormulario(proveedor);
    setModoEdicion(true);
    const formulario = document.getElementById('form-Prov');
    if (formulario) {
      formulario.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const crearProveedor = async () => {
    try {
      const formularioSinId = { ...formulario };
      delete formularioSinId.id;
      await axios.post('http://localhost:3040/person', formularioSinId);
      cargarProveedores();
      limpiarFormulario();
    } catch (error) {
      console.error('Error al crear proveedor:', error);
    }
  };

  const actualizarProveedor = async () => {
    try {
      await axios.put(`http://localhost:3040/person/${formulario.id}`, formulario);
      cargarProveedores();
      limpiarFormulario();
      setModoEdicion(false);
    } catch (error) {
      console.error('Error al actualizar proveedor:', error);
    }
  };

  const limpiarFormulario = () => {
    setFormulario({
      id: 0,
      nombre: '',
      apellido: '',
      cedula: '',
      direccion: '',
      telefonos: '',
      celular: '',
      email: '',
      tipo: 'Proveedor',
    });
  };

  const columns = [
    { name: 'Nombre', selector: row => row.nombre, sortable: true },
    { name: 'Apellido', selector: row => row.apellido, sortable: true },
    { name: 'Cédula', selector: row => row.cedula, sortable: true },
    {
      name: 'Status',
      cell: (fila: Proveedor) => (
          <span
              style={{
                  color: fila.status === 'A' ? 'green' : 'red',
                  fontWeight: 'bold',
              }}
          >
              {fila.status === 'A' ? 'Activo' : 'Inactivo'}
          </span>
      ),
      sortable: true,
  },
    {
        name: 'Acciones',
        cell: (fila: Proveedor) => (
            <div>
                <button
                    onClick={() => manejarEditarProveedor(fila)}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded mr-2"
                >
                    Editar
                </button>
                <button
                    onClick={() => eliminarProveedor(fila.id)} // Llama a la función eliminarProveedor
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
                >
                    Eliminar
                </button>
            </div>
        ),
    },
];
  
const eliminarProveedor = async (id: number) => {
  try {
      const confirmacion = window.confirm('¿Estás seguro de que deseas eliminar este proveedor?');
      if (!confirmacion) return; // Si el usuario cancela, no hacer nada

      await axios.delete(`http://localhost:3040/person/${id}`); // Llama al endpoint deletePerson
      cargarProveedores(); // Actualiza la lista de proveedores
      alert('Proveedor eliminado correctamente');
  } catch (error) {
      console.error('Error al eliminar proveedor:', error);
      alert('Error al eliminar proveedor');
  }
};

  return (
    <div className="container mx-auto p-4">
      <Header />
      <h1 className="text-2xl font-bold mb-4">Gestión de Proveedores</h1>
      <form id="form-Prov" onSubmit={modoEdicion ? actualizarProveedor : crearProveedor} className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="nombre"
            placeholder="Nombre"
            value={formulario.nombre}
            onChange={manejarCambioFormulario}
            required
            className="border p-2 rounded"
          />
          <input
            type="text"
            name="apellido"
            placeholder="Apellido"
            value={formulario.apellido}
            onChange={manejarCambioFormulario}
            required
            className="border p-2 rounded"
          />
          <input
            type="text"
            name="cedula"
            placeholder="Cédula"
            value={formulario.cedula}
            onChange={manejarCambioFormulario}
            required
            className="border p-2 rounded"
          />
          <input
            type="text"
            name="direccion"
            placeholder="Dirección"
            value={formulario.direccion || ''}
            onChange={manejarCambioFormulario}
            className="border p-2 rounded"
          />
          <input
            type="text"
            name="telefonos"
            placeholder="Teléfonos"
            value={formulario.telefonos || ''}
            onChange={manejarCambioFormulario}
            className="border p-2 rounded"
          />
          <input
            type="text"
            name="celular"
            placeholder="Celular"
            value={formulario.celular || ''}
            onChange={manejarCambioFormulario}
            className="border p-2 rounded"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formulario.email || ''}
            onChange={manejarCambioFormulario}
            className="border p-2 rounded"
          />
        </div>
        <div className="mt-4">
          <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2">
            {modoEdicion ? 'Actualizar' : 'Crear'}
          </button>
          {modoEdicion && (
            <button type="button" onClick={() => { limpiarFormulario(); setModoEdicion(false); }} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">
              Cancelar Edición
            </button>
          )}
        </div>
      </form>
      <br />
      <hr />
      <br />
      <h1 className="text-2xl font-bold mb-4">Lista de Proveedores</h1>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar proveedores..."
          value={terminoBusqueda}
          onChange={manejarCambioBusqueda}
          className="border p-2 rounded w-full"
        />
      </div>
      <div>
        <DataTable
          columns={columns}
          data={proveedores}
          pagination
          paginationServer
          paginationTotalRows={totalFilas}
          paginationPerPage={proveedoresPorPagina}
          onChangePage={manejarCambioPagina}
          onChangeRowsPerPage={manejarCambioPorPagina}
          paginationRowsPerPageOptions={[5, 10, 15, 20, 25]} // Opciones de filas por página

        />
      </div>
      <Footer />
    </div>
  );
};

export default Page;