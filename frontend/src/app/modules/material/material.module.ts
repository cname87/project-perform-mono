import { NgModule } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material';
import { MatTabsModule } from '@angular/material/tabs';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';

const material = [
  MatToolbarModule,
  MatButtonModule,
  MatTabsModule,
  MatInputModule,
  MatIconModule,
  MatDividerModule,
  MatSelectModule,
  MatListModule,
];

@NgModule({
  imports: [material],
  exports: [material],
})
export class MaterialModule {}
