import { Component, signal, HostListener, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TokenService } from '../../services/token-service';
import { UserService } from '../../services/user-service';
import { UserDTO } from '../../models/user-dto';
import { Role } from '../../models/user-role';

@Component({
  selector: 'app-header',
  imports: [RouterModule, CommonModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
  standalone: true
})
export class Header implements OnInit {
  protected readonly title = signal('SnugPlace');
  
  menuOpen = false;
  isScrolled = false;
  profileMenuOpen = false;
  currentUser: UserDTO | null = null;
  userId: number | null = null;

  constructor(
    private tokenService: TokenService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    this.checkAuthentication();
  }

  checkAuthentication() {
    if (this.tokenService.isLogged()) {
      // OBTENER EL ID NUMÉRICO DIRECTAMENTE DEL TOKEN
      this.userId = this.tokenService.getUserId();
      console.log('ID obtenido del token:', this.userId);
      
      if (this.userId && this.userId > 0) {
        this.loadUserProfile(this.userId);
      } else {
        this.createTemporaryUser();
      }
    }
  }

  loadUserProfile(userId: number) {
    this.userService.getProfile(userId).subscribe({
      next: (response) => {
        if (!response.error && response.content) {
          this.currentUser = response.content;
          console.log('Usuario cargado:', this.currentUser);
        } else {
          this.createTemporaryUser();
        }
      },
      error: (error) => {
        console.error('Error al cargar perfil:', error);
        this.createTemporaryUser();
      }
    });
  }

  private createTemporaryUser() {
    this.currentUser = {
      id: this.userId || 0,
      name: 'Usuario',
      email: 'usuario@ejemplo.com', // Email temporal
      photoUrl: '',
      role: Role.USER
    };
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50;
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }

  toggleProfileMenu() {
    this.profileMenuOpen = !this.profileMenuOpen;
  }

  closeProfileMenu() {
    this.profileMenuOpen = false;
  }

  isLoggedIn(): boolean {
    return this.tokenService.isLogged();
  }

  logout() {
    this.tokenService.logout();
    this.currentUser = null;
    this.userId = null;
    this.profileMenuOpen = false;
    this.router.navigate(['/']).then(() => {
      window.location.reload();
    });
  }

  editProfile() {
    this.profileMenuOpen = false;
    
    if (this.userId && this.userId > 0) {
      console.log('Navegando a editar perfil para userId:', this.userId);
      // Usar el ID numérico en la ruta
      this.router.navigate([`${this.userId}/profile/edit`]);
    } else {
      console.error('No se pudo obtener el ID del usuario');
      this.router.navigate(['/login']);
    }
  }
}