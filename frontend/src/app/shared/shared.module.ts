/**
 * Can be imported in a Testbed module to save typing the various imports.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  imports: [CommonModule],
  exports: [
    CommonModule,
    FormsModule,
    HttpClientTestingModule,
    HttpClientModule,
  ],
  declarations: [],
})
export class SharedModule {}
