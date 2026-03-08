// ============================================================================
// Módulo: Pedidos (CRUD completo)
// Archivo sugerido: js/pedidos.js
// Descripción general:
//   - Funciona en listado-pedidos.html y crear-pedido.html.
//   - En listado-pedidos.html: lista pedidos, permite buscar, editar y eliminar.
//   - En crear-pedido.html: permite crear un nuevo pedido o editar uno existente,
//     dependiendo de si viene un parámetro ?id= en la URL.
//   - Consume la API REST (Node + MySQL) sobre la BD tienda_db:
//     tabla "pedido" (cabecera) y tabla "detalle_pedido" (líneas/items del pedido).
// ============================================================================

// URL base de la API del backend.
// Si cambias el puerto/host en tu servidor Node, actualiza esta constante.
const apiBaseUrl = "http://localhost:3000/api";

// Arreglo en memoria para listado de pedidos (se usa para búsqueda sin recargar).
let listaPedidos = [];
// Arreglo en memoria para productos disponibles (se usa en el carrito).
let listaProductos = [];

/**
 * Punto de entrada principal: se ejecuta cuando el DOM está listo.
 * Detecta en qué página estamos y activa solo la funcionalidad necesaria.
 */
document.addEventListener("DOMContentLoaded", () => {
  // Detectar si estamos en la página de listado (existe #tabla-pedidos)
  const tablaPedidosBody = document.querySelector("#tabla-pedidos");

  // Detectar si estamos en la página de crear/editar (existe #formulario-pedido)
  const formularioPedido = document.querySelector("#formulario-pedido");

  // Campo de búsqueda (en listado-pedidos.html)
  const campoBusqueda = document.querySelector(
    'input[type="search"][placeholder="Buscar Pedido"]'
  );

  // Si existe el tbody de pedidos, configuramos la lógica de listado/búsqueda
  if (tablaPedidosBody) {
    inicializarListadoPedidos(tablaPedidosBody, campoBusqueda);
  }

  // Si existe el formulario, configuramos la lógica de crear/editar
  if (formularioPedido) {
    inicializarFormularioPedido(formularioPedido);
  }
});

// ============================================================================
// SECCIÓN 1: LÓGICA PARA LISTADO DE PEDIDOS
// ============================================================================

/**
 * Inicializa el listado de pedidos: carga datos y configura la búsqueda.
 * @param {HTMLElement} tablaPedidosBody - Elemento <tbody> donde se dibujan las filas.
 * @param {HTMLInputElement|null} campoBusqueda - Input de búsqueda (puede ser null).
 */
function inicializarListadoPedidos(tablaPedidosBody, campoBusqueda) {
  // Cargar pedidos desde la API al iniciar la página
  cargarPedidosDesdeApi(tablaPedidosBody);

  // Configurar filtro de búsqueda si el campo existe
  if (campoBusqueda) {
    campoBusqueda.addEventListener("input", (evento) => {
      const terminoBusqueda = evento.target.value.trim().toLowerCase();
      filtrarPedidos(tablaPedidosBody, terminoBusqueda);
    });
  }
}

/**
 * Llama a la API para obtener todos los pedidos y los renderiza en la tabla.
 * @param {HTMLElement} tablaPedidosBody - Elemento <tbody> de la tabla de pedidos.
 */
async function cargarPedidosDesdeApi(tablaPedidosBody) {
  try {
    const respuesta = await fetch(`${apiBaseUrl}/pedidos`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!respuesta.ok) {
      throw new Error(
        `Error al consultar pedidos. Código HTTP: ${respuesta.status}`
      );
    }

    const pedidos = await respuesta.json();

    // Garantizar que sea un arreglo
    listaPedidos = Array.isArray(pedidos) ? pedidos : [];

    // Renderizar tabla completa
    renderizarTablaPedidos(tablaPedidosBody, listaPedidos);
  } catch (error) {
    console.error("Error obteniendo pedidos desde la API:", error);
    mostrarMensajeErrorPedidos(
      tablaPedidosBody,
      "No se pudieron cargar los pedidos. Intenta de nuevo más tarde."
    );
  }
}

/**
 * Filtra la lista en memoria de pedidos por cliente, email o estado.
 * @param {HTMLElement} tablaPedidosBody - Elemento <tbody> de la tabla.
 * @param {string} terminoBusqueda - Texto ingresado por el usuario.
 */
