define(['knockout', 'ojs/ojrouter', 'ojs/ojformlayout', 'ojs/ojinputtext', 'ojs/ojbutton', 'ojs/ojknockout'],
 function(ko, Router) {
    function LoginViewModel() {
        var self = this;

        // Observables para el formulario
        self.userName = ko.observable('');
        self.password = ko.observable('');
        self.loading = ko.observable(false);
        self.errorMessage = ko.observable('');
    
        // Observables para el flujo de Cambio Obligatorio
        self.passwordChallengeRequired = ko.observable(false);
        self.newPassword = ko.observable('');
        self.confirmNewPassword = ko.observable('');
        
        // Objeto temporal para guardar la sesión parcial de Cognito
        let cognitoUserObj = null;

        self.handleLogin = async function() {
            self.errorMessage('');
            self.loading(true);
        
            // Recuperamos la instancia de Amplify desde la variable global
            const api = window.aws_amplify || window.Amplify;
            
            if (!api.Auth._config || Object.keys(api.Auth._config).length === 0) {
                console.error("Amplify no está configurado. Reintentando configuración...");
                self.errorMessage("Error interno del sistema de autenticación.");
                self.loading(false);
                return;
            };

            try {
                // Llamada a Cognito a través de Amplify
                const user = await api.Auth.signIn(self.userName(), self.password());
                
                /*if (rootViewModel && rootViewModel.selection) {
                    //Se actualiza el usuario en el Controller
                    rootViewModel.userLogin(user.username);
                    sessionStorage.setItem('SaaS_Session_Active', 'true');
                    sessionStorage.setItem('SaaS_User', user.username);
                    // Se redirige a ventas
                    setTimeout(() => {
                        console.log("2. Credenciales asentadas. Redirigiendo a Ventas...");
                        // Navegamos usando el CoreRouter/adaptador configurado en tu appController
                        if (rootViewModel.selection && rootViewModel.selection.path) {
                            rootViewModel.selection.path('ventas');
                        } else {
                            // Contingencia por Hash si el árbol del DOM está ocupado
                            window.location.hash = '?ojr=ventas';
                        };
                    }, 150); 
                } else {
                    console.error("No se pudo encontrar el router global.");
                }*/
               if (user.challengeName === 'NEW_PASSWORD_REQUIRED') {
                    console.log("Desafío detectado: Se requiere cambiar contraseña.");
                    cognitoUserObj = user; // Guardamos la sesión intermedia
                    self.passwordChallengeRequired(true); // Switch visual en el HTML
                    self.loading(false);
                    return; 
                }

                // Si no hay desafío, el flujo continúa normal
                await self.completeSuccessfulLogin(user.username);
            } catch (error) {
                console.error("Error de login:", error);
                self.errorMessage(error.message || "Usuario o contraseña incorrectos");
                self.loading(false);
            };
        };
        self.handlePasswordChallenge = async function() {
            self.errorMessage('');

            if (!self.newPassword() || !self.confirmNewPassword()) {
                self.errorMessage("Por favor llena todos los campos.");
                return;
            }

            if (self.newPassword() !== self.confirmNewPassword()) {
                self.errorMessage("Las contraseñas no coinciden.");
                return;
            }

            self.loading(true);
            const api = window.aws_amplify || window.Amplify;

            try {
                console.log("Enviando nueva contraseña a AWS Cognito...");
                const userAttributes = {
                    'address': 'Principal Morelia'
                };
                // Completar el reto usando el objeto guardado
                const loggedUser = await api.Auth.completeNewPassword(
                    cognitoUserObj,
                    self.newPassword(),
                    userAttributes//cognitoUserObj.challengeParam.requiredAttributes
                );

                console.log("Contraseña actualizada con éxito.");
                await self.completeSuccessfulLogin(loggedUser.username || self.userName());

            } catch (err) {
                console.error("Error al completar el cambio de contraseña:", err);
                self.errorMessage(err.message || "Error al actualizar la contraseña. Verifica las políticas de seguridad (Mayúsculas, números o longitud).");
            } finally {
                self.loading(false);
            }
        };
        self.completeSuccessfulLogin = async function(username) {
            console.log("Acceso concedido para:", username);

            // Inyectar el usuario de inmediato en el appController global
            const rootViewModel = ko.dataFor(document.getElementById('globalBody'));
            if (rootViewModel) {
                rootViewModel.userLogin(username);
                
                // Desencadenar la carga de configuración del negocio si aplica
                if (typeof rootViewModel.loadBusinessConfig === "function") {
                    rootViewModel.loadBusinessConfig();
                }
            }

            // Pequeña pausa para asegurar la escritura del LocalStorage por parte de Amplify
            setTimeout(() => {
                Router.rootInstance.go('ventas');
            }, 100);
        };
        self.cancelChallenge = function() {
            cognitoUserObj = null;
            self.newPassword('');
            self.confirmNewPassword('');
            self.passwordChallengeRequired(false);
            self.errorMessage('');
        };
    }
    return LoginViewModel;
 });