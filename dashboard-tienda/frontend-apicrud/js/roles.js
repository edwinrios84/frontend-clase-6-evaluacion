// ============================================================================
// Módulo: Roles (CRUD completo sobre tabla "roles")
// Archivo: js/roles.js
// Descripción general:
//   - Funciona en listado-usuarios.html y crear-usuario.html.
//   - Consume la API REST /api/usuarios, que en backend opera sobre la tabla "roles".
//   - Permite consultar, listar, crear, editar y eliminar registros.
// ============================================================================

// URL base de la API del backend.
const apiBaseUrl = "http://localhost:3000/api";

// Arreglo en memoria para búsqueda local de registros.
let listaRoles = [];

/**
 * Punto de entrada del módulo.
 * Detecta en qué página estamos y activa solo la lógica necesaria.
 */
document.addEventListener("DOMContentLoaded", () => {
  const tablaUsuariosBody = document.querySelector("#tabla-usuarios");
  const formularioUsuario = document.querySelector("#formulario-usuario");
  const campoBusqueda = document.querySelector('input[type="search"][placeholder="Buscar Usuario"]');

  if (tablaUsuariosBody) {
    inicializarListadoRoles(tablaUsuariosBody, campoBusqueda);
  }

  if (formularioUsuario) {
    inicializarFormularioRoles(formularioUsuario);
  }
});

// ============================================================================
// SECCIÓN 1: LISTADO, CONSULTA Y ELIMINACIÓN
// ============================================================================

/**
 * Inicializa la pantalla de listado.
 * @param {HTMLElement} tablaUsuariosBody
 * @param {HTMLInputElement|null} campoBusqueda
 */
function inicializarListadoRoles(tablaUsuariosBody, campoBusqueda) {
  cargarRolesDesdeApi(tablaUsuariosBody);

  if (campoBusqueda) {
    campoBusqueda.addEventListener("input", (evento) => {
      const terminoBusqueda = evento.target.value.trim().toLowerCase();
      filtrarRoles(tablaUsuariosBody, terminoBusqueda);
    });
  }
}

/**
 * Consulta todos los registros desde la API.
 * @param {HTMLElement} tablaUsuariosBody
 */
