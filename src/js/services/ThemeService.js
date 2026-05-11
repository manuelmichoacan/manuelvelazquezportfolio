define(['knockout'], function (ko) {
    function ThemeService() {
        var self = this;

        // Observables para la configuración del negocio
        self.businessName = ko.observable('Cargando...');
        self.businessLogo = ko.observable('');
        self.primaryColor = ko.observable('#004a99'); // Color por defecto

        /**
         * Aplica la configuración recibida desde la API (Lambda/DynamoDB)
         * @param {Object} config - Datos del negocio
         */
        self.applyTheme = function (config) {
            if (!config) return;

            // Actualizar datos de identidad
            self.businessName(config.name || 'Mi Negocio');
            self.businessLogo(config.logoUrl || '');

            // Inyección dinámica de CSS Variables
            if (config.primaryColor) {
                document.documentElement.style.setProperty('--oj-button-bg-color', config.primaryColor);
                document.documentElement.style.setProperty('--app-primary-color', config.primaryColor);
            }
            
            if (config.secondaryColor) {
                document.documentElement.style.setProperty('--app-secondary-color', config.secondaryColor);
            }

            console.log("Tema SaaS aplicado para:", config.name);
        };
    }

    return new ThemeService();
});