import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SidebarComponent]
})
export class AccountComponent implements OnInit {
  profileForm: FormGroup;
  showOldPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  selectedCountryCode = '965';
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      oldPassword: [''],
      newPassword: [''],
      confirmPassword: ['']
    });
  }

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.profileForm.patchValue({
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        email: currentUser.email,
        phone: currentUser.phone.split(' ')[1] // Remove country code
      });
    }
  }

  togglePasswordVisibility(field: 'old' | 'new' | 'confirm'): void {
    switch (field) {
      case 'old':
        this.showOldPassword = !this.showOldPassword;
        break;
      case 'new':
        this.showNewPassword = !this.showNewPassword;
        break;
      case 'confirm':
        this.showConfirmPassword = !this.showConfirmPassword;
        break;
    }
  }

  onSubmit(): void {
    if (this.profileForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.successMessage = '';
      this.errorMessage = '';
      
      const formData = this.profileForm.value;
      const currentUser = this.authService.getCurrentUser();
      
      if (!currentUser) {
        this.errorMessage = 'User not found. Please log in again.';
        this.isSubmitting = false;
        return;
      }
      
      const userData: User = {
        ...currentUser,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: `${this.selectedCountryCode} ${formData.phone}`
      };
      
      // Only update password if a new one is provided
      if (formData.newPassword) {
        userData.password = formData.newPassword;
      }
      
      this.userService.updateUser(userData).subscribe({
        next: (updatedUser) => {
          // Update the current user in AuthService
          this.authService.login(updatedUser);
          this.successMessage = 'Profile updated successfully!';
          this.isSubmitting = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to update profile. Please try again.';
          this.isSubmitting = false;
          console.error('Update error:', error);
        }
      });
    }
  }
} 