function filtrarPedidos(tablaPedidosBody, terminoBusqueda) {
  if (!terminoBusqueda) {
    renderizarTablaPedidos(tablaPedidosBody, listaPedidos);
    return;
  }

  const pedidosFiltrados = listaPedidos.filter((pedido) => {
    const clienteNombre = String(
      pedido.clienteNombre ||
        pedido.cliente ||
        pedido.nombreCliente ||
        ""
    ).toLowerCase();

    const emailCliente = String(
      pedido.emailCliente || pedido.email || ""
    ).toLowerCase();

    const estado = String(pedido.estado || pedido.estadoPedido || "").toLowerCase();

    return (
      clienteNombre.includes(terminoBusqueda) ||
      emailCliente.includes(terminoBusqueda) ||
      estado.includes(terminoBusqueda)
    );
  });

  renderizarTablaPedidos(tablaPedidosBody, pedidosFiltrados);
}

/**
 * Dibuja las filas de la tabla de pedidos en el DOM.
 * @param {HTMLElement} tablaPedidosBody - Elemento <tbody> donde se agregan las filas.
 * @param {Array<Object>} pedidosParaMostrar - Lista de pedidos a renderizar.
 */
function renderizarTablaPedidos(tablaPedidosBody, pedidosParaMostrar) {
  // Limpiar contenido actual
  tablaPedidosBody.innerHTML = "";

  // Si no hay pedidos, mostrar mensaje
  if (!pedidosParaMostrar || pedidosParaMostrar.length === 0) {
    const filaVacia = document.createElement("tr");
    const celdaMensaje = document.createElement("td");
    celdaMensaje.colSpan = 7;
    celdaMensaje.classList.add("text-center", "text-muted");
    celdaMensaje.textContent = "No hay pedidos para mostrar.";
    filaVacia.appendChild(celdaMensaje);
    tablaPedidosBody.appendChild(filaVacia);
    return;
  }

  // Recorrer lista de pedidos
  pedidosParaMostrar.forEach((pedido, indice) => {
    // Detectar el ID del pedido de forma flexible, por si la API usa otros nombres de campo
    const pedidoId =
      pedido.id ??
      pedido.id_pedido ??
      pedido.idPedido ??
      pedido.pedido_id;

    const fila = document.createElement("tr");

    // Columna: #
    const celdaIndice = document.createElement("td");
    celdaIndice.textContent = indice + 1;

    // Columna: Cliente
    const celdaCliente = document.createElement("td");
    const clienteNombre =
      pedido.clienteNombre ||
      pedido.cliente ||
      (pedido.nombreCliente && pedido.apellidoCliente
        ? `${pedido.nombreCliente} ${pedido.apellidoCliente}`
        : pedido.nombreCliente) ||
      "";
    celdaCliente.textContent = clienteNombre ?? "";

    // Columna: Email
    const celdaEmail = document.createElement("td");
    const emailCliente = pedido.emailCliente || pedido.email || "";
    celdaEmail.textContent = emailCliente;

    // Columna: Fecha
    const celdaFecha = document.createElement("td");
    let textoFecha = "";
    if (pedido.fecha || pedido.fechaPedido) {
      try {
        const fechaRaw = pedido.fecha || pedido.fechaPedido;
        const fechaObj = new Date(fechaRaw);
        textoFecha = isNaN(fechaObj.getTime())
          ? String(fechaRaw)
          : fechaObj.toLocaleString("es-CO");
      } catch (error) {
        textoFecha = String(pedido.fecha || pedido.fechaPedido);
      }
    }
    celdaFecha.textContent = textoFecha;

    // Columna: Total
    const celdaTotal = document.createElement("td");
    const totalNumero = Number(pedido.total ?? pedido.totalPedido ?? 0);
    celdaTotal.textContent = isNaN(totalNumero)
      ? String(pedido.total ?? pedido.totalPedido ?? "")
      : `$ ${totalNumero.toLocaleString("es-CO", { minimumFractionDigits: 0 })}`;

    // Columna: Estado
    const celdaEstado = document.createElement("td");
    const estado = pedido.estado || pedido.estadoPedido || "Pendiente";
    celdaEstado.textContent = estado;

    // Columna: Acciones
    const celdaAcciones = document.createElement("td");
    celdaAcciones.classList.add("d-flex", "gap-2");

    // Botón Editar -> redirige a crear-pedido.html?id=ID
    const botonEditar = document.createElement("a");
    botonEditar.href = `crear-pedido.html?id=${pedidoId}`;
    botonEditar.textContent = "Editar";
    botonEditar.classList.add("btn", "btn-sm", "btn-warning", "mr-2");

    // Botón Eliminar -> llama DELETE /api/pedidos/:id
    const botonEliminar = document.createElement("button");
    botonEliminar.type = "button";
    botonEliminar.textContent = "Eliminar";
    botonEliminar.classList.add("btn", "btn-sm", "btn-danger");

    botonEliminar.addEventListener("click", async () => {
      const confirmarEliminar = confirm(
        `¿Seguro que deseas eliminar el pedido (ID: ${pedidoId}) del cliente "${clienteNombre}"?`
      );

      if (!confirmarEliminar) {
        return;
      }

      try {
        const respuesta = await fetch(`${apiBaseUrl}/pedidos/${pedidoId}`, {
          method: "DELETE"
        });

        if (!respuesta.ok) {
          throw new Error(
            `Error al eliminar pedido. Código HTTP: ${respuesta.status}`
          );
        }

        alert("Pedido eliminado con éxito.");
        // Volver a cargar lista desde la API
        cargarPedidosDesdeApi(tablaPedidosBody);
      } catch (error) {
        console.error("Error al eliminar pedido:", error);
        alert("No se pudo eliminar el pedido. Intenta de nuevo.");
      }
    });

    celdaAcciones.appendChild(botonEditar);
    celdaAcciones.appendChild(botonEliminar);

    // Agregar celdas a la fila
    fila.appendChild(celdaIndice);
    fila.appendChild(celdaCliente);
    fila.appendChild(celdaEmail);
    fila.appendChild(celdaFecha);
    fila.appendChild(celdaTotal);
    fila.appendChild(celdaEstado);
    fila.appendChild(celdaAcciones);

    // Agregar fila al tbody
    tablaPedidosBody.appendChild(fila);
  });
}

