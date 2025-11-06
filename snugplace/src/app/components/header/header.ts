import { Component, signal } from '@angular/core';
import { RouterModule} from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  protected readonly title = signal('snugplace');
  protected readonly footer = signal('Universidad del Quindio 2025');
}
