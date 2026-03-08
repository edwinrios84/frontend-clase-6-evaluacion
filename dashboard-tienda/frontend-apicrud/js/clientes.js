// ============================================================================
// Módulo: Clientes (CRUD completo)
// Archivo sugerido: js/clientes.js
// Descripción general:
//   - Funciona en listado-clientes.html y crear-cliente.html.
//   - En listado-clientes.html: lista clientes, permite buscar, editar y eliminar.
//   - En crear-cliente.html: permite crear un nuevo cliente o editar uno existente,
//     dependiendo de si viene un parámetro ?id= en la URL.
//   - Consume la API REST (Node + MySQL) sobre la BD tienda_db, tabla "clientes".
// ============================================================================

// URL base de la API del backend.
// Si cambias el puerto/host en tu servidor Node, actualiza esta constante.
const apiBaseUrl = "http://localhost:3000/api";

// Arreglo en memoria para listado de clientes (se usa para búsqueda sin recargar).
let listaClientes = [];

/**
 * Punto de entrada principal: se ejecuta cuando el DOM está listo.
 * Detecta en qué página estamos y activa solo la funcionalidad necesaria.
 */
document.addEventListener("DOMContentLoaded", () => {
  // Detectar si estamos en la página de listado (existe #tabla-clientes)
  const tablaClientesBody = document.querySelector("#tabla-clientes");

  // Detectar si estamos en la página de crear/editar (existe #formulario-cliente)
  const formularioCliente = document.querySelector("#formulario-cliente");

  // Campo de búsqueda (en listado-clientes.html)
  const campoBusqueda = document.querySelector(
    'input[type="search"][placeholder="Buscar Cliente"]'
  );

  // Si existe el tbody de clientes, configuramos la lógica de listado/búsqueda
  if (tablaClientesBody) {
    inicializarListadoClientes(tablaClientesBody, campoBusqueda);
  }

  // Si existe el formulario, configuramos la lógica de crear/editar
  if (formularioCliente) {
    inicializarFormularioCliente(formularioCliente);
  }
});

// ============================================================================
// SECCIÓN 1: LÓGICA PARA LISTADO DE CLIENTES
// ============================================================================

/**
 * Inicializa el listado de clientes: carga datos y configura la búsqueda.
 * @param {HTMLElement} tablaClientesBody - Elemento <tbody> donde se dibujan las filas.
 * @param {HTMLInputElement|null} campoBusqueda - Input de búsqueda (puede ser null).
 */
function inicializarListadoClientes(tablaClientesBody, campoBusqueda) {
  // Cargar clientes desde la API al iniciar la página
  cargarClientesDesdeApi(tablaClientesBody);

  // Configurar filtro de búsqueda si el campo existe
  if (campoBusqueda) {
    campoBusqueda.addEventListener("input", (evento) => {
      const terminoBusqueda = evento.target.value.trim().toLowerCase();
      filtrarClientes(tablaClientesBody, terminoBusqueda);
    });
  }
}

/**
 * Llama a la API para obtener todos los clientes y los renderiza en la tabla.
 * @param {HTMLElement} tablaClientesBody - Elemento <tbody> de la tabla de clientes.
 */
async function cargarClientesDesdeApi(tablaClientesBody) {
  try {
    const respuesta = await fetch(`${apiBaseUrl}/clientes`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!respuesta.ok) {
      throw new Error(
        `Error al consultar clientes. Código HTTP: ${respuesta.status}`
      );
    }

    const clientes = await respuesta.json();

    // Garantizar que sea un arreglo
    listaClientes = Array.isArray(clientes) ? clientes : [];

    // Renderizar tabla completa
    renderizarTablaClientes(tablaClientesBody, listaClientes);
  } catch (error) {
    console.error("Error obteniendo clientes desde la API:", error);
    mostrarMensajeErrorClientes(
      tablaClientesBody,
      "No se pudieron cargar los clientes. Intenta de nuevo más tarde."
    );
  }
}

/**
 * Filtra la lista en memoria de clientes por nombre, apellido o email.
 * @param {HTMLElement} tablaClientesBody - Elemento <tbody> de la tabla.
 * @param {string} terminoBusqueda - Texto ingresado por el usuario.
 */
