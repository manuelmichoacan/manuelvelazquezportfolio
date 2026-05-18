define(['knockout', 'ojs/ojarraydataprovider', 'services/ThemeService', 'ojs/ojrouter', 'ojs/ojknockout', 'ojs/ojtable', 'ojs/ojinputtext', 'ojs/ojinputnumber', 'ojs/ojbutton'],
 function(ko, ArrayDataProvider, ThemeService, Router) {
    function SalesViewModel(params) {
      var self = this;

      // Datos de sesión (Desde appController)
      //let appController = document.getElementById('globalBody')._viewModel || params.parentRouter; 
      const rootViewModel = ko.dataFor(document.getElementById('globalBody'));
    
      //self.userLogin = params.parentRouter.parent.viewModel.userLogin;
      //self.userLogin = appController.userLogin || ko.observable("Usuario");
      self.userLogin = rootViewModel ? rootViewModel.userLogin : ko.observable("Usuario");
      self.theme = ThemeService;

      // Estado del Carrito y UI
      self.searchTerm = ko.observable('');
      self.cart = ko.observableArray([]);
      self.loading = ko.observable(false);
      self.cartDataProvider = new ArrayDataProvider(self.cart, { keyAttributes: 'id' });

      // Cálculo automático del total
      self.totalVenta = ko.pureComputed(() => {
        return self.cart().reduce((acc, curr) => acc + (curr.precio * curr.cantidad()), 0);
      });

      // Búsqueda en API Gateway con Debounce
      let searchTimeout;
      self.handleSearch = async (event) => {
        const val = event.detail.value;
        if (!val || val.length < 3) return;

        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async () => {
          await self.searchProduct(val);
        }, 500);
      };

      self.searchProduct = async (query) => {
        const api = window.aws_amplify || window.Amplify;
        try {
          const session = await api.Auth.currentSession();
          const token = session.getIdToken().getJwtToken();

          const response = await fetch(`TU_API_GATEWAY_URL/products?search=${query}`, {
            headers: { 'Authorization': token }
          });
          const product = await response.json(); // Asumiendo que devuelve el primer match

          if (product && product.id) {
            self.addProductToCart(product);
            self.searchTerm(''); // Limpiar buscador
          }
        } catch (e) { console.error("Error buscando producto:", e); }
      };

      self.addProductToCart = (item) => {
        const existing = self.cart().find(p => p.id === item.id);
        if (existing) {
          existing.cantidad(existing.cantidad() + 1);
        } else {
          self.cart.push({
            id: item.id,
            nombre: item.nombre,
            precio: item.precio,
            cantidad: ko.observable(1)
          });
        }
      };

      self.removeProduct = (id) => {
        self.cart.remove(p => p.id === id);
      };

      self.updateCartTotals = () => { /* Gatilla recalculo de ko.computed */ };

      // Finalizar Venta (POST a Lambda)
      self.finalizeSale = async () => {
        self.loading(true);
        const api = window.aws_amplify || window.Amplify;
        
        const payload = {
          items: self.cart().map(i => ({ id: i.id, cant: i.cantidad(), sub: i.precio * i.cantidad() })),
          total: self.totalVenta(),
          vendedor: self.userLogin(),
          timestamp: new Date().toISOString()
        };

        try {
          const session = await api.Auth.currentSession();
          const token = session.getIdToken().getJwtToken();

          const res = await fetch('TU_API_GATEWAY_URL/sales', {
            method: 'POST',
            headers: { 'Authorization': token, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            alert("Venta procesada con éxito");
            self.cart.removeAll();
          }
        } catch (e) { alert("Error al procesar venta"); }
        finally { self.loading(false); }
      };

      // Seguridad: Redirigir si no hay sesión
      self.connected = async function() {
        const api = window.aws_amplify || window.Amplify;
        if(!api || !api.Auth || !api.Auth._config || Object.keys(api.Auth._config).length === 0) {
          console.warn("Amplify no inicializado aún en Ventas. Reintentando en breve...");
          setTimeout(self.connected, 300);
          return;
        };
        setTimeout(async () => {
          try { 
            console.log("Entra al try");
            const user = await api.Auth.currentAuthenticatedUser();
            console.log(user);           
            const rootViewModel = ko.dataFor(document.getElementById('globalBody'));
            console.log(rootViewModel);          
            if (rootViewModel && (!rootViewModel.userLogin() || rootViewModel.userLogin() === "Usuario")) {
              rootViewModel.userLogin(user.username);
            };
          }catch (e) { 
            console.log("Entra al catch: ",e);
            const rootViewModel = ko.dataFor(document.getElementById('globalBody'));
            
            if (rootViewModel && rootViewModel.selection) {
              // En CoreRouter, para navegar simplemente cambiamos el observable de selección
              rootViewModel.selection.path('login'); 
            } else {
              window.location.hash = '?ojr=login';
              console.error("No se pudo encontrar el router global.");
            };
          };
        }, 500);
      };
    }
    return SalesViewModel;
 });