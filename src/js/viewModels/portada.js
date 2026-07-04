define(['knockout'], function(ko) {
  function PortadaViewModel() {
    var self = this;

    // Datos de habilidades para el gráfico
    self.skillsData = [
      { name: "PL/SQL", items: [{ value: 90 }] },
      { name: "SQL", items: [{ value: 85 }] },
      { name: "ETL", items: [{ value: 80 }] },
      { name: "JavaScript", items: [{ value: 75 }] },
      { name: "AWS Architect", items: [{ value: 70 }] },
      { name: "Oracle JET/APEX", items: [{ value: 65 }] },
      { name: "Python", items: [{ value: 80 }] },
      { name: "Azure Databricks", items: [{ value: 60 }] }
    ];

    // Acciones de botones
    self.goLinkedIn = function() {
      window.open("https://www.linkedin.com/in/manuel-velazquez-guzman", "_blank");
    };

    self.goContacto = function() {
      window.location.href = "mailto:manuel@example.com";
    };
  }

  return PortadaViewModel;
});