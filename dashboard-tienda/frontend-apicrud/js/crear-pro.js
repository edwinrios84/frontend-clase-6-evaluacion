// ============================================================================
// Módulo: Crear / Editar Producto
// Archivo: js/crear-pro.js
// Descripción:
//   - Maneja el formulario de crear-pro.html.
//   - Si viene un parámetro ?id= en la URL, carga el producto y permite editarlo (PUT).
//   - Si no hay id, crea un nuevo producto (POST).
//   - Usa la API REST del backend (Node + MySQL) sobre la tabla "productos".
// ============================================================================

// URL base de la API del backend.
const apiBaseUrl = "http://localhost:3000/api";

// Catálogo local de imágenes y precios por tipo de producto.
// Este arreglo reemplaza al que tenías en el <script> inline de crear-pro.html.
const imagenesProductos = [
  {
    name: "Hamburguesa",
    precio: 30000,
    url: "https://th.bing.com/th/id/R.c691ed37c9ce3040c3ebd2892e88870c?rik=QUBcFflN%2b9oqPQ&pid=ImgRaw&r=0"
  },
  {
    name: "Pizza",
    precio: 45000,
    url: "https://www.ocu.org/-/media/ocu/images/home/alimentacion/alimentos/pizzas_selector_1600x900.jpg?rev=6a81e278-07fc-4e95-9ba1-361063f35adf&hash=B8B1264AB6FC3F4B1AE140EB390208CD"
  },
  {
    name: "Pasta",
    precio: 25000,
    url: "https://cdn.shopify.com/s/files/1/2538/5286/products/Spaghetti-with-Meat-Sauce-Recipe-1-1200_787x787.jpg?v=1588772697"
  },
  {
    name: "Perro",
    precio: 22000,
    url: "https://th.bing.com/th/id/OIP.2QjcuwsTimAImo8WSQdTdAHaFp?rs=1&pid=ImgDetMain"
  },
  {
    name: "Burrito",
    precio: 25000,
    url: "https://th.bing.com/th/id/R.1a7d6f0af7be590eb4e27d96ce3530e5?rik=eiCcb%2f%2b9TYNzXQ&pid=ImgRaw&r=0"
  },
  {
    name: "Tacos",
    precio: 26000,
    url: "https://th.bing.com/th/id/R.d50b293e5d2de51d349691db78f71f8c?rik=FfttXcgxjuqR%2fQ&pid=ImgRaw&r=0"
  },
  {
    name: "Pollo",
    precio: 35000,
    url: "https://th.bing.com/th/id/OIP.IAza-1yPPvzA55qlI0VqvQHaF7?w=744&h=595&rs=1&pid=ImgDetMain"
  },
  {
    name: "Chuzo",
    precio: 22000,
    url: "https://th.bing.com/th/id/R.c0d3de5bd13edcc5323d074e4ba8f864?rik=lFbTsZF0ESAN5w&pid=ImgRaw&r=0"
  },
  {
    name: "Sanchipapa",
    precio: 20000,
    url: "https://1.bp.blogspot.com/-6lKIIVq3CXw/WK8raCAD-gI/AAAAAAABMnI/5VoCplTPogASfSZS5XzIFZizMBZ8yO8bQCLcB/s1600/salchipapa%2Bcolombiana.png"
  },
  {
    name: "Picada",
    precio: 65000,
    url: "https://cdn.colombia.com/gastronomia/2016/06/21/picada-colombiana-2990.jpg"
  }
];

/**
 * Punto de entrada: configura eventos y carga datos si estamos en modo edición.
 */
