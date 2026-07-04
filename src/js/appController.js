/**
 * @license
 * Copyright (c) 2014, 2026, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
/*
 * Your application specific code will go here
 */
define(['knockout', 'ojs/ojcontext', 'ojs/ojmodule-element-utils', 'ojs/ojknockouttemplateutils', 'ojs/ojcorerouter', 'ojs/ojmodulerouter-adapter', 'ojs/ojknockoutrouteradapter', 'ojs/ojurlparamadapter', 'ojs/ojresponsiveutils', 'ojs/ojresponsiveknockoututils', 'ojs/ojarraydataprovider',
        'services/ThemeService', 'ojs/ojdrawerpopup', 'ojs/ojmodule-element', 'ojs/ojknockout'],
  function(ko, Context, moduleUtils, KnockoutTemplateUtils, CoreRouter, ModuleRouterAdapter, KnockoutRouterAdapter, UrlParamAdapter, ResponsiveUtils, ResponsiveKnockoutUtils, ArrayDataProvider, ThemeService) {

     function ControllerViewModel() {
      var self = this;

      self.KnockoutTemplateUtils = KnockoutTemplateUtils;
      self.theme = ThemeService;

      // Handle announcements sent when pages change, for Accessibility.
      self.manner = ko.observable('polite');
      self.message = ko.observable();
      announcementHandler = (event) => {
          self.message(event.detail.message);
          self.manner(event.detail.manner);
      };

      document.getElementById('globalBody').addEventListener('announce', announcementHandler, false);


      // Media queries for responsive layouts
      const smQuery = ResponsiveUtils.getFrameworkQuery(ResponsiveUtils.FRAMEWORK_QUERY_KEY.SM_ONLY);
      self.smScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(smQuery);
      const mdQuery = ResponsiveUtils.getFrameworkQuery(ResponsiveUtils.FRAMEWORK_QUERY_KEY.MD_UP);
      self.mdScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(mdQuery);

      /*let navData = [
        { path: '', redirect: 'dashboard' },
        { path: 'dashboard', detail: { label: 'Dashboard', iconClass: 'oj-ux-ico-bar-chart' } },
        { path: 'incidents', detail: { label: 'Incidents', iconClass: 'oj-ux-ico-fire' } },
        { path: 'customers', detail: { label: 'Customers', iconClass: 'oj-ux-ico-contact-group' } },
        { path: 'about', detail: { label: 'About', iconClass: 'oj-ux-ico-information-s' } }
      ];*/

      let navData = [
        { path: '', redirect: 'portada' },
        { path: 'portada', detail: { label: 'Acerca de mí | Manuel Velázquez Guzmán', iconClass: 'oj-ux-ico-information-s' } }
      ];
      // Router setup
      let router = new CoreRouter(navData, {
        urlAdapter: new UrlParamAdapter()
      });
      router.sync();
      self.menuRoutes = ko.observableArray([]);

      self.moduleAdapter = new ModuleRouterAdapter(router);
      self.selection = new KnockoutRouterAdapter(router);

      self.selection.path.subscribe(function(currentPath){
        console.log(currentPath);
        if (currentPath === 'portada') {
          self.menuRoutes([]);
        } else {
          let filtrado = navData.filter(route => route.path !== 'portada' && route.path !== ''); 
          self.menuRoutes(filtrado);          
        };
        console.log(self.menuRoutes());
      });
      // Setup the navDataProvider with the routes, excluding the first redirected
      // route.
      self.navDataProvider = new ArrayDataProvider(self.menuRoutes, {keyAttributes: "path"});

      // Drawer
      self.sideDrawerOn = ko.observable(false);

      // Close drawer on medium and larger screens
      self.mdScreen.subscribe(() => { self.sideDrawerOn(false) });

      // Called by navigation drawer toggle button and after selection of nav drawer item
      self.toggleDrawer = () => {
        self.sideDrawerOn(!self.sideDrawerOn());
      }

      // Header
      // Application Name used in Branding Area
      //self.appName = ko.observable("App Name");
      // User Info used in Global Navigation area
      self.userLogin = ko.observable("");

      /*self.loadBusinessConfig = async function() {
        // Detectamos Amplify
        
        const api = window.aws_amplify || window.Amplify;
        
        try {
          const session = await api.Auth.currentSession();
          const token = session.getIdToken().getJwtToken();
          console.log(session);
          console.log(token);
          // Llamada al API Gateway (Lambda -> DynamoDB)
          const response = await fetch('https://ovd1d7pu1h.execute-api.us-east-1.amazonaws.com', {
              headers: { 'Authorization': token }
          });
          console.log(response);
          
          //const config = await response.json();

          // Aplicamos el tema dinámico
          //ThemeService.applyTheme(config);
          
          // Actualizamos el nombre de la app con el del negocio
          //if(config.name) self.appName(config.name);
        } catch (e) {
          console.log("No hay sesión activa o error de red, se mantiene tema por defecto.");
        }
      };

      // Ejecutar la carga al inicializar
      self.loadBusinessConfig();*/

      // Footer
      /*self.footerLinks = [
        { name: "About Galápagos", linkId: "aboutGalapagos", linkTarget:'http://www.oracle.com/us/corporate/index.html#menu-about'},
        { name: "Contact Us", id: "contactUs", linkTarget: "http://www.oracle.com/us/corporate/contact/index.html" },
        { name: "Legal Notices", id: "legalNotices", linkTarget: "http://www.oracle.com/us/legal/index.html" },
        { name: "Terms Of Use", id: "termsOfUse", linkTarget: "http://www.oracle.com/us/legal/terms/index.html" },
        { name: "Your Privacy Rights", id: "yourPrivacyRights", linkTarget: "http://www.oracle.com/us/legal/privacy/index.html" },
      ];*/
      self.footerLinks = [
        { name: "About Galapagos", linkId: "aboutGalapagos" },
        { name: "Contacta", id: "contactUs" },
        { name: "Legales", id: "legalNotices" },
        { name: "Terminos de uso", id: "termsOfUse" },
        { name: "Derechos de privacidad", id: "yourPrivacyRights" },
      ];
      
     }
     // release the application bootstrap busy state
     Context.getPageContext().getBusyContext().applicationBootstrapComplete();

     return new ControllerViewModel();
  }
);
