import { NgModule } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material';
import { MatTabsModule } from '@angular/material/tabs';

const material = [MatToolbarModule, MatButtonModule, MatTabsModule];

@NgModule({
  imports: [material],
  exports: [material],
})
export class MaterialModule {}