document.addEventListener("DOMContentLoaded", () => {
  // Referencias a elementos del formulario
  const selectProducto = document.querySelector("#productos-select");
  const imagenProducto = document.querySelector("#imagen-pro");
  const inputPrecio = document.querySelector("#precio-pro");
  const inputStock = document.querySelector("#stock-pro");
  const inputDescripcion = document.querySelector("#descripcion-pro");
  const botonGuardar = document.querySelector("#btnGuardarProducto");

  if (!selectProducto || !imagenProducto || !inputPrecio || !inputStock || !inputDescripcion || !botonGuardar) {
    console.error("No se encontraron todos los elementos del formulario de producto.");
    return;
  }

  const formProducto = document.querySelector("#formProducto");
  if (formProducto) {
    formProducto.addEventListener("submit", (e) => e.preventDefault());
  }

  // Configurar cambio de imagen y precio según la opción seleccionada
  configurarCambioProducto(selectProducto, imagenProducto, inputPrecio);

  // Leer parámetro ?id= de la URL para saber si es edición
  const parametrosUrl = new URLSearchParams(window.location.search);
  const productoId = parametrosUrl.get("id");

  if (productoId) {
    // Modo edición
    botonGuardar.textContent = "Actualizar Producto";
    cargarProductoParaEdicion(
      productoId,
      selectProducto,
      imagenProducto,
      inputPrecio,
      inputStock,
      inputDescripcion
    );
  } else {
    // Modo creación: seleccionar la primera opción válida
    seleccionarProductoInicial(selectProducto, imagenProducto, inputPrecio);
  }

  // Manejador de clic para crear o actualizar
  botonGuardar.addEventListener("click", async () => {
    const datosProducto = construirDatosProducto(
      selectProducto,
      imagenProducto,
      inputPrecio,
      inputStock,
      inputDescripcion
    );

    if (!validarDatosProducto(datosProducto)) {
      return;
    }

    try {
      if (productoId) {
        await actualizarProducto(productoId, datosProducto);
        alert("Producto actualizado correctamente.");
      } else {
        await crearProducto(datosProducto);
        alert("Producto creado correctamente.");
      }

      // Redirigir de vuelta al listado
      window.location.href = "listado-pro.html";
    } catch (error) {
      console.error("Error al guardar producto:", error);
      alert("Ocurrió un error al guardar el producto. Intenta de nuevo.");
    }
  });
});

/**
 * Configura el evento change del select para actualizar imagen y precio sugerido.
 * @param {HTMLSelectElement} selectProducto
 * @param {HTMLImageElement} imagenProducto
 * @param {HTMLInputElement} inputPrecio
 */
function configurarCambioProducto(selectProducto, imagenProducto, inputPrecio) {
  selectProducto.addEventListener("change", () => {
    const imagenSeleccionada = imagenesProductos.find(
      (imagen) => imagen.name === selectProducto.value
    );

    if (!imagenSeleccionada) {
      return;
    }

    imagenProducto.src = imagenSeleccionada.url;
    imagenProducto.alt = `Imagen de ${imagenSeleccionada.name}`;
    inputPrecio.value = imagenSeleccionada.precio;
  });
}

/**
 * Selecciona un producto inicial y actualiza imagen/precio,
 * útil en modo creación al cargar la página.
 * @param {HTMLSelectElement} selectProducto
 * @param {HTMLImageElement} imagenProducto
 * @param {HTMLInputElement} inputPrecio
 */
function seleccionarProductoInicial(selectProducto, imagenProducto, inputPrecio) {
  const primeraOpcionValida = Array.from(selectProducto.options).find(
    (opcion) => opcion.value && opcion.value.trim() !== ""
  );

  if (!primeraOpcionValida) {
    return;
  }

  selectProducto.value = primeraOpcionValida.value;

  const imagenSeleccionada = imagenesProductos.find(
    (imagen) => imagen.name === selectProducto.value
  );

  if (imagenSeleccionada) {
    imagenProducto.src = imagenSeleccionada.url;
    imagenProducto.alt = `Imagen de ${imagenSeleccionada.name}`;
    inputPrecio.value = imagenSeleccionada.precio;
  }
}

/**
 * Carga un producto existente desde la API para editarlo.
 * @param {string} productoId
 * @param {HTMLSelectElement} selectProducto
 * @param {HTMLImageElement} imagenProducto
 * @param {HTMLInputElement} inputPrecio
 * @param {HTMLInputElement} inputStock
 * @param {HTMLTextAreaElement} inputDescripcion
 */