function filtrarClientes(tablaClientesBody, terminoBusqueda) {
  if (!terminoBusqueda) {
    renderizarTablaClientes(tablaClientesBody, listaClientes);
    return;
  }

  const clientesFiltrados = listaClientes.filter((cliente) => {
    const nombre = String(cliente.nombre || "").toLowerCase();
    const apellido = String(cliente.apellido || "").toLowerCase();
    const email = String(cliente.email || "").toLowerCase();

    return (
      nombre.includes(terminoBusqueda) ||
      apellido.includes(terminoBusqueda) ||
      email.includes(terminoBusqueda)
    );
  });

  renderizarTablaClientes(tablaClientesBody, clientesFiltrados);
}

/**
 * Dibuja las filas de la tabla de clientes en el DOM.
 * @param {HTMLElement} tablaClientesBody - Elemento <tbody> donde se agregan las filas.
 * @param {Array<Object>} clientesParaMostrar - Lista de clientes a renderizar.
 */
function renderizarTablaClientes(tablaClientesBody, clientesParaMostrar) {
  // Limpiar contenido actual
  tablaClientesBody.innerHTML = "";

  // Si no hay clientes, mostrar mensaje
  if (!clientesParaMostrar || clientesParaMostrar.length === 0) {
    const filaVacia = document.createElement("tr");
    const celdaMensaje = document.createElement("td");
    celdaMensaje.colSpan = 7;
    celdaMensaje.classList.add("text-center", "text-muted");
    celdaMensaje.textContent = "No hay clientes para mostrar.";
    filaVacia.appendChild(celdaMensaje);
    tablaClientesBody.appendChild(filaVacia);
    return;
  }

  // Recorrer lista de clientes
  clientesParaMostrar.forEach((cliente, indice) => {
    // Detectar el ID del cliente de forma flexible, por si la API usa otros nombres de campo
    const clienteId =
      cliente.id ??
      cliente.id_cliente ??
      cliente.idCliente ??
      cliente.cliente_id;

    const fila = document.createElement("tr");

    // Columna: #
    const celdaIndice = document.createElement("td");
    celdaIndice.textContent = indice + 1;

    // Columna: Nombre
    const celdaNombre = document.createElement("td");
    celdaNombre.textContent = cliente.nombre ?? "";

    // Columna: Apellido
    const celdaApellido = document.createElement("td");
    celdaApellido.textContent = cliente.apellido ?? "";

    // Columna: Email
    const celdaEmail = document.createElement("td");
    celdaEmail.textContent = cliente.email ?? "";

    // Columna: Celular
    const celdaCelular = document.createElement("td");
    celdaCelular.textContent = cliente.celular ?? "";

    // Columna: Dirección (principal)
    const celdaDireccion = document.createElement("td");
    celdaDireccion.textContent = cliente.direccion ?? "";

    // Columna: Acciones
    const celdaAcciones = document.createElement("td");
    celdaAcciones.classList.add("d-flex", "gap-2");

    // Botón Editar -> redirige a crear-cliente.html?id=ID
    const botonEditar = document.createElement("a");
    botonEditar.href = `crear-cliente.html?id=${clienteId}`;
    botonEditar.textContent = "Editar";
    botonEditar.classList.add("btn", "btn-sm", "btn-warning", "mr-2");

    // Botón Eliminar -> llama DELETE /api/clientes/:id
    const botonEliminar = document.createElement("button");
    botonEliminar.type = "button";
    botonEliminar.textContent = "Eliminar";
    botonEliminar.classList.add("btn", "btn-sm", "btn-danger");

    botonEliminar.addEventListener("click", async () => {
      const confirmarEliminar = confirm(
        `¿Seguro que deseas eliminar el cliente "${cliente.nombre} ${cliente.apellido}" (ID: ${clienteId})?`
      );

      if (!confirmarEliminar) {
        return;
      }

      try {
        const respuesta = await fetch(`${apiBaseUrl}/clientes/${clienteId}`, {
          method: "DELETE"
        });

        if (!respuesta.ok) {
          throw new Error(
            `Error al eliminar cliente. Código HTTP: ${respuesta.status}`
          );
        }

        alert("Cliente eliminado con éxito.");
        // Volver a cargar lista desde la API
        cargarClientesDesdeApi(tablaClientesBody);
      } catch (error) {
        console.error("Error al eliminar cliente:", error);
        alert("No se pudo eliminar el cliente. Intenta de nuevo.");
      }
    });

    celdaAcciones.appendChild(botonEditar);
    celdaAcciones.appendChild(botonEliminar);

    // Agregar celdas a la fila
    fila.appendChild(celdaIndice);
    fila.appendChild(celdaNombre);
    fila.appendChild(celdaApellido);
    fila.appendChild(celdaEmail);
    fila.appendChild(celdaCelular);
    fila.appendChild(celdaDireccion);
    fila.appendChild(celdaAcciones);

    // Agregar fila al tbody
    tablaClientesBody.appendChild(fila);
  });
}

