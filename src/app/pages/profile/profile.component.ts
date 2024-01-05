import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationModalComponent } from './confirmation-modal/confirmation-modal.component';
import { EmmitNavToHomeService } from '../../services/emmit-nav-to-home.service';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  userForm: FormGroup;
  user: any;

  petList?: any = [];
  paginaterdPets: any[] = []; // Lista de pets exibidos na página atual
  pageSize: number = 3; // Tamanho da página
  currentPage: number = 1; // Página atual
  currentFilter: any;
  totalItems: number = 0;

  
  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private clickEventService: EmmitNavToHomeService

  ) {
    this.userForm = this.fb.group({
      email: [
        '',
        [Validators.required, Validators.email, Validators.maxLength(100)],
      ],
      firstName: ['', [Validators.maxLength(60)]],
      lastName: ['', [Validators.maxLength(60)]],
    });
  }
  selectedFile: File | null = null;

  ngOnInit(): void {
    this.authService.loggedIn();
    this.getUser();
    this.getPublications();
  }

  getUser() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('authorization', `${token}`);
    this.http.get('http://localhost:3000/api/user', { headers }).subscribe(
      (res: any) => {
        this.user = res;
        this.userForm.patchValue({
          email: this.user.email,
          firstName: this.user.firstName,
          lastName: this.user.lastName,

        });
      },
      (error) => {
        this.authService.openSnackBar(error.error.msg, '❗');
      }
    );
  }

  onSubmit() {
    if (this.userForm.valid) {
      const email = this.userForm.get('email')!.value;
      const firstName = this.userForm.get('firstName')!.value;
      const lastName = this.userForm.get('lastName')!.value;
      // console.log(email, firstName, lastName);
      this.updateProfile(email, firstName, lastName);
    }
  }
  getErrorMessage(controlName: string): string {
    const control = this.userForm.get(controlName);

    if (!control) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Field is required';
    }

    if (controlName === 'email' && control.hasError('email')) {
      return 'Invalid email';
    }

    return '';
  }

  openDialog() {
    const dialogRef = this.dialog.open(ConfirmationModalComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.onSubmit();
      } else {
        console.log(result);
      }
    });
  }

  updateProfile(email: string, firstName: string, lastName: string) {
    this.authService.updateProfile(email, firstName, lastName);
  }

  handleFileInput(event: any): void {
    const files: FileList = event.target.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
      this.uploadImage();
    }
  }

  uploadImage(): void {
    if (this.selectedFile) {
      const formData: FormData = new FormData();
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders().set('authorization', `${token}`);
      
      formData.append('file', this.selectedFile);
      this.http
        .post('http://localhost:3000/api/upload', formData, { headers })
        .subscribe((response: any) => {
          try { 
            if(response.update){
              this.getUser();
              this.clickEventService.emitir();
              this.authService.openSnackBar("Image successfully uploaded!", '✅');
            } else{
              this.authService.openSnackBar("Image upload failed. Please try again", '❗');
             }
          } catch (e) {
            
          }
        });
    }
  }


  getPublications() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('authorization', `${token}`);
    this.http
      .get('http://localhost:3000/api/userPublications', { headers })
      .subscribe(
        (res: any) => {
          this.petList = res;
          this.totalItems = this.petList.length;
          this.updatepaginaterdPets('all');
        },
        (error) => {
          this.authService.openSnackBar(error.error.msg, '❗');
        }
      );
  }

  // Método chamado quando a página é alterada
  pageChange(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;
    this.updatepaginaterdPets('all');
  }

  updatepaginaterdPets(filter: any) {
    let filteredList = this.petList;

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;

    // Ajuste para garantir que a quantidade de animais por página seja consistente
    const remainingItems = filteredList.length - startIndex;
    this.paginaterdPets = remainingItems >= this.pageSize
        ? filteredList.slice(startIndex, endIndex)
        : filteredList.slice(startIndex);

    // Atualize o comprimento total da lista para a variável totalItems
    this.totalItems = filteredList.length;
  }
}
