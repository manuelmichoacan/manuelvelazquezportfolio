define(['knockout', 'ojs/ojarraydataprovider', 'services/ThemeService', 'ojs/ojknockout', 'ojs/ojtable', 'ojs/ojbutton', 'ojs/ojdialog', 'ojs/ojformlayout', 'ojs/ojinputtext'],
 function(ko, ArrayDataProvider, ThemeService) {
    function ProductosViewModel() {
      var self = this;
      
      const API_URL = 'https://m5zj9o01s5.execute-api.us-east-1.amazonaws.com/produccion/productos';

      // Estados de Tabla e Inventario
      self.productsList = ko.observableArray([]);
      self.productsDataProvider = new ArrayDataProvider(self.productsList, { keyAttributes: 'id' });
      self.uploading = ko.observable(false);

      // Estados de Control del Modal
      self.modalTitle = ko.observable('Nuevo Producto');
      self.isEditMode = ko.observable(false);

      // Objeto Observador Único para el Formulario CRUD
      self.formProduct = {
        id: ko.observable(''),
        nombre: ko.observable(''),
        precio: ko.observable(''),
        codigo_barras: ko.observable('')
      };

      // Helper para obtener el Token de Autenticación de Cognito
      const getAuthToken = async () => {
        const api = window.aws_amplify || window.Amplify;
        const session = await api.Auth.currentSession();
        return session.getIdToken().getJwtToken();
      };

      // --- OPERACIÓN: LEER (READ) ---
      self.loadProductsFromDynamo = async function() {
        try {
          const token = await getAuthToken();
          const response = await fetch(API_URL, {
            method: 'GET',
            headers: { 'Authorization': token }
          });
          if (!response.ok) throw new Error("Error obteniendo datos.");
          const data = await response.json();
          self.productsList(data);
        } catch (e) {
          console.error("Error al leer el inventario de AWS:", e);
        }
      };

      // --- OPERACIÓN: CREAR / ACTUALIZAR (CREATE / UPDATE) ---
      self.saveProduct = async function() {
        // Validaciones básicas de campos vacíos
        if(!self.formProduct.id() || !self.formProduct.nombre() || !self.formProduct.precio()) {
          alert("Por favor completa los campos requeridos.");
          return;
        }

        const payload = {
          id: String(self.formProduct.id().trim()),
          nombre: self.formProduct.nombre().trim(),
          precio: parseFloat(String(self.formProduct.precio()).replace('$', '')),
          codigo_barras: String(self.formProduct.codigo_barras() || '').trim()
        };

        try {
          const token = await getAuthToken();
          // Si estamos en modo edición usamos PUT, de lo contrario usamos POST
          const method = self.isEditMode() ? 'PUT' : 'POST';

          const response = await fetch(API_URL, {
            method: method,
            headers: {
              'Authorization': token,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            self.closeModal();
            self.loadProductsFromDynamo(); // Refrescar la vista
          } else {
            const errData = await response.json();
            alert("Error del servidor: " + (errData.error || "Operación fallida"));
          }
        } catch (error) {
          console.error("Error al guardar producto:", error);
        }
      };

      // --- OPERACIÓN: ELIMINAR (DELETE) ---
      self.deleteProduct = async function(id) {
        if (!confirm(`¿Estás seguro de que deseas eliminar el producto con ID: ${id}?`)) return;

        try {
          const token = await getAuthToken();
          const response = await fetch(`${API_URL}?id=${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': token }
          });

          if (response.ok) {
            self.loadProductsFromDynamo();
          } else {
            alert("No se pudo eliminar el producto de la base de datos.");
          }
        } catch (e) {
          console.error("Error en operación DELETE:", e);
        }
      };

      // --- PROCESAMIENTO ADICIONAL: CARGA MASIVA CSV ---
      self.triggerFilePicker = () => document.getElementById('filePicker').click();

      self.handleCSVUpload = function(event) {
        const file = event.target.files[0];
        if (!file) return;

        self.uploading(true);
        const reader = new FileReader();
        reader.onload = async function(e) {
          const text = e.target.result;
          const lines = text.split('\n');
          const jsonProducts = [];

          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line === '') continue;
            const cols = line.split(',');
            jsonProducts.push({
              id: cols[0].trim(),
              nombre: cols[1].trim(),
              precio: parseFloat(cols[2].trim()),
              codigo_barras: cols[3] ? cols[3].trim() : ''
            });
          }

          try {
            const token = await getAuthToken();
            const response = await fetch(`${API_URL}/bulk`, {
              method: 'POST',
              headers: { 'Authorization': token, 'Content-Type': 'application/json' },
              body: JSON.stringify({ productos: jsonProducts })
            });

            if (response.ok) {
              alert("¡Archivo CSV cargado e insertado masivamente con éxito!");
              self.loadProductsFromDynamo();
            }
          } catch (err) { console.error(err); }
          finally {
            self.uploading(false);
            document.getElementById('filePicker').value = "";
          }
        };
        reader.readAsText(file);
      };

      // --- CONTROLIZACIÓN DE MODALES ---
      self.openCreateModal = function() {
        self.modalTitle('Nuevo Producto');
        self.isEditMode(false);
        // Inicializar vacío
        self.formProduct.id('');
        self.formProduct.nombre('');
        self.formProduct.precio('');
        self.formProduct.codigo_barras('');
        document.getElementById('productDialog').open();
      };

      self.openEditModal = function(row) {
        self.modalTitle('Modificar Producto');
        self.isEditMode(true);
        // Cargar datos seleccionados en los inputs de JET
        self.formProduct.id(row.id);
        self.formProduct.nombre(row.nombre);
        self.formProduct.precio(row.precio);
        self.formProduct.codigo_barras(row.codigo_barras || '');
        document.getElementById('productDialog').open();
      };

      self.closeModal = () => document.getElementById('productDialog').close();

      self.connected = function() {
        self.loadProductsFromDynamo();
      };
    }
    return ProductosViewModel;
 });