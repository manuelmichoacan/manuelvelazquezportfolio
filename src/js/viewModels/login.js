define(['knockout', 'ojs/ojrouter', 'ojs/ojformlayout', 'ojs/ojinputtext', 'ojs/ojbutton', 'ojs/ojknockout'],
 function(ko, Router) {
    function LoginViewModel() {
      var self = this;

      // Observables para el formulario
      self.userName = ko.observable('');
      self.password = ko.observable('');
      self.loading = ko.observable(false);
      self.errorMessage = ko.observable('');

      self.handleLogin = async function() {
        self.errorMessage('');
        self.loading(true);
        
        // Recuperamos la instancia de Amplify desde la variable global
        const api = window.aws_amplify || window.Amplify;
        console.log("Intentando iniciar sesión con:", self.userName(), self.password(),api);
        if (!api.Auth._config || Object.keys(api.Auth._config).length === 0) {
            console.error("Amplify no está configurado. Reintentando configuración...");
            // Forzar re-configuración si es necesario
            return;
        };

        try {
          // Llamada a Cognito a través de Amplify
          const user = await api.Auth.signIn(self.userName(), self.password());
          console.log("Intentando iniciar sesión con:", self.userName(), self.password(),api);
          console.log("Acceso concedido para:", user.username);

          // Redirigir al dashboard tras éxito
          Router.rootInstance.go({path: 'dashboard'});
        } catch (error) {
          console.error("Error de login:", error);
          self.errorMessage("Usuario o contraseña incorrectos");
        } finally {
          self.loading(false);
        }
      };
    }
    return LoginViewModel;
 });