/**
 * Muestra un mensaje de error dentro de la tabla de pedidos.
 * @param {HTMLElement} tablaPedidosBody - Elemento <tbody> de la tabla.
 * @param {string} mensaje - Texto de error a mostrar.
 */
function mostrarMensajeErrorPedidos(tablaPedidosBody, mensaje) {
  tablaPedidosBody.innerHTML = "";

  const filaError = document.createElement("tr");
  const celdaError = document.createElement("td");
  celdaError.colSpan = 7;
  celdaError.classList.add("text-center", "text-danger");
  celdaError.textContent = mensaje;

  filaError.appendChild(celdaError);
  tablaPedidosBody.appendChild(filaError);
}

// ============================================================================
// SECCIÓN 2: LÓGICA PARA CREAR / EDITAR PEDIDOS
// ============================================================================

/**
 * Inicializa el formulario de pedido:
 * - Carga clientes para el select.
 * - Detecta si hay ?id= en la URL para modo edición.
 * - Carga datos del pedido si es edición.
 * - Configura el submit para crear/actualizar.
 * @param {HTMLFormElement} formularioPedido - Formulario de crear/editar pedido.
 */
function inicializarFormularioPedido(formularioPedido) {
  // Referencias a campos básicos
  const selectCliente = document.querySelector("#id_cliente");
  const selectMetodoPago = document.querySelector("#metodo_pago");
  const selectProducto = document.querySelector("#producto-select");
  const botonAgregarProducto = document.querySelector("#btnAgregarProducto");
  const inputDescuento = document.querySelector("#descuento");
  const inputAumento = document.querySelector("#aumento");
  const spanTotalPedido = document.querySelector("#total-pedido");
  const tablaCarrito = document.querySelector("#tabla-carrito");
  const botonSubmit = formularioPedido.querySelector("button[type='submit']");

  // Validación mínima de existencia
  if (!selectCliente || !selectMetodoPago || !inputDescuento || !inputAumento) {
    console.error("No se encontraron todos los campos requeridos del formulario de pedido.");
    return;
  }

  // 1. Cargar clientes en el select
  cargarClientesEnSelect(selectCliente);

  // 1.1 Cargar productos para el carrito (si existen los elementos)
  if (selectProducto && botonAgregarProducto && tablaCarrito) {
    cargarProductosEnSelect(selectProducto);

    botonAgregarProducto.addEventListener("click", () => {
      agregarProductoAlCarrito(
        selectProducto,
        tablaCarrito,
        spanTotalPedido,
        inputDescuento,
        inputAumento
      );
    });
  }

  // 2. Detectar si venimos con ?id= para editar
  const parametrosUrl = new URLSearchParams(window.location.search);
  const pedidoId = parametrosUrl.get("id");

  if (pedidoId) {
    // Modo edición
    if (botonSubmit) {
      botonSubmit.textContent = "Actualizar Pedido";
    }
    const tituloPagina = document.querySelector("h1.h3");
    if (tituloPagina) {
      tituloPagina.textContent = "Editar Pedido";
    }

    // Cargar datos del pedido para edición
    cargarPedidoParaEdicion(
      pedidoId,
      selectCliente,
      selectMetodoPago,
      inputDescuento,
      inputAumento,
      spanTotalPedido,
      tablaCarrito
    );
  }

  // 3. Escuchar cambios en descuento/aumento para recalcular total
  inputDescuento.addEventListener("input", () => calcularTotalPedido(spanTotalPedido, tablaCarrito, inputDescuento, inputAumento));
  inputAumento.addEventListener("input", () => calcularTotalPedido(spanTotalPedido, tablaCarrito, inputDescuento, inputAumento));

  // 4. Manejador de envío de formulario (crear/actualizar)
  formularioPedido.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const datosPedido = construirDatosPedido(
      selectCliente,
      selectMetodoPago,
      inputDescuento,
      inputAumento,
      spanTotalPedido,
      tablaCarrito
    );

    if (!validarDatosPedido(datosPedido)) {
      return;
    }

    try {
      if (pedidoId) {
        await actualizarPedido(pedidoId, datosPedido);
        alert("Pedido actualizado correctamente.");
      } else {
        await crearPedido(datosPedido);
        alert("Pedido creado correctamente.");
      }

      window.location.href = "listado-pedidos.html";
    } catch (error) {
      console.error("Error al guardar pedido:", error);
      const mensajeError = error.message || "Ocurrió un error al guardar el pedido. Intenta de nuevo.";
      alert(mensajeError);
    }
  });
}