/**
 * Muestra un mensaje de error dentro de la tabla de clientes.
 * @param {HTMLElement} tablaClientesBody - Elemento <tbody> de la tabla.
 * @param {string} mensaje - Texto de error a mostrar.
 */
function mostrarMensajeErrorClientes(tablaClientesBody, mensaje) {
  tablaClientesBody.innerHTML = "";

  const filaError = document.createElement("tr");
  const celdaError = document.createElement("td");
  celdaError.colSpan = 7;
  celdaError.classList.add("text-center", "text-danger");
  celdaError.textContent = mensaje;

  filaError.appendChild(celdaError);
  tablaClientesBody.appendChild(filaError);
}

// ============================================================================
// SECCIÓN 2: LÓGICA PARA CREAR / EDITAR CLIENTES
// ============================================================================

/**
 * Inicializa el formulario de cliente:
 * - Detecta si hay ?id= en la URL para modo edición.
 * - Carga datos del cliente si es edición.
 * - Configura el submit para crear/actualizar.
 * @param {HTMLFormElement} formularioCliente - Formulario de crear/editar cliente.
 */
function inicializarFormularioCliente(formularioCliente) {
  // Referencias a inputs
  const inputNombre = document.querySelector("#nombre-cli");
  const inputApellido = document.querySelector("#apellido-cli");
  const inputEmail = document.querySelector("#email-cli");
  const inputCelular = document.querySelector("#celular-cli");
  const inputDireccion = document.querySelector("#direccion-cli");
  const inputDireccion2 = document.querySelector("#direccion2-cli");
  const inputDescripcion = document.querySelector("#descripcion-cli");
  const botonSubmit = formularioCliente.querySelector("button[type='submit']");

  // Validar que existan todos los campos básicos
  if (
    !inputNombre ||
    !inputApellido ||
    !inputEmail ||
    !inputCelular ||
    !inputDireccion ||
    !inputDescripcion
  ) {
    console.error(
      "No se encontraron todos los campos requeridos del formulario de cliente."
    );
    return;
  }

  // Detectar si venimos con ?id= para editar
  const parametrosUrl = new URLSearchParams(window.location.search);
  const clienteId = parametrosUrl.get("id");

  if (clienteId) {
    // Modo edición
    if (botonSubmit) {
      botonSubmit.textContent = "Actualizar Cliente";
    }
    // Opcional: cambiar título visual
    const tituloPagina = document.querySelector("h1.h3");
    if (tituloPagina) {
      tituloPagina.textContent = "Editar Cliente";
    }

    // Cargar datos del cliente para edición
    cargarClienteParaEdicion(
      clienteId,
      inputNombre,
      inputApellido,
      inputEmail,
      inputCelular,
      inputDireccion,
      inputDireccion2,
      inputDescripcion
    );
  }

  // Manejador de envío de formulario (crear/actualizar)
  formularioCliente.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const datosCliente = construirDatosCliente(
      inputNombre,
      inputApellido,
      inputEmail,
      inputCelular,
      inputDireccion,
      inputDireccion2,
      inputDescripcion
    );

    if (!validarDatosCliente(datosCliente)) {
      // Si la validación falla, se detiene aquí.
      return;
    }

    try {
      if (clienteId) {
        // Actualizar cliente existente
        await actualizarCliente(clienteId, datosCliente);
        alert("Cliente actualizado correctamente.");
      } else {
        // Crear nuevo cliente
        await crearCliente(datosCliente);
        alert("Cliente creado correctamente.");
      }

      // Redirigir al listado de clientes después de guardar
      window.location.href = "listado-clientes.html";
    } catch (error) {
      console.error("Error al guardar cliente:", error);
      alert("Ocurrió un error al guardar el cliente. Intenta de nuevo.");
    }
  });
}

