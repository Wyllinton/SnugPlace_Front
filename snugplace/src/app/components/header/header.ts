// header.component.ts

import { Component, signal, HostListener } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [RouterModule, CommonModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
  standalone: true
})
export class Header {
  protected readonly title = signal('SnugPlace');
  
  // Control del menú móvil
  menuOpen = false;
  
  // Control del scroll
  isScrolled = false;

  // Detectar scroll para cambiar estilo del navbar
  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50;
  }

  // Toggle menú móvil
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  // Cerrar menú móvil
  closeMenu() {
    this.menuOpen = false;
  }
}