/**
 * Llama a GET /api/clientes para llenar el select de clientes.
 * @param {HTMLSelectElement} selectCliente
 */
async function cargarClientesEnSelect(selectCliente) {
  try {
    const respuesta = await fetch(`${apiBaseUrl}/clientes`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!respuesta.ok) {
      throw new Error(`Error al obtener clientes. Código HTTP: ${respuesta.status}`);
    }

    const clientes = await respuesta.json();
    const lista = Array.isArray(clientes) ? clientes : [];

    // Limpiar opciones, dejar solo la primera "Seleccionar Cliente"
    selectCliente.innerHTML = "";
    const opcionInicial = document.createElement("option");
    opcionInicial.value = "";
    opcionInicial.textContent = "Seleccionar Cliente";
    selectCliente.appendChild(opcionInicial);

    lista.forEach((cliente) => {
      const clienteId =
        cliente.id ??
        cliente.id_cliente ??
        cliente.idCliente ??
        cliente.cliente_id;

      const nombreCompleto =
        (cliente.nombre || "") +
        (cliente.apellido ? ` ${cliente.apellido}` : "");

      const opcion = document.createElement("option");
      opcion.value = clienteId;
      opcion.textContent = nombreCompleto || `Cliente ${clienteId}`;
      selectCliente.appendChild(opcion);
    });
  } catch (error) {
    console.error("Error al cargar clientes para el select:", error);
    alert("No se pudieron cargar los clientes. Intenta recargar la página.");
  }
}

/**
 * Llama a GET /api/productos para llenar el select de productos del carrito.
 * Además guarda los productos en memoria para consultar precio y nombre.
 * @param {HTMLSelectElement} selectProducto
 */
