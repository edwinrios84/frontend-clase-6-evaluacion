// ============================================================================
// Módulo: Listado de Productos
// Archivo: js/listado-pro.js
// Descripción:
//   - Consume la API REST de la tienda (Node + MySQL).
//   - Obtiene el listado de productos desde la tabla "productos" de la BD.
//   - Dibuja las filas dentro de la tabla en listado-pro.html.
//   - Implementa un filtro de búsqueda por nombre y descripción.
// ============================================================================

// URL base de la API del backend.
// Si cambias el puerto o el host en server.js, actualiza esta constante.
const apiBaseUrl = "http://localhost:3000/api";

// Arreglo en memoria donde se guardan todos los productos traídos desde la API.
// Se usa para filtrar sin volver a llamar al servidor.
let listaProductos = [];

/**
 * Inicializa los eventos y carga inicial de datos
 * cuando el DOM está listo.
 */
document.addEventListener("DOMContentLoaded", () => {
  // Referencias a elementos del DOM
  const tablaProductosBody = document.querySelector("table.table tbody");
  const campoBusqueda = document.querySelector('input[type="search"]');

  // Validación básica por si cambia la estructura del HTML.
  if (!tablaProductosBody) {
    console.error("No se encontró el cuerpo de la tabla de productos (<tbody>).");
    return;
  }

  if (!campoBusqueda) {
    console.warn("No se encontró el campo de búsqueda de productos.");
  }

  // Cargar productos desde la API al iniciar la página
  cargarProductos(tablaProductosBody);

  // Configurar filtro de búsqueda (si el input existe)
  if (campoBusqueda) {
    campoBusqueda.addEventListener("input", (evento) => {
      const terminoBusqueda = evento.target.value.trim().toLowerCase();
      filtrarProductos(tablaProductosBody, terminoBusqueda);
    });
  }
});

/**
 * Llama a la API REST para obtener todos los productos.
 * @param {HTMLElement} tablaProductosBody - Elemento <tbody> donde se insertarán las filas.
 */