/**
 * Carga un cliente existente desde la API para rellenar el formulario en modo edición.
 * @param {string} clienteId - ID del cliente en la base de datos.
 * @param {HTMLInputElement} inputNombre
 * @param {HTMLInputElement} inputApellido
 * @param {HTMLInputElement} inputEmail
 * @param {HTMLInputElement} inputCelular
 * @param {HTMLInputElement} inputDireccion
 * @param {HTMLInputElement|null} inputDireccion2
 * @param {HTMLTextAreaElement} inputDescripcion
 */
async function cargarClienteParaEdicion(
  clienteId,
  inputNombre,
  inputApellido,
  inputEmail,
  inputCelular,
  inputDireccion,
  inputDireccion2,
  inputDescripcion
) {
  try {
    const respuesta = await fetch(`${apiBaseUrl}/clientes/${clienteId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!respuesta.ok) {
      throw new Error(
        `Error al obtener cliente. Código HTTP: ${respuesta.status}`
      );
    }

    const cliente = await respuesta.json();

    inputNombre.value = cliente.nombre ?? "";
    inputApellido.value = cliente.apellido ?? "";
    inputEmail.value = cliente.email ?? "";
    inputCelular.value = cliente.celular ?? "";
    inputDireccion.value = cliente.direccion ?? "";

    if (inputDireccion2) {
      inputDireccion2.value = cliente.direccion2 ?? "";
    }

    inputDescripcion.value = cliente.descripcion ?? "";
  } catch (error) {
    console.error("Error al cargar cliente para edición:", error);
    alert("No se pudo cargar la información del cliente.");
  }
}

/**
 * Construye el objeto de datos que se enviará al backend con la info del formulario.
 * @returns {{nombre:string, apellido:string, email:string, celular:string, direccion:string, direccion2?:string, descripcion:string}}
 */
function construirDatosCliente(
  inputNombre,
  inputApellido,
  inputEmail,
  inputCelular,
  inputDireccion,
  inputDireccion2,
  inputDescripcion
) {
  return {
    nombre: inputNombre.value.trim(),
    apellido: inputApellido.value.trim(),
    email: inputEmail.value.trim(),
    celular: inputCelular.value.trim(),
    direccion: inputDireccion.value.trim(),
    direccion2: inputDireccion2 ? inputDireccion2.value.trim() : "",
    descripcion: inputDescripcion.value.trim()
  };
}

/**
 * Valida los datos del cliente antes de enviarlos al backend.
 * Muestra alerts en caso de error.
 * @param {Object} datosCliente
 * @returns {boolean} true si es válido, false en caso contrario.
 */
function validarDatosCliente(datosCliente) {
  if (!datosCliente.nombre) {
    alert("El nombre es obligatorio.");
    return false;
  }

  if (!datosCliente.apellido) {
    alert("El apellido es obligatorio.");
    return false;
  }

  if (!datosCliente.email) {
    alert("El email es obligatorio.");
    return false;
  }

  // Validación muy básica de email (solo para evitar campos muy incorrectos)
  const patronEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!patronEmail.test(datosCliente.email)) {
    alert("Ingresa un email válido.");
    return false;
  }

  if (!datosCliente.celular) {
    alert("El celular es obligatorio.");
    return false;
  }

  // Validación básica de números para celular (opcionalmente puedes ajustarla)
  const soloNumeros = datosCliente.celular.replace(/\D/g, "");
  if (soloNumeros.length < 7) {
    alert("Ingresa un número de celular válido (mínimo 7 dígitos).");
    return false;
  }

  if (!datosCliente.direccion) {
    alert("La dirección principal es obligatoria.");
    return false;
  }

  return true;
}

/**
 * Envía una petición POST para crear un nuevo cliente.
 * @param {Object} datosCliente - Datos del cliente a crear.
 */
async function crearCliente(datosCliente) {
  const respuesta = await fetch(`${apiBaseUrl}/clientes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(datosCliente)
  });

  if (!respuesta.ok) {
    const textoError = await respuesta.text();
    throw new Error(`Error al crear cliente: ${textoError}`);
  }
}

/**
 * Envía una petición PUT para actualizar un cliente existente.
 * @param {string} clienteId - ID del cliente a actualizar.
 * @param {Object} datosCliente - Datos actualizados del cliente.
 */
async function actualizarCliente(clienteId, datosCliente) {
  const respuesta = await fetch(`${apiBaseUrl}/clientes/${clienteId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(datosCliente)
  });

  if (!respuesta.ok) {
    const textoError = await respuesta.text();
    throw new Error(`Error al actualizar cliente: ${textoError}`);
  }
}