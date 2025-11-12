import { Component, signal, HostListener, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TokenService } from '../../services/token-service';
import { UserService } from '../../services/user-service';
import { UserDTO } from '../../models/user-dto';

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
      const userId = this.tokenService.getUserId();
      if (userId) {
        this.loadUserProfile(parseInt(userId));
      }
    }
  }

  loadUserProfile(userId: number) {
    this.userService.getProfile(userId).subscribe({
      next: (response) => {
        if (!response.error) {
          this.currentUser = response.content;
        }
      },
      error: (error) => {
        console.error('Error al cargar perfil:', error);
      }
    });
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
    this.profileMenuOpen = false;
    this.router.navigate(['/']);
  }

  editProfile() {
    this.profileMenuOpen = false;
    this.router.navigate(['/profile']);
  }
}