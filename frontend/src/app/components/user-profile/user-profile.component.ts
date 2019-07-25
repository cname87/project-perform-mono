import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../shared/auth.service/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  profile: any;
  token: any;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.profile.subscribe((profile) => (this.profile = profile));
  }
}