async function cargarProductosEnSelect(selectProducto) {
  try {
    const respuesta = await fetch(`${apiBaseUrl}/productos`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!respuesta.ok) {
      throw new Error(`Error al obtener productos. Código HTTP: ${respuesta.status}`);
    }

    const productos = await respuesta.json();
    listaProductos = Array.isArray(productos) ? productos : [];

    // Limpiar opciones, dejar solo la primera "Seleccionar Producto"
    selectProducto.innerHTML = "";
    const opcionInicial = document.createElement("option");
    opcionInicial.value = "";
    opcionInicial.textContent = "Seleccionar Producto";
    selectProducto.appendChild(opcionInicial);

    listaProductos.forEach((producto) => {
      const productoId =
        producto.id ??
        producto.id_producto ??
        producto.idProducto ??
        producto.producto_id;

      const opcion = document.createElement("option");
      opcion.value = productoId;
      opcion.textContent = producto.nombre ?? `Producto ${productoId}`;
      selectProducto.appendChild(opcion);
    });
  } catch (error) {
    console.error("Error al cargar productos para el select:", error);
    alert("No se pudieron cargar los productos. Intenta recargar la página.");
  }
}

/**
 * Carga un pedido existente desde la API para rellenar el formulario en modo edición.
 * @param {string} pedidoId
 * @param {HTMLSelectElement} selectCliente
 * @param {HTMLSelectElement} selectMetodoPago
 * @param {HTMLInputElement} inputDescuento
 * @param {HTMLInputElement} inputAumento
 * @param {HTMLElement} spanTotalPedido
 * @param {HTMLElement|null} tablaCarrito
 */