async function cargarProductos(tablaProductosBody) {
  try {
    const respuesta = await fetch(`${apiBaseUrl}/productos`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    // Verificar si la respuesta fue exitosa (código 2xx)
    if (!respuesta.ok) {
      throw new Error(`Error al consultar productos. Código HTTP: ${respuesta.status}`);
    }

    // Parsear respuesta JSON
    const productos = await respuesta.json();

    // Guardar en memoria para uso posterior (búsqueda, filtros, etc.)
    listaProductos = Array.isArray(productos) ? productos : [];

    // Renderizar tabla con la lista completa
    renderizarTablaProductos(tablaProductosBody, listaProductos);
  } catch (error) {
    console.error("Error obteniendo productos desde la API:", error);
    mostrarMensajeError(tablaProductosBody, "No se pudieron cargar los productos. Intenta de nuevo más tarde.");
  }
}

/**
 * Aplica un filtro de búsqueda sobre la lista de productos en memoria
 * y vuelve a renderizar la tabla solo con los elementos que coinciden.
 * @param {HTMLElement} tablaProductosBody - Elemento <tbody> de la tabla.
 * @param {string} terminoBusqueda - Texto ingresado por el usuario en el campo de búsqueda.
 */
function filtrarProductos(tablaProductosBody, terminoBusqueda) {
  // Si no hay término de búsqueda, mostrar todos los productos
  if (!terminoBusqueda) {
    renderizarTablaProductos(tablaProductosBody, listaProductos);
    return;
  }

  // Filtrar por nombre o descripción que contenga el término
  const productosFiltrados = listaProductos.filter((producto) => {
    const nombre = String(producto.nombre || "").toLowerCase();
    const descripcion = String(producto.descripcion || "").toLowerCase();
    return nombre.includes(terminoBusqueda) || descripcion.includes(terminoBusqueda);
  });

  renderizarTablaProductos(tablaProductosBody, productosFiltrados);
}

/**
 * Dibuja las filas de la tabla de productos en el DOM.
 * @param {HTMLElement} tablaProductosBody - Elemento <tbody> donde se agregan las filas.
 * @param {Array<Object>} productosParaMostrar - Lista de productos a renderizar.
 */
function renderizarTablaProductos(tablaProductosBody, productosParaMostrar) {
  // Limpiar contenido actual
  tablaProductosBody.innerHTML = "";

  // Si no hay productos para mostrar, se muestra un mensaje en la tabla
  if (!productosParaMostrar || productosParaMostrar.length === 0) {
    const filaVacia = document.createElement("tr");
    const celdaMensaje = document.createElement("td");
    celdaMensaje.colSpan = 7;
    celdaMensaje.classList.add("text-center", "text-muted");
    celdaMensaje.textContent = "No hay productos para mostrar.";
    filaVacia.appendChild(celdaMensaje);
    tablaProductosBody.appendChild(filaVacia);
    return;
  }

  // Recorrer lista de productos y crear una fila por cada uno
  productosParaMostrar.forEach((producto, indice) => {
    const fila = document.createElement("tr");

    // Columna: #
    const celdaIndice = document.createElement("td");
    celdaIndice.textContent = indice + 1;

    // Columna: Nombre
    const celdaNombre = document.createElement("td");
    celdaNombre.textContent = producto.nombre ?? "";

    // Columna: Descripción
    const celdaDescripcion = document.createElement("td");
    celdaDescripcion.textContent = producto.descripcion ?? "";

    // Columna: Precio (formateado)
    const celdaPrecio = document.createElement("td");
    const precioNumero = Number(producto.precio ?? 0);
    celdaPrecio.textContent = isNaN(precioNumero)
      ? producto.precio
      : `$ ${precioNumero.toLocaleString("es-CO", { minimumFractionDigits: 0 })}`;

    // Columna: Stock
    const celdaStock = document.createElement("td");
    celdaStock.textContent = producto.stock ?? 0;

    // Columna: Imagen
    const celdaImagen = document.createElement("td");
    if (producto.imagen && typeof producto.imagen === "string" && producto.imagen.trim() !== "") {
      const imagen = document.createElement("img");
      imagen.src = producto.imagen;
      imagen.alt = `Imagen de ${producto.nombre ?? "producto"}`;
      imagen.style.width = "60px";
      imagen.style.height = "60px";
      imagen.style.objectFit = "cover";
      imagen.classList.add("rounded");
      celdaImagen.appendChild(imagen);
    } else {
      celdaImagen.textContent = "Sin imagen";
      celdaImagen.classList.add("text-muted");
    }

    // Columna: Acciones (ejemplo básico)
    const celdaAcciones = document.createElement("td");
    celdaAcciones.classList.add("d-flex", "gap-2");

    // Botón Editar (redirige a crear-pro.html con el id del producto como query param)
    const botonEditar = document.createElement("a");
    botonEditar.href = `crear-pro.html?id=${producto.id}`;
    botonEditar.textContent = "Editar";
    botonEditar.classList.add("btn", "btn-sm", "btn-warning", "mr-2");

    // // Botón Eliminar (solo muestra un alert por ahora, aquí podrías llamar a DELETE /api/productos/:id)
    // const botonEliminar = document.createElement("button");
    // botonEliminar.type = "button";
    // botonEliminar.textContent = "Eliminar";
    // botonEliminar.classList.add("btn", "btn-sm", "btn-danger");

    // botonEliminar.addEventListener("click", () => {
    //   // Aquí podrías implementar la lógica de borrado real:
    //   //   - Confirmar con el usuario.
    //   //   - Llamar a DELETE `${apiBaseUrl}/productos/${producto.id}`.
    //   //   - Volver a cargar la lista.
    //   alert(`Aquí se eliminaría el producto con id: ${producto.id}`);
    // });
    // Botón Eliminar (llama al endpoint DELETE /api/productos/:id)
    const botonEliminar = document.createElement("button");
    botonEliminar.type = "button";
    botonEliminar.textContent = "Eliminar";
    botonEliminar.classList.add("btn", "btn-sm", "btn-danger");

    botonEliminar.addEventListener("click", async () => {
      const confirmarEliminar = confirm(
        `¿Seguro que deseas eliminar el producto "${producto.nombre}" (ID: ${producto.id})?`
      );

      if (!confirmarEliminar) {
        return;
      }

      try {
        const respuesta = await fetch(`${apiBaseUrl}/productos/${producto.id}`, {
          method: "DELETE"
        });

        if (!respuesta.ok) {
          throw new Error(`Error al eliminar. Código HTTP: ${respuesta.status}`);
        }

        alert("Producto eliminado con éxito.");
        // Volver a cargar el listado desde la API
        cargarProductos(tablaProductosBody);
      } catch (error) {
        console.error("Error al eliminar producto:", error);
        alert("No se pudo eliminar el producto. Intenta de nuevo.");
      }
    });  

    celdaAcciones.appendChild(botonEditar);
    celdaAcciones.appendChild(botonEliminar);

    // Agregar todas las celdas a la fila
    fila.appendChild(celdaIndice);
    fila.appendChild(celdaNombre);
    fila.appendChild(celdaDescripcion);
    fila.appendChild(celdaPrecio);
    fila.appendChild(celdaStock);
    fila.appendChild(celdaImagen);
    fila.appendChild(celdaAcciones);

    // Agregar la fila completa al cuerpo de la tabla
    tablaProductosBody.appendChild(fila);
  });
}

/**
 * Muestra un mensaje de error dentro de la tabla cuando
 * ocurre algún problema al consultar la API.
 * @param {HTMLElement} tablaProductosBody - Elemento <tbody> de la tabla.
 * @param {string} mensaje - Texto de error a mostrar al usuario.
 */
function mostrarMensajeError(tablaProductosBody, mensaje) {
  tablaProductosBody.innerHTML = "";

  const filaError = document.createElement("tr");
  const celdaError = document.createElement("td");
  celdaError.colSpan = 7;
  celdaError.classList.add("text-center", "text-danger");
  celdaError.textContent = mensaje;

  filaError.appendChild(celdaError);
  tablaProductosBody.appendChild(filaError);
}