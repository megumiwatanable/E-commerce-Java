import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { Category, Product } from '../../../models/product.model';
import { InventoryService, InventoryStatus } from '../../../services/inventory.service';
import { ProductService } from '../../../services/product.service';
import { ToastService } from '../../../services/toast.service';

type InventoryForm = Partial<InventoryStatus> & { sourceCode: string };

@Component({
  selector: 'app-admin-product-form', standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-product-form.component.html',
  styleUrl: './admin-product-form.component.css'
})
export class AdminProductFormComponent implements OnInit {
  productId?: number; categories: Category[] = []; saving = false;
  form: Partial<Product> = { discountPercentage: 0, categoryIds: [], status: 'ACTIVE' };
  inventories: InventoryForm[] = [];
  private originalInventoryIds = new Set<number>();

  constructor(private route: ActivatedRoute, private router: Router, private products: ProductService,
              private inventory: InventoryService, private toast: ToastService) {}

  ngOnInit(): void {
    this.productId = Number(this.route.snapshot.paramMap.get('id')) || undefined;
    this.products.getCategories().subscribe(r => this.categories = r.data || []);
    if (!this.productId) { this.addInventory(); return; }
    forkJoin({ product: this.products.getProductById(this.productId), stocks: this.inventory.getSources(this.productId) })
      .subscribe({ next: ({product, stocks}) => {
        if (product.data) this.form = {...product.data, categoryIds: product.data.categoryIds || [product.data.categoryId]};
        this.inventories = (stocks.data || []).map(x => ({...x}));
        this.originalInventoryIds = new Set(this.inventories.flatMap(x => x.id ? [x.id] : []));
      }, error: e => this.toast.error(e.error?.message || 'Could not load product.') });
  }

  toggleCategory(id: number, checked: boolean): void {
    const ids = new Set(this.form.categoryIds || []); checked ? ids.add(id) : ids.delete(id); this.form.categoryIds = [...ids];
  }
  addInventory(): void { this.inventories.push({ sourceCode: '', availableQuantity: 0, reorderLevel: 10, warehouseLocation: '' }); }
  removeInventory(index: number): void { this.inventories.splice(index, 1); }

  save(): void {
    if (!this.form.categoryIds?.length) { this.toast.error('Select at least one category.'); return; }
    if (!this.inventories.length) { this.toast.error('Add at least one inventory source.'); return; }
    this.saving = true;
    const payload: any = {...this.form};
    ['id','finalPrice','categoryId','categoryName','categoryNames','createdAt','rating'].forEach(k => delete payload[k]);
    if (this.productId) delete payload.sku;
    const productRequest = this.productId ? this.products.updateProduct(this.productId, payload) : this.products.createProduct(payload);
    productRequest.pipe(switchMap(result => {
      const product = result.data;
      if (!product) throw new Error('Product response is empty');
      const currentIds = new Set(this.inventories.flatMap(x => x.id ? [x.id] : []));
      const deletes = [...this.originalInventoryIds].filter(id => !currentIds.has(id)).map(id => this.inventory.delete(id));
      const saves = this.inventories.map(stock => stock.id
        ? this.inventory.update(stock.id, stock)
        : this.inventory.create({...stock, productId: product.id, sku: product.sku}));
      return (deletes.length || saves.length) ? forkJoin([...deletes, ...saves]) : of([]);
    })).subscribe({ next: () => { this.toast.success(`Product ${this.productId ? 'updated' : 'created'}.`); this.router.navigate(['/admin/products']); },
      error: e => { this.saving = false; this.toast.error(e.error?.message || e.message || 'Could not save product.'); } });
  }
}