async function cargarRolesDesdeApi(tablaUsuariosBody) {
  try {
    const respuesta = await fetch(`${apiBaseUrl}/usuarios`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    if (!respuesta.ok) {
      throw new Error(`Error al consultar roles. Código HTTP: ${respuesta.status}`);
    }

    const roles = await respuesta.json();
    listaRoles = Array.isArray(roles) ? roles : [];
    renderizarTablaRoles(tablaUsuariosBody, listaRoles);
  } catch (error) {
    console.error("Error al consultar roles:", error);
    mostrarMensajeErrorRoles(tablaUsuariosBody, "No se pudieron cargar los roles. Intenta de nuevo.");
  }
}

/**
 * Filtra los registros en memoria por usuario o rol.
 * @param {HTMLElement} tablaUsuariosBody
 * @param {string} terminoBusqueda
 */
function filtrarRoles(tablaUsuariosBody, terminoBusqueda) {
  if (!terminoBusqueda) {
    renderizarTablaRoles(tablaUsuariosBody, listaRoles);
    return;
  }

  const rolesFiltrados = listaRoles.filter((registro) => {
    const usuario = String(registro.usuario || "").toLowerCase();
    const rol = String(registro.rol || "").toLowerCase();
    return usuario.includes(terminoBusqueda) || rol.includes(terminoBusqueda);
  });

  renderizarTablaRoles(tablaUsuariosBody, rolesFiltrados);
}

/**
 * Renderiza la tabla de registros.
 * @param {HTMLElement} tablaUsuariosBody
 * @param {Array<Object>} rolesParaMostrar
 */
function renderizarTablaRoles(tablaUsuariosBody, rolesParaMostrar) {
  tablaUsuariosBody.innerHTML = "";

  if (!rolesParaMostrar || rolesParaMostrar.length === 0) {
    const filaVacia = document.createElement("tr");
    const celdaMensaje = document.createElement("td");
    celdaMensaje.colSpan = 5;
    celdaMensaje.classList.add("text-center", "text-muted");
    celdaMensaje.textContent = "No hay registros para mostrar.";
    filaVacia.appendChild(celdaMensaje);
    tablaUsuariosBody.appendChild(filaVacia);
    return;
  }

  rolesParaMostrar.forEach((registro, indice) => {
    const rolId = registro.id ?? registro.id_rol ?? registro.rol_id;
    const fila = document.createElement("tr");

    const celdaIndice = document.createElement("td");
    celdaIndice.textContent = indice + 1;

    const celdaUsuario = document.createElement("td");
    celdaUsuario.textContent = registro.usuario ?? "";

    const celdaRol = document.createElement("td");
    celdaRol.textContent = registro.rol ?? "";

    const celdaCreado = document.createElement("td");
    celdaCreado.textContent = formatearFechaRegistro(registro.created_at || registro.createdAt || registro.creado);

    const celdaAcciones = document.createElement("td");
    celdaAcciones.classList.add("d-flex", "gap-2");

    const botonEditar = document.createElement("a");
    botonEditar.href = `crear-usuario.html?id=${rolId}`;
    botonEditar.textContent = "Editar";
    botonEditar.classList.add("btn", "btn-sm", "btn-warning", "mr-2");

    const botonEliminar = document.createElement("button");
    botonEliminar.type = "button";
    botonEliminar.textContent = "Eliminar";
    botonEliminar.classList.add("btn", "btn-sm", "btn-danger");

    botonEliminar.addEventListener("click", async () => {
      const confirmar = confirm(`¿Seguro que deseas eliminar el registro "${registro.usuario}" (ID: ${rolId})?`);
      if (!confirmar) {
        return;
      }

      try {
        await eliminarRol(rolId);
        alert("Registro eliminado con éxito.");
        await cargarRolesDesdeApi(tablaUsuariosBody);
      } catch (error) {
        console.error("Error al eliminar registro:", error);
        alert(error.message || "No se pudo eliminar el registro.");
      }
    });

    celdaAcciones.appendChild(botonEditar);
    celdaAcciones.appendChild(botonEliminar);

    fila.appendChild(celdaIndice);
    fila.appendChild(celdaUsuario);
    fila.appendChild(celdaRol);
    fila.appendChild(celdaCreado);
    fila.appendChild(celdaAcciones);

    tablaUsuariosBody.appendChild(fila);
  });
}

/**
 * Muestra un mensaje de error en la tabla.
 * @param {HTMLElement} tablaUsuariosBody
 * @param {string} mensaje
 */
function mostrarMensajeErrorRoles(tablaUsuariosBody, mensaje) {
  tablaUsuariosBody.innerHTML = "";
  const filaError = document.createElement("tr");
  const celdaError = document.createElement("td");
  celdaError.colSpan = 5;
  celdaError.classList.add("text-center", "text-danger");
  celdaError.textContent = mensaje;
  filaError.appendChild(celdaError);
  tablaUsuariosBody.appendChild(filaError);
}

/**
 * Formatea una fecha para mostrarla en pantalla.
 * @param {string|Date|undefined|null} fechaRegistro
 * @returns {string}
 */
function formatearFechaRegistro(fechaRegistro) {
  if (!fechaRegistro) {
    return "-";
  }

  try {
    const fecha = new Date(fechaRegistro);
    if (isNaN(fecha.getTime())) {
      return String(fechaRegistro);
    }
    return fecha.toLocaleString("es-CO");
  } catch (error) {
    return String(fechaRegistro);
  }
}

// ============================================================================
// SECCIÓN 2: CREACIÓN Y EDICIÓN
// ============================================================================

/**
 * Inicializa el formulario de creación/edición.
 * @param {HTMLFormElement} formularioUsuario
 */
function inicializarFormularioRoles(formularioUsuario) {
  const selectRol = document.querySelector("#rol");
  const inputUsuario = document.querySelector("#usuario");
  const inputContrasena = document.querySelector("#contrasena");
  const inputConfirmarContrasena = document.querySelector("#confirmar_contrasena");
  const botonSubmit = formularioUsuario.querySelector("button[type='submit']");

  if (!selectRol || !inputUsuario || !inputContrasena || !inputConfirmarContrasena) {
    console.error("No se encontraron todos los campos requeridos del formulario.");
    return;
  }

  const parametrosUrl = new URLSearchParams(window.location.search);
  const rolId = parametrosUrl.get("id");

  if (rolId) {
    if (botonSubmit) {
      botonSubmit.textContent = "Actualizar Usuario";
    }
    const tituloPagina = document.querySelector("h1.h3");
    if (tituloPagina) {
      tituloPagina.textContent = "Editar Usuario";
    }

    inputContrasena.required = false;
    inputConfirmarContrasena.required = false;

    cargarRolParaEdicion(rolId, selectRol, inputUsuario);
  }

  formularioUsuario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const datosRol = construirDatosRol(selectRol, inputUsuario, inputContrasena, inputConfirmarContrasena, Boolean(rolId));
    if (!validarDatosRol(datosRol, Boolean(rolId))) {
      return;
    }

    try {
      if (rolId) {
        await actualizarRol(rolId, datosRol);
        alert("Registro actualizado correctamente.");
      } else {
        await crearRol(datosRol);
        alert("Registro creado correctamente.");
      }
      window.location.href = "listado-usuarios.html";
    } catch (error) {
      console.error("Error al guardar registro:", error);
      alert(error.message || "Ocurrió un error al guardar el registro.");
    }
  });
}