async function cargarPedidoParaEdicion(
  pedidoId,
  selectCliente,
  selectMetodoPago,
  inputDescuento,
  inputAumento,
  spanTotalPedido,
  tablaCarrito
) {
  try {
    const respuesta = await fetch(`${apiBaseUrl}/pedidos/${pedidoId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!respuesta.ok) {
      throw new Error(
        `Error al obtener pedido. Código HTTP: ${respuesta.status}`
      );
    }

    const pedido = await respuesta.json();

    // Cliente (id_cliente en la BD)
    if (pedido.id_cliente || pedido.idCliente || pedido.cliente_id) {
      const idCliente =
        pedido.id_cliente ?? pedido.idCliente ?? pedido.cliente_id;
      selectCliente.value = String(idCliente);
    }

    // Método de pago
    if (pedido.metodo_pago || pedido.metodoPago) {
      selectMetodoPago.value = pedido.metodo_pago ?? pedido.metodoPago;
    }

    // Descuento y aumento
    inputDescuento.value = Number(pedido.descuento ?? 0);
    inputAumento.value = Number(pedido.aumento ?? 0);

    // Total
    const totalNumero = Number(pedido.total ?? pedido.totalPedido ?? 0);
    if (spanTotalPedido) {
      spanTotalPedido.textContent = isNaN(totalNumero)
        ? String(pedido.total ?? pedido.totalPedido ?? "")
        : `$ ${totalNumero.toLocaleString("es-CO", { minimumFractionDigits: 0 })}`;
    }

    // Productos del pedido (opcional, depende de cómo expongas el detalle)
    // Suponemos que viene un arreglo pedido.detalle o pedido.items
    const items = pedido.detalle || pedido.items || [];
    if (tablaCarrito && Array.isArray(items) && items.length > 0) {
      const tbody = tablaCarrito.querySelector("tbody");
      if (tbody) {
        tbody.innerHTML = "";
        items.forEach((item) => {
          const fila = document.createElement("tr");

          const celdaProducto = document.createElement("td");
          celdaProducto.textContent = item.nombreProducto || item.producto || "";

          const celdaPrecio = document.createElement("td");
          const precioNumero = Number(item.precio ?? item.precioUnitario ?? 0);
          celdaPrecio.textContent = isNaN(precioNumero)
            ? String(item.precio ?? item.precioUnitario ?? "")
            : `$ ${precioNumero.toLocaleString("es-CO", { minimumFractionDigits: 0 })}`;

          const celdaCantidad = document.createElement("td");
          const inputCantidad = document.createElement("input");
          inputCantidad.type = "number";
          inputCantidad.min = "1";
          inputCantidad.value = Number(item.cantidad ?? 1);
          inputCantidad.classList.add("form-control", "form-control-sm");
          celdaCantidad.appendChild(inputCantidad);

          const celdaSubtotal = document.createElement("td");
          const subtotalNumero = precioNumero * Number(inputCantidad.value);
          celdaSubtotal.textContent = isNaN(subtotalNumero)
            ? ""
            : `$ ${subtotalNumero.toLocaleString("es-CO", { minimumFractionDigits: 0 })}`;

          const celdaAccion = document.createElement("td");
          const botonQuitar = document.createElement("button");
          botonQuitar.type = "button";
          botonQuitar.textContent = "Quitar";
          botonQuitar.classList.add("btn", "btn-sm", "btn-danger");
          celdaAccion.appendChild(botonQuitar);

          // Guardar info como dataset en la fila
          fila.dataset.productoId =
            item.id_producto ?? item.idProducto ?? item.producto_id ?? "";
          fila.dataset.precio = String(precioNumero);

          // Eventos para recalcular subtotal y total
          inputCantidad.addEventListener("input", () => {
            const nuevaCantidad = Number(inputCantidad.value);
            const nuevoSubtotal = Number(fila.dataset.precio) * nuevaCantidad;
            celdaSubtotal.textContent = isNaN(nuevoSubtotal)
              ? ""
              : `$ ${nuevoSubtotal.toLocaleString("es-CO", { minimumFractionDigits: 0 })}`;
            calcularTotalPedido(spanTotalPedido, tablaCarrito, inputDescuento, inputAumento);
          });

          botonQuitar.addEventListener("click", () => {
            fila.remove();
            calcularTotalPedido(spanTotalPedido, tablaCarrito, inputDescuento, inputAumento);
          });

          fila.appendChild(celdaProducto);
          fila.appendChild(celdaPrecio);
          fila.appendChild(celdaCantidad);
          fila.appendChild(celdaSubtotal);
          fila.appendChild(celdaAccion);

          tbody.appendChild(fila);
        });

        // Recalcular total con detalle + descuento/aumento
        calcularTotalPedido(spanTotalPedido, tablaCarrito, inputDescuento, inputAumento);
      }
    }
  } catch (error) {
    console.error("Error al cargar pedido para edición:", error);
    alert("No se pudo cargar la información del pedido.");
  }
}

/**
 * Agrega un producto seleccionado al carrito de la tabla.
 * - Si el producto ya existe en el carrito, solo aumenta la cantidad.
 * - Calcula y muestra el subtotal por fila.
 * - Recalcula el total general del pedido.
 * @param {HTMLSelectElement} selectProducto
 * @param {HTMLElement} tablaCarrito
 * @param {HTMLElement|null} spanTotalPedido
 * @param {HTMLInputElement} inputDescuento
 * @param {HTMLInputElement} inputAumento
 */
function agregarProductoAlCarrito(
  selectProducto,
  tablaCarrito,
  spanTotalPedido,
  inputDescuento,
  inputAumento
) {
  const productoIdSeleccionado = selectProducto.value;

  if (!productoIdSeleccionado) {
    alert("Selecciona un producto para agregar al pedido.");
    return;
  }

  const producto = listaProductos.find((p) => {
    const id =
      p.id ??
      p.id_producto ??
      p.idProducto ??
      p.producto_id;
    return String(id) === String(productoIdSeleccionado);
  });

  if (!producto) {
    alert("No se encontró la información del producto seleccionado.");
    return;
  }

  const tbody = tablaCarrito.querySelector("tbody");
  if (!tbody) {
    console.error("No se encontró el cuerpo de la tabla de carrito.");
    return;
  }

  // Verificar si el producto ya existe en el carrito (no repetir filas)
  const filaExistente = Array.from(tbody.querySelectorAll("tr")).find(
    (fila) => fila.dataset.productoId === String(productoIdSeleccionado)
  );

  const precioNumero = Number(producto.precio ?? 0);

  if (filaExistente) {
    // Si ya existe, aumentar cantidad y recalcular subtotal
    const inputCantidadExistente = filaExistente.querySelector("input[type='number']");
    const celdaSubtotalExistente = filaExistente.querySelector("td:nth-child(4)");

    if (inputCantidadExistente && celdaSubtotalExistente) {
      const cantidadActual = Number(inputCantidadExistente.value || 1);
      const nuevaCantidad = cantidadActual + 1;
      inputCantidadExistente.value = nuevaCantidad;

      const nuevoSubtotal = precioNumero * nuevaCantidad;
      celdaSubtotalExistente.textContent = isNaN(nuevoSubtotal)
        ? ""
        : `$ ${nuevoSubtotal.toLocaleString("es-CO", { minimumFractionDigits: 0 })}`;

      calcularTotalPedido(spanTotalPedido, tablaCarrito, inputDescuento, inputAumento);
    }

    return;
  }

  // Crear nueva fila para el producto
  const fila = document.createElement("tr");

  const celdaProducto = document.createElement("td");
  celdaProducto.textContent = producto.nombre ?? `Producto ${productoIdSeleccionado}`;

  const celdaPrecio = document.createElement("td");
  celdaPrecio.textContent = isNaN(precioNumero)
    ? String(producto.precio ?? "")
    : `$ ${precioNumero.toLocaleString("es-CO", { minimumFractionDigits: 0 })}`;

  const celdaCantidad = document.createElement("td");
  const inputCantidad = document.createElement("input");
  inputCantidad.type = "number";
  inputCantidad.min = "1";
  inputCantidad.value = "1";
  inputCantidad.classList.add("form-control", "form-control-sm");
  celdaCantidad.appendChild(inputCantidad);

  const celdaSubtotal = document.createElement("td");
  const subtotalInicial = precioNumero;
  celdaSubtotal.textContent = isNaN(subtotalInicial)
    ? ""
    : `$ ${subtotalInicial.toLocaleString("es-CO", { minimumFractionDigits: 0 })}`;

  const celdaAccion = document.createElement("td");
  const botonQuitar = document.createElement("button");
  botonQuitar.type = "button";
  botonQuitar.textContent = "Quitar";
  botonQuitar.classList.add("btn", "btn-sm", "btn-danger");
  celdaAccion.appendChild(botonQuitar);

  // Guardar info como dataset en la fila
  fila.dataset.productoId = String(productoIdSeleccionado);
  fila.dataset.precio = String(precioNumero);

  // Eventos para recalcular subtotal y total
  inputCantidad.addEventListener("input", () => {
    const nuevaCantidad = Number(inputCantidad.value || 1);
    const nuevoSubtotal = precioNumero * nuevaCantidad;
    celdaSubtotal.textContent = isNaN(nuevoSubtotal)
      ? ""
      : `$ ${nuevoSubtotal.toLocaleString("es-CO", { minimumFractionDigits: 0 })}`;
    calcularTotalPedido(spanTotalPedido, tablaCarrito, inputDescuento, inputAumento);
  });

  botonQuitar.addEventListener("click", () => {
    fila.remove();
    calcularTotalPedido(spanTotalPedido, tablaCarrito, inputDescuento, inputAumento);
  });

  fila.appendChild(celdaProducto);
  fila.appendChild(celdaPrecio);
  fila.appendChild(celdaCantidad);
  fila.appendChild(celdaSubtotal);
  fila.appendChild(celdaAccion);

  tbody.appendChild(fila);

  // Recalcular total general
  calcularTotalPedido(spanTotalPedido, tablaCarrito, inputDescuento, inputAumento);
}

/**
 * Calcula el total del pedido sumando los subtotales de la tabla de carrito
 * y aplicando descuento y aumento.
 * @param {HTMLElement|null} spanTotalPedido
 * @param {HTMLElement|null} tablaCarrito
 * @param {HTMLInputElement} inputDescuento
 * @param {HTMLInputElement} inputAumento
 */
function calcularTotalPedido(spanTotalPedido, tablaCarrito, inputDescuento, inputAumento) {
  let totalBase = 0;

  if (tablaCarrito) {
    const tbody = tablaCarrito.querySelector("tbody");
    if (tbody) {
      const filas = Array.from(tbody.querySelectorAll("tr"));
      filas.forEach((fila) => {
        const precio = Number(fila.dataset.precio ?? 0);
        const inputCantidad = fila.querySelector("input[type='number']");
        const cantidad = inputCantidad ? Number(inputCantidad.value) : 1;
        if (!isNaN(precio) && !isNaN(cantidad)) {
          totalBase += precio * cantidad;
        }
      });
    }
  }

  const descuento = Number(inputDescuento.value || 0);
  const aumento = Number(inputAumento.value || 0);

  let totalFinal = totalBase - (isNaN(descuento) ? 0 : descuento) + (isNaN(aumento) ? 0 : aumento);
  if (totalFinal < 0) totalFinal = 0;

  if (spanTotalPedido) {
    spanTotalPedido.textContent = `$ ${totalFinal.toLocaleString("es-CO", {
      minimumFractionDigits: 0
    })}`;
  }

  return totalFinal;
}

/**
 * Construye el objeto de datos que se enviará al backend con la info del formulario.
 * Incluye:
 *  - id_cliente
 *  - metodo_pago
 *  - descuento
 *  - aumento
 *  - total
 *  - items (detalle del pedido) si hay filas en la tabla de carrito.
 */
function construirDatosPedido(
  selectCliente,
  selectMetodoPago,
  inputDescuento,
  inputAumento,
  spanTotalPedido,
  tablaCarrito
) {
  const idCliente = selectCliente.value;
  const metodoPago = selectMetodoPago.value;
  const descuentoNumero = Number(inputDescuento.value || 0);
  const aumentoNumero = Number(inputAumento.value || 0);
  const totalNumero = calcularTotalPedido(spanTotalPedido, tablaCarrito, inputDescuento, inputAumento);

  const items = [];

  if (tablaCarrito) {
    const tbody = tablaCarrito.querySelector("tbody");
    if (tbody) {
      const filas = Array.from(tbody.querySelectorAll("tr"));
      filas.forEach((fila) => {
        const productoId = fila.dataset.productoId || null;
        const precio = Number(fila.dataset.precio || 0);
        const inputCantidad = fila.querySelector("input[type='number']");
        const cantidad = inputCantidad ? Number(inputCantidad.value) : 1;

        if (!productoId) {
          return;
        }

        // Enviar tipos compatibles con MySQL (enteros para id_producto y cantidad)
        items.push({
          id_producto: parseInt(productoId, 10),
          idProducto: parseInt(productoId, 10),
          cantidad: parseInt(cantidad, 10) || 1,
          precio: precio
        });
      });
    }
  }

  // Payload compatible con tablas "pedido" y "detalle_pedido"
  const idClienteNum = parseInt(idCliente, 10);
  return {
    cliente: isNaN(idClienteNum) ? idCliente : idClienteNum,
    id_cliente: isNaN(idClienteNum) ? idCliente : idClienteNum,
    idCliente: isNaN(idClienteNum) ? idCliente : idClienteNum,
    metodo_pago: metodoPago,
    metodoPago: metodoPago,
    descuento: descuentoNumero,
    aumento: aumentoNumero,
    total: totalNumero,
    productos: items,
    detalle_pedido: items,
    items: items,
    detalle: items
  };
}

/**
 * Valida los datos del pedido antes de enviarlos al backend.
 * @param {Object} datosPedido
 * @returns {boolean} true si es válido, false en caso contrario.
 */
function validarDatosPedido(datosPedido) {
  if (!datosPedido.id_cliente) {
    alert("Debes seleccionar un cliente.");
    return false;
  }

  if (!datosPedido.metodo_pago || datosPedido.metodo_pago === "Seleccionar Método de Pago") {
    alert("Debes seleccionar un método de pago.");
    return false;
  }

  if (isNaN(datosPedido.total) || datosPedido.total <= 0) {
    alert("El total del pedido debe ser mayor a 0.");
    return false;
  }

  // Asegurar que exista al menos un ítem en el pedido
  if (!datosPedido.items || datosPedido.items.length === 0) {
    alert("Debes agregar al menos un producto al pedido.");
    return false;
  }

  return true;
}

/**
 * Envía una petición POST para crear un nuevo pedido.
 * @param {Object} datosPedido - Datos del pedido a crear.
 */
async function crearPedido(datosPedido) {
  const respuesta = await fetch(`${apiBaseUrl}/pedidos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(datosPedido)
  });

  if (!respuesta.ok) {
    const textoError = await respuesta.text();
    throw new Error(`Error al crear pedido: ${textoError}`);
  }
}

/**
 * Envía una petición PUT para actualizar un pedido existente.
 * @param {string} pedidoId - ID del pedido a actualizar.
 * @param {Object} datosPedido - Datos actualizados del pedido.
 */
async function actualizarPedido(pedidoId, datosPedido) {
  const respuesta = await fetch(`${apiBaseUrl}/pedidos/${pedidoId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(datosPedido)
  });

  if (!respuesta.ok) {
    const textoError = await respuesta.text();
    throw new Error(`Error al actualizar pedido: ${textoError}`);
  }
}
