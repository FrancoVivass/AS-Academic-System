import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { EncabezadoPrincipal } from '../encabezado-principal/encabezado-principal';
import { FooterPrincipal } from '../footer-principal/footer-principal';

@Component({
  selector: 'app-soporte',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatExpansionModule, EncabezadoPrincipal, FooterPrincipal],
  templateUrl: './soporte.html',
  styleUrl: './soporte.css'
})
export class SoporteComponent {
  faqs = [
    {
      pregunta: '¿Cómo puedo registrarme en AcademicSystem?',
      respuesta: 'Para registrarte, primero debes seleccionar tu institución educativa. Luego, necesitarás la credencial de acceso proporcionada por tu institución. Si tu institución aún no está registrada, contáctanos para ayudarte con el proceso.'
    },
    {
      pregunta: '¿Qué necesito para comenzar a usar AcademicSystem?',
      respuesta: 'Solo necesitas tener acceso a internet y la credencial de acceso de tu institución. AcademicSystem funciona en cualquier dispositivo con navegador web moderno, sin necesidad de instalar software adicional.'
    },
    {
      pregunta: '¿Es seguro AcademicSystem?',
      respuesta: 'Absolutamente. Utilizamos encriptación de datos de nivel empresarial y cumplimos con los más altos estándares de seguridad. Todos los datos están protegidos y solo accesibles por personal autorizado de tu institución.'
    },
    {
      pregunta: '¿Puedo usar AcademicSystem en mi móvil?',
      respuesta: 'Sí, AcademicSystem es completamente responsive y funciona perfectamente en dispositivos móviles, tablets y computadoras. Puedes acceder desde cualquier lugar y en cualquier momento.'
    },
    {
      pregunta: '¿Qué pasa si olvido mi contraseña?',
      respuesta: 'Puedes recuperar tu contraseña usando la opción "¿Olvidaste tu contraseña?" en la página de inicio de sesión. Si tienes problemas, contacta al administrador de tu institución o a nuestro equipo de soporte.'
    },
    {
      pregunta: '¿Cómo puedo contactar con soporte?',
      respuesta: 'Puedes contactarnos a través del formulario de contacto en nuestra página web, por email a soporte@academicsystem.com, o utilizando la sección de ayuda dentro de la plataforma si ya tienes una cuenta activa.'
    }
  ];
}