/**
 * Consulta un registro por ID y rellena el formulario en modo edición.
 * @param {string} rolId
 * @param {HTMLSelectElement} selectRol
 * @param {HTMLInputElement} inputUsuario
 */
async function cargarRolParaEdicion(rolId, selectRol, inputUsuario) {
  try {
    const respuesta = await fetch(`${apiBaseUrl}/usuarios/${rolId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    if (!respuesta.ok) {
      throw new Error(`Error al consultar registro. Código HTTP: ${respuesta.status}`);
    }

    const registro = await respuesta.json();
    selectRol.value = registro.rol ?? "";
    inputUsuario.value = registro.usuario ?? "";
  } catch (error) {
    console.error("Error al cargar registro para edición:", error);
    alert("No se pudo cargar la información del registro.");
  }
}

/**
 * Construye el payload para crear o editar.
 * @param {HTMLSelectElement} selectRol
 * @param {HTMLInputElement} inputUsuario
 * @param {HTMLInputElement} inputContrasena
 * @param {HTMLInputElement} inputConfirmarContrasena
 * @param {boolean} esEdicion
 * @returns {{rol:string, usuario:string, contrasena:string}}
 */
function construirDatosRol(selectRol, inputUsuario, inputContrasena, inputConfirmarContrasena, esEdicion) {
  const contrasenaLimpia = inputContrasena.value.trim();
  const payload = {
    rol: selectRol.value.trim(),
    usuario: inputUsuario.value.trim(),
    contrasena: contrasenaLimpia
  };

  if (esEdicion && !contrasenaLimpia) {
    // Si estamos editando y no envían contraseña, el backend conserva la actual.
    delete payload.contrasena;
  }

  payload.confirmarContrasena = inputConfirmarContrasena.value.trim();
  return payload;
}

/**
 * Valida los datos antes de enviar a la API.
 * @param {Object} datosRol
 * @param {boolean} esEdicion
 * @returns {boolean}
 */
function validarDatosRol(datosRol, esEdicion) {
  if (!datosRol.rol || datosRol.rol === "Seleccionar Rol") {
    alert("Debes seleccionar un rol.");
    return false;
  }

  if (!datosRol.usuario) {
    alert("El usuario es obligatorio.");
    return false;
  }

  if (!esEdicion && !datosRol.contrasena) {
    alert("La contraseña es obligatoria para crear el registro.");
    return false;
  }

  if (datosRol.contrasena && datosRol.contrasena.length < 4) {
    alert("La contraseña debe tener al menos 4 caracteres.");
    return false;
  }

  if (datosRol.contrasena !== undefined && datosRol.contrasena !== datosRol.confirmarContrasena) {
    alert("La contraseña y su confirmación no coinciden.");
    return false;
  }

  return true;
}

/**
 * Crea un registro en la tabla roles.
 * @param {Object} datosRol
 */
async function crearRol(datosRol) {
  const payload = { ...datosRol };
  delete payload.confirmarContrasena;

  const respuesta = await fetch(`${apiBaseUrl}/usuarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!respuesta.ok) {
    const textoError = await respuesta.text();
    throw new Error(`Error al crear registro: ${textoError}`);
  }
}

/**
 * Actualiza un registro existente en la tabla roles.
 * @param {string} rolId
 * @param {Object} datosRol
 */
async function actualizarRol(rolId, datosRol) {
  const payload = { ...datosRol };
  delete payload.confirmarContrasena;

  const respuesta = await fetch(`${apiBaseUrl}/usuarios/${rolId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!respuesta.ok) {
    const textoError = await respuesta.text();
    throw new Error(`Error al actualizar registro: ${textoError}`);
  }
}

/**
 * Elimina un registro por ID.
 * @param {string|number} rolId
 */
async function eliminarRol(rolId) {
  const respuesta = await fetch(`${apiBaseUrl}/usuarios/${rolId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" }
  });

  if (!respuesta.ok) {
    const textoError = await respuesta.text();
    throw new Error(`Error al eliminar registro: ${textoError}`);
  }
}