async function cargarProductoParaEdicion(
  productoId,
  selectProducto,
  imagenProducto,
  inputPrecio,
  inputStock,
  inputDescripcion
) {
  try {
    const respuesta = await fetch(`${apiBaseUrl}/productos/${productoId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!respuesta.ok) {
      throw new Error(`Error al obtener producto. Código HTTP: ${respuesta.status}`);
    }

    const producto = await respuesta.json();

    // Intentar seleccionar en el <select> el nombre que viene de la BD.
    // Si no existe esa opción, añadirla para poder editar productos con nombre personalizado.
    if (producto.nombre) {
      const opcionExistente = Array.from(selectProducto.options).find(
        (opt) => opt.value === producto.nombre
      );
      if (!opcionExistente) {
        const nuevaOpcion = document.createElement("option");
        nuevaOpcion.value = producto.nombre;
        nuevaOpcion.textContent = producto.nombre;
        selectProducto.appendChild(nuevaOpcion);
      }
      selectProducto.value = producto.nombre;
    }

    inputPrecio.value = producto.precio ?? "";
    inputStock.value = producto.stock ?? "";
    inputDescripcion.value = producto.descripcion ?? "";

    // Imagen: si viene de la BD, usarla; si no, usar la imagen del catálogo local
    if (producto.imagen) {
      imagenProducto.src = producto.imagen;
      imagenProducto.alt = `Imagen de ${producto.nombre ?? "producto"}`;
    } else {
      const imagenSeleccionada = imagenesProductos.find(
        (imagen) => imagen.name === selectProducto.value
      );
      if (imagenSeleccionada) {
        imagenProducto.src = imagenSeleccionada.url;
        imagenProducto.alt = `Imagen de ${imagenSeleccionada.name}`;
      }
    }
  } catch (error) {
    console.error("Error al cargar producto para edición:", error);
    alert("No se pudo cargar la información del producto.");
  }
}

/**
 * Construye el objeto de datos que se enviará al backend.
 * @param {HTMLSelectElement} selectProducto
 * @param {HTMLImageElement} imagenProducto
 * @param {HTMLInputElement} inputPrecio
 * @param {HTMLInputElement} inputStock
 * @param {HTMLTextAreaElement} inputDescripcion
 * @returns {{nombre:string, descripcion:string, precio:number, stock:number, imagen:string}}
 */
function construirDatosProducto(
  selectProducto,
  imagenProducto,
  inputPrecio,
  inputStock,
  inputDescripcion
) {
  const precioNumero = Number(inputPrecio.value);
  const stockNumero = Number(inputStock.value);

  // Elegir la URL de imagen: la que se ve en pantalla o la del catálogo
  let urlImagen = imagenProducto.src || "";
  if (!urlImagen) {
    const imagenSeleccionada = imagenesProductos.find(
      (imagen) => imagen.name === selectProducto.value
    );
    if (imagenSeleccionada) {
      urlImagen = imagenSeleccionada.url;
    }
  }

  return {
    nombre: selectProducto.value,
    descripcion: inputDescripcion.value.trim(),
    precio: precioNumero,
    stock: stockNumero,
    imagen: urlImagen
  };
}

/**
 * Valida los datos antes de enviarlos al backend.
 * @param {Object} datosProducto
 * @returns {boolean} true si es válido, false si hay errores.
 */
function validarDatosProducto(datosProducto) {
  if (!datosProducto.nombre || datosProducto.nombre.trim() === "") {
    alert("Selecciona un nombre de producto válido.");
    return false;
  }

  if (isNaN(datosProducto.precio) || datosProducto.precio <= 0) {
    alert("Ingresa un precio válido mayor a 0.");
    return false;
  }

  if (isNaN(datosProducto.stock) || datosProducto.stock < 0) {
    alert("Ingresa un stock válido (0 o mayor).");
    return false;
  }

  return true;
}

/**
 * Envía una petición POST para crear un nuevo producto.
 * @param {Object} datosProducto
 */
async function crearProducto(datosProducto) {
  const respuesta = await fetch(`${apiBaseUrl}/productos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(datosProducto)
  });

  if (!respuesta.ok) {
    const textoError = await respuesta.text();
    throw new Error(`Error al crear producto: ${textoError}`);
  }
}

/**
 * Envía una petición PUT para actualizar un producto existente.
 * @param {string} productoId
 * @param {Object} datosProducto
 */
async function actualizarProducto(productoId, datosProducto) {
  const respuesta = await fetch(`${apiBaseUrl}/productos/${productoId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(datosProducto)
  });

  if (!respuesta.ok) {
    const textoError = await respuesta.text();
    throw new Error(`Error al actualizar producto: ${textoError}`);
  }
}