import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (totalPages > 1) {
      <div class="pagination">
        <button 
          class="page-btn prev" 
          [disabled]="currentPage === 0"
          (click)="onPageChange(currentPage - 1)"
        >
          <span class="material-symbols-rounded">chevron_left</span>
        </button>

        @for (page of getPageNumbers(); track page) {
          <button 
            class="page-btn" 
            [class.active]="page === currentPage"
            (click)="onPageChange(page)"
          >
            {{ page + 1 }}
          </button>
        }

        <button 
          class="page-btn next" 
          [disabled]="currentPage === totalPages - 1"
          (click)="onPageChange(currentPage + 1)"
        >
          <span class="material-symbols-rounded">chevron_right</span>
        </button>
      </div>
    }
  `,
  styles: [`
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.5rem;
      margin-top: 3rem;
      flex-wrap: wrap;
    }

    .page-btn {
      min-width: 44px;
      height: 44px;
      padding: 0 0.8rem;
      border: 2px solid #e0e0e0;
      background: white;
      color: #666;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .page-btn:hover:not(:disabled) {
      border-color: #2e8b57;
      color: #2e8b57;
      background: rgba(46, 139, 87, 0.05);
    }

    .page-btn.active {
      background: linear-gradient(135deg, #2e8b57, #3cb371);
      color: white;
      border-color: #2e8b57;
    }

    .page-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .page-btn.prev,
    .page-btn.next {
      padding: 0;
    }

    .page-btn .material-symbols-rounded {
      font-size: 1.5rem;
    }

    @media (max-width: 768px) {
      .pagination {
        gap: 0.3rem;
      }

      .page-btn {
        min-width: 40px;
        height: 40px;
        font-size: 0.9rem;
      }
    }
  `]
})
export class PaginationComponent {
  @Input() currentPage: number = 0;
  @Input() totalPages: number = 0;
  @Input() maxPagesToShow: number = 5;
  @Output() pageChange = new EventEmitter<number>();

  getPageNumbers(): number[] {
    const pages: number[] = [];
    
    let startPage = Math.max(0, this.currentPage - Math.floor(this.maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages - 1, startPage + this.maxPagesToShow - 1);
    
    if (endPage - startPage < this.maxPagesToShow - 1) {
      startPage = Math.max(0, endPage - this.maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  onPageChange(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.pageChange.emit(page);
    }
  }
}