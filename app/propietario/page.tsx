"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import Header from "../components/Header"
import Footer from '../components/Footer';

interface Propietario {
  id: number;
  nombre: string;
  apellido: string;
  cedula: string;
  direccion?: string;
  telefonos?: string;
  celular?: string;
  email?: string;
  status?: string;
  tipo: 'Propietario';
}

const Page = () => {
  const [propietario, setPropietario] = useState<Propietario[]>([]);
  const [formulario, setFormulario] = useState<Propietario>({
    id: 0,
    nombre: '',
    apellido: '',
    cedula: '',
    direccion: '',
    telefonos: '',
    celular: '',
    email: '',
    tipo: 'Propietario',
  });
  const [modoEdicion, setModoEdicion] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const [propietariosPorPagina, setPropietariosPorPagina] = useState(5);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [totalFilas, setTotalFilas] = useState<number>(0);

  useEffect(() => {
    cargarPropietarios();
  }, [paginaActual, propietariosPorPagina, terminoBusqueda]);

  const cargarPropietarios = async () => {
    try {
        const url = `http://localhost:3040/person?page=${paginaActual}&limit=${propietariosPorPagina}&search=${encodeURIComponent(terminoBusqueda)}&tipo=Propietario`;
        console.log('URL de carga de propietarioes:', url); // Depuración

        const respuesta = await axios.get(url);
        console.log('Respuesta de la API:', respuesta.data); // Depuración

        setPropietario(respuesta.data.rows); // Actualiza el estado con los datos recibidos
        setTotalFilas(respuesta.data.count); // Actualiza el total de filas
    } catch (error) {
        console.error('Error al cargar propietarioes:', error);
        if (axios.isAxiosError(error)) {
            console.error('Detalles del error:', error.response?.data);
        }
    }
};

  const manejarCambioPagina = (nuevaPagina: number) => {
    setPaginaActual(nuevaPagina);
  };

  const manejarCambioPorPagina = (nuevaCantidad: number) => {
    setPropietariosPorPagina(nuevaCantidad);
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

  const manejarEditarPropietario = (propietario: Propietario) => {
    setFormulario(propietario);
    setModoEdicion(true);
    const formulario = document.getElementById('form-Prov');
    if (formulario) {
      formulario.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const crearPropietario = async () => {
    try {
      const formularioSinId = { ...formulario };
      delete formularioSinId.id;
      await axios.post('http://localhost:3040/person', formularioSinId);
      cargarPropietarios();
      limpiarFormulario();
    } catch (error) {
      console.error('Error al crear propietario:', error);
    }
  };

  const actualizarPropietario = async () => {
    try {
      await axios.put(`http://localhost:3040/person/${formulario.id}`, formulario);
      cargarPropietarios();
      limpiarFormulario();
      setModoEdicion(false);
    } catch (error) {
      console.error('Error al actualizar propietario:', error);
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
      tipo: 'Propietario',
    });
  };

  const columns = [
    { name: 'Nombre', selector: row => row.nombre, sortable: true },
    { name: 'Apellido', selector: row => row.apellido, sortable: true },
    { name: 'Cédula', selector: row => row.cedula, sortable: true },
    {
      name: 'Status',
      cell: (fila: Propietario) => (
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
        cell: (fila: Propietario) => (
            <div>
                <button
                    onClick={() => manejarEditarPropietario(fila)}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded mr-2"
                >
                    Editar
                </button>
                <button
                    onClick={() => eliminarPropietario(fila.id)}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
                >
                    Eliminar
                </button>
            </div>
        ),
    },
];
  
const eliminarPropietario = async (id: number) => {
  try {
      const confirmacion = window.confirm('¿Estás seguro de que deseas eliminar este propietario?');
      if (!confirmacion) return; // Si el usuario cancela, no hacer nada

      await axios.delete(`http://localhost:3040/person/${id}`); // Llama al endpoint deletePerson
      cargarPropietarios(); 
      alert('Propietario eliminado correctamente');
  } catch (error) {
      console.error('Error al eliminar propietario:', error);
      alert('Error al eliminar propietario');
  }
};

  return (
    <div className="container mx-auto p-4">
      <Header />
      <h1 className="text-2xl font-bold mb-4">Gestión de Propietarios</h1>
      <form id="form-Prov" onSubmit={modoEdicion ? actualizarPropietario : crearPropietario} className="mb-4">
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
      <h1 className="text-2xl font-bold mb-4">Lista de Propietarios</h1>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar propietarioes..."
          value={terminoBusqueda}
          onChange={manejarCambioBusqueda}
          className="border p-2 rounded w-full"
        />
      </div>
      <div>
        <DataTable
          columns={columns}
          data={propietario}
          pagination
          paginationServer
          paginationTotalRows={totalFilas}
          paginationPerPage={propietariosPorPagina